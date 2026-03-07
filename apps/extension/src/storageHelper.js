/**
 * ============================================
 * POPCORN RATINGS - Storage Helper
 * ============================================
 * 
 * Central module for all chrome.storage operations.
 * 
 * WHY THIS EXISTS:
 * Instead of scattered storage calls throughout the
 * codebase, all storage logic lives here. This means:
 * - Consistent data structure
 * - Easy to update logic in one place
 * - Easy to test and debug
 * 
 * PATTERN USED: Module Pattern (IIFE)
 * Wraps everything in a function that runs immediately,
 * creating a private scope. Only exports what it wants.
 */

const StorageHelper = (function() {

  /**
   * STORAGE KEYS
   * 
   * Constants for storage key names.
   * Using constants avoids typos like 'rating' vs 'ratings'
   */
  const KEYS = {
    RATINGS: 'ratings',       // All ratings array
    USER: 'user',             // Current user info
    SYNC_QUEUE: 'syncQueue',  // Pending sync items
    SETTINGS: 'settings'      // App settings
  }

  /**
   * SYNC STATUS CONSTANTS
   * 
   * Possible states for a rating's sync status.
   * Using constants instead of strings prevents typos.
   * 
   * Example of bug without constants:
   * if (rating.syncStatus === 'Pending') // WRONG - capital P
   * if (rating.syncStatus === SYNC_STATUS.PENDING) // SAFE
   */
  const SYNC_STATUS = {
    PENDING: 'pending',   // Saved locally, not yet sent to API
    SYNCING: 'syncing',   // Currently uploading to API
    SYNCED: 'synced',     // Successfully saved in database
    FAILED: 'failed'      // API call failed, needs retry
  }

  /**
   * generateId()
   * 
   * Creates a UUID (Universally Unique Identifier)
   * 
   * HOW IT WORKS:
   * crypto.randomUUID() uses cryptographically secure
   * random number generation built into the browser/V8.
   * 
   * OUTPUT EXAMPLE:
   * "550e8400-e29b-41d4-a716-446655440000"
   * 
   * WHY NOT Math.random()?
   * Math.random() is NOT cryptographically secure and
   * can have collisions. UUID is designed for uniqueness.
   */
  function generateId() {
    return crypto.randomUUID()
  }

  /**
   * getAllRatings()
   * 
   * Fetches all ratings from chrome.storage.local
   * 
   * WHY ASYNC/AWAIT?
   * chrome.storage.local is asynchronous - it takes time
   * to read from disk. We use a Promise to handle this
   * cleanly instead of callbacks.
   * 
   * RETURNS: Array of rating objects (empty array if none)
   */
  async function getAllRatings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([KEYS.RATINGS], (result) => {
        // If no ratings exist yet, return empty array
        // The || [] handles the case where result.ratings is undefined
        resolve(result[KEYS.RATINGS] || [])
      })
    })
  }

  /**
   * saveRating(ratingData)
   * 
   * Saves a new rating to chrome.storage.local
   * Automatically adds sync metadata (id, status, etc.)
   * 
   * PARAMS:
   * ratingData - Object from content.js with show info
   * 
   * WHAT IT ADDS:
   * - id: UUID for this rating
   * - syncStatus: 'pending' (not yet synced)
   * - syncedAt: null (not yet synced)
   * - retryCount: 0 (no retries yet)
   * - createdAt: ISO timestamp
   * 
   * RETURNS: The complete rating object with metadata
   */
  async function saveRating(ratingData) {
    // Get existing ratings first
    const existingRatings = await getAllRatings()

    /**
     * Create enhanced rating with sync metadata
     * 
     * SPREAD OPERATOR (...):
     * {...ratingData} copies all existing fields
     * Then we add our new fields after
     * 
     * If ratingData has {showName: "BB", rating: 10}
     * Result is {showName: "BB", rating: 10, id: "uuid", ...}
     */
    const enhancedRating = {
      ...ratingData,                         // Copy all existing fields
      id: generateId(),                      // Add unique ID
      syncStatus: SYNC_STATUS.PENDING,       // Not synced yet
      syncedAt: null,                        // No sync time yet
      retryCount: 0,                         // No retries yet
      createdAt: new Date().toISOString()    // ISO format: "2026-02-17T10:30:00.000Z"
    }

    // Add new rating to existing array
    const updatedRatings = [...existingRatings, enhancedRating]

    // Save back to storage
    // Wrapped in Promise so we can await it
    await new Promise((resolve) => {
      chrome.storage.local.set({ [KEYS.RATINGS]: updatedRatings }, resolve)
    })

    console.log('💾 Rating saved locally:', enhancedRating)
    
    // Return the enhanced rating so caller has access to the ID
    return enhancedRating
  }

  /**
   * updateSyncStatus(id, status, extras)
   * 
   * Updates the sync status of a specific rating
   * 
   * PARAMS:
   * - id: UUID of the rating to update
   * - status: New SYNC_STATUS value
   * - extras: Additional fields to update (optional)
   * 
   * HOW IT WORKS:
   * 1. Load all ratings
   * 2. Find the one with matching ID
   * 3. Update its sync fields
   * 4. Save back to storage
   * 
   * This is like doing SQL: UPDATE ratings SET syncStatus = ? WHERE id = ?
   */
  async function updateSyncStatus(id, status, extras = {}) {
    const ratings = await getAllRatings()

    /**
     * Array.map() - Transform each element
     * 
     * Goes through every rating and:
     * - If ID matches: update sync fields
     * - If ID doesn't match: return unchanged
     */
    const updatedRatings = ratings.map(rating => {
      if (rating.id === id) {
        return {
          ...rating,           // Keep all existing fields
          syncStatus: status,  // Update sync status
          ...extras            // Apply any additional updates
        }
      }
      return rating            // Not this rating, return unchanged
    })

    await new Promise((resolve) => {
      chrome.storage.local.set({ [KEYS.RATINGS]: updatedRatings }, resolve)
    })

    console.log(`🔄 Rating ${id} status updated to: ${status}`)
  }

  /**
   * markAsSynced(id, databaseId)
   * 
   * Marks a rating as successfully synced to database
   * 
   * PARAMS:
   * - id: Local UUID
   * - databaseId: UUID returned from database after insert
   * 
   * WHY STORE DATABASE ID?
   * For future operations (update/delete) we need the
   * database's version of the ID to send to the API
   */
  async function markAsSynced(id, databaseId) {
    await updateSyncStatus(id, SYNC_STATUS.SYNCED, {
      syncedAt: new Date().toISOString(),  // Record when it synced
      databaseId: databaseId               // Store the DB's ID
    })
  }

  /**
   * markAsFailed(id)
   * 
   * Marks a rating sync as failed and increments retry counter
   * 
   * The retryCount is used in Phase 3B to implement
   * exponential backoff (wait longer between each retry)
   */
  async function markAsFailed(id) {
    const ratings = await getAllRatings()
    const rating = ratings.find(r => r.id === id)
    
    // Increment retry count for exponential backoff
    const currentRetryCount = rating?.retryCount || 0

    await updateSyncStatus(id, SYNC_STATUS.FAILED, {
      retryCount: currentRetryCount + 1,        // One more attempt
      lastFailedAt: new Date().toISOString()    // When did it fail?
    })
  }

  /**
   * getPendingRatings()
   * 
   * Returns all ratings that haven't been synced yet
   * These are the ones we need to upload to the API
   * 
   * STATUSES THAT NEED SYNC:
   * - 'pending': Never attempted
   * - 'failed': Attempted but failed (will retry)
   * 
   * NOTE: 'syncing' is NOT included - those are
   * currently being processed (avoid duplicate uploads)
   */
  async function getPendingRatings() {
    const ratings = await getAllRatings()
    
    /**
     * Array.filter() - Keep only elements matching condition
     * 
     * Returns only ratings where syncStatus is pending or failed
     */
    return ratings.filter(rating => 
      rating.syncStatus === SYNC_STATUS.PENDING ||
      rating.syncStatus === SYNC_STATUS.FAILED
    )
  }

  /**
   * deleteRating(id)
   * 
   * Removes a rating from local storage
   * (API deletion will be handled separately in Phase 3B)
   * 
   * PARAMS:
   * - id: UUID of the rating to delete
   */
  async function deleteRating(id) {
    const ratings = await getAllRatings()
    
    // Array.filter() to keep everything EXCEPT the one to delete
    const updatedRatings = ratings.filter(rating => rating.id !== id)
    
    await new Promise((resolve) => {
      chrome.storage.local.set({ [KEYS.RATINGS]: updatedRatings }, resolve)
    })

    console.log(`🗑️ Rating ${id} deleted from local storage`)
    return true
  }

  /**
   * getUser()
   * 
   * Returns the currently logged in user
   * For Phase 3A, we return a hardcoded test user
   * 
   * IMPORTANT: This will be replaced in Phase 4 (Auth)
   * when we implement real authentication
   * 
   * WHY HARDCODE NOW?
   * We need a user_id to save ratings to the database.
   * Rather than blocking backend sync on auth, we use
   * a test user. This is normal practice in dev.
   */
  async function getUser() {
    return new Promise((resolve) => {
      chrome.storage.local.get([KEYS.USER], (result) => {
        if (result[KEYS.USER]) {
          resolve(result[KEYS.USER])
        } else {
          /**
           * TEMPORARY: Hardcoded test user
           * 
           * Replace YOUR_TEST_USER_ID with the actual UUID
           * from your Supabase users table
           * 
           * Find it: Supabase Dashboard → Table Editor
           *          → users table → copy the id value
           */
          resolve({
            id: 'da74b886-a630-4256-94a9-30b2e54bb27d',   // ← Replace this!
            email: 'test@popcornratings.com',
            name: 'Test User'
          })
        }
      })
    })
  }

  /**
   * setUser(userData)
   * 
   * Stores user info in local storage
   * Will be used in Phase 4 when auth is implemented
   */
  async function setUser(userData) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ [KEYS.USER]: userData }, resolve)
    })
    console.log('👤 User set:', userData)
  }

  /**
   * getStats()
   * 
   * Calculates quick stats from local ratings
   * Used by popup.js to show summary info
   * 
   * RETURNS:
   * {
   *   total: number,
   *   synced: number,
   *   pending: number,
   *   avgRating: number
   * }
   */
  async function getStats() {
    const ratings = await getAllRatings()
    
    if (ratings.length === 0) {
      return { total: 0, synced: 0, pending: 0, avgRating: 0 }
    }

    const synced = ratings.filter(r => r.syncStatus === SYNC_STATUS.SYNCED).length
    const pending = ratings.filter(r => 
      r.syncStatus === SYNC_STATUS.PENDING || 
      r.syncStatus === SYNC_STATUS.FAILED
    ).length

    // Calculate average rating using reduce
    // reduce() accumulates a value across all elements
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / ratings.length

    return {
      total: ratings.length,
      synced,
      pending,
      avgRating: parseFloat(avgRating.toFixed(1))
    }
  }

  /**
   * clearAll()
   * 
   * Removes ALL data from storage
   * DANGEROUS - only use for testing/debugging
   * 
   * Usage in Chrome DevTools console:
   * StorageHelper.clearAll()
   */
  async function clearAll() {
    await new Promise((resolve) => {
      chrome.storage.local.clear(resolve)
    })
    console.warn('⚠️ All storage cleared!')
  }

  /**
   * PUBLIC API
   * 
   * These are the functions exposed to other files.
   * Functions NOT listed here are private to this module.
   * 
   * This is the Module Pattern - exposes only what's needed.
   */
  return {
    saveRating,
    getAllRatings,
    getPendingRatings,
    updateSyncStatus,
    markAsSynced,
    markAsFailed,
    deleteRating,
    getUser,
    setUser,
    getStats,
    clearAll,
    SYNC_STATUS,
    KEYS
  }

})()

// Make available globally within extension
window.StorageHelper = StorageHelper