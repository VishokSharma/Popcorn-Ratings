/**
 * ============================================
 * BACKGROUND SERVICE WORKER
 * ============================================
 * 
 * Runs in the background (even when popup is closed)
 * 
 * RESPONSIBILITIES:
 * - Listen for new ratings to sync
 * - Sync pending ratings to API
 * - Retry failed syncs with exponential backoff
 * - Handle online/offline events
 * 
 * SERVICE WORKER LIFECYCLE:
 * - Starts when extension loads
 * - Can be terminated by browser to save resources
 * - Restarts when needed (message received, alarm triggered)
 */

console.log('🍿 Background worker started')

/**
 * Sync configuration
 */
const SYNC_CONFIG = {
  // How often to check for pending ratings (5 minutes)
  intervalMinutes: 5,
  
  // Maximum retry attempts before giving up
  maxRetries: 10,
  
  // Base delay for exponential backoff (5 seconds)
  baseDelay: 5000
}

/**
 * ============================================
 * SYNC PENDING RATINGS
 * ============================================
 * 
 * Main sync function - finds pending ratings and syncs them
 */
async function syncPendingRatings() {
  console.log('🔄 Starting sync process...')
  
  try {
    /**
     * Get all pending ratings from storage
     * 
     * Pending = status is 'pending' or 'failed'
     * (Already synced ratings are skipped)
     */
    const result = await chrome.storage.local.get(['ratings'])
    const allRatings = result.ratings || []
    
    const pendingRatings = allRatings.filter(r => 
      r.syncStatus === 'pending' || r.syncStatus === 'failed'
    )
    
    if (pendingRatings.length === 0) {
      console.log('✅ No pending ratings to sync')
      return
    }
    
    console.log(`📤 Found ${pendingRatings.length} ratings to sync`)
    
    /**
     * Check if API is reachable
     * 
     * No point trying to sync if offline
     */
    const isOnline = await checkAPIHealth()
    
    if (!isOnline) {
      console.log('📴 API not reachable, will retry later')
      return
    }
    
    /**
     * Sync each pending rating
     * 
     * Process sequentially (not parallel) to avoid
     * overwhelming API with burst of requests
     */
    for (const rating of pendingRatings) {
      await syncSingleRating(rating)
      
      // Small delay between requests (100ms)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('✅ Sync process complete')
    
  } catch (error) {
    console.error('❌ Sync process error:', error)
  }
}

/**
 * Sync a single rating
 * 
 * @param {object} rating - Rating object to sync
 */
async function syncSingleRating(rating) {
  try {
    console.log(`📡 Syncing rating: ${rating.showName}`)
    
    /**
     * Mark as 'syncing' to prevent duplicate sync attempts
     * 
     * If user rates another episode while this syncs,
     * we don't want to sync this one twice
     */
    await updateRatingStatus(rating.id, 'syncing')
    
    /**
     * Get user info
     * 
     * We need user_id to associate rating with user in database
     */
    const user = await getUser()
    
    if (!user || !user.id) {
      throw new Error('No user found')
    }
    
    /**
     * Prepare rating data for API
     * 
     * Include user_id from user object
     */
    const ratingData = {
      user_id: user.id,
      showName: rating.showName,
      episodeNumber: rating.episodeNumber,
      episodeTitle: rating.episodeTitle,
      rating: rating.rating,
      platform: rating.platform || 'Netflix',
      genre: rating.genre,
      url: rating.url
    }
    
    /**
     * Call API to create rating
     * 
     * This is defined in api.js (loaded via manifest)
     * We need to use chrome.scripting or message passing
     * 
     * PROBLEM: Service workers can't access content script globals
     * SOLUTION: Replicate API call here or use messaging
     * 
     * For simplicity, we'll replicate the API call
     */
    const apiURL = 'http://localhost:5001/api/ratings'
    
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: ratingData.user_id,
        show_name: ratingData.showName,
        episode_number: ratingData.episodeNumber,
        episode_title: ratingData.episodeTitle,
        rating: ratingData.rating,
        platform: ratingData.platform,
        genre: ratingData.genre,
        url: ratingData.url
      })
    })
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }
    
    const result = await response.json()
    
    /**
     * Mark as synced
     * 
     * Store database ID for future reference
     */
    await updateRatingStatus(rating.id, 'synced', {
      syncedAt: new Date().toISOString(),
      databaseId: result.data?.id
    })
    
    console.log(`✅ Synced: ${rating.showName}`)
    
  } catch (error) {
    console.error(`❌ Failed to sync ${rating.showName}:`, error.message)
    
    /**
     * Increment retry count and mark as failed
     * 
     * Will be retried on next sync cycle
     */
    const retryCount = (rating.retryCount || 0) + 1
    
    await updateRatingStatus(rating.id, 'failed', {
      retryCount,
      lastFailedAt: new Date().toISOString()
    })
  }
}

/**
 * Update rating sync status in storage
 * 
 * @param {string} id - Rating ID
 * @param {string} status - New sync status
 * @param {object} extras - Additional fields to update
 */
async function updateRatingStatus(id, status, extras = {}) {
  const result = await chrome.storage.local.get(['ratings'])
  const ratings = result.ratings || []
  
  const updatedRatings = ratings.map(r => {
    if (r.id === id) {
      return {
        ...r,
        syncStatus: status,
        ...extras
      }
    }
    return r
  })
  
  await chrome.storage.local.set({ ratings: updatedRatings })
}

/**
 * Get current user from storage
 * 
 * @returns {Promise<object>} User object
 */
async function getUser() {
  const result = await chrome.storage.local.get(['user'])
  
  if (result.user) {
    return result.user
  }
  
  /**
   * TEMPORARY: Return test user
   * 
   * Replace with actual user ID from your Supabase users table
   * This should match the user_id in your database
   */
  return {
    id: 1,  // ← CHANGE THIS to your actual test user ID
    email: 'test@popcornratings.com',
    name: 'Test User'
  }
}

/**
 * Check if API is healthy/reachable
 * 
 * @returns {Promise<boolean>}
 */
async function checkAPIHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:5001/health', {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId);
    return response.ok
    
  } catch (error) {
    return false
  }
}

/**
 * ============================================
 * EVENT LISTENERS
 * ============================================
 */

/**
 * Listen for messages from content scripts
 * 
 * Content script can trigger sync by sending message:
 * chrome.runtime.sendMessage({ action: 'syncNow' })
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncNow') {
    console.log('📨 Sync requested via message')
    syncPendingRatings().then(() => {
      sendResponse({ success: true })
    })
    return true  // Keep channel open for async response
  }
  
  if (request.action === 'syncPending') {
    console.log('📨 New rating pending sync')
    // Sync after short delay (let user see success message first)
    setTimeout(() => syncPendingRatings(), 2000)
    sendResponse({ success: true })
  }
})

/**
 * Set up periodic sync alarm
 * 
 * Runs syncPendingRatings every X minutes
 * even if extension popup is closed
 */
chrome.alarms.create('periodicSync', {
  periodInMinutes: SYNC_CONFIG.intervalMinutes
})

/**
 * Listen for alarm events
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    console.log('⏰ Periodic sync triggered')
    syncPendingRatings()
  }
})

/**
 * Sync immediately on extension install/update
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Extension installed/updated')
  syncPendingRatings()
})

/**
 * Initial sync when background script loads
 */
syncPendingRatings()

console.log('✅ Background worker initialized')