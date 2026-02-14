/**
 * Popcorn Ratings - Popup Script
 */

// DOM Elements
const elements = {
  showTitle: document.getElementById('show-title'),
  episodeInfo: document.getElementById('episode-info'),
  ratingValue: document.getElementById('rating-value'),
  ratingCount: document.getElementById('rating-count'),
  dashboardBtn: document.getElementById('dashboard-btn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🍿 Popcorn Ratings popup loaded');
  await loadCurrentShow();
  attachEventListeners();
});

/**
 * Load current show from active Netflix tab
 */
async function loadCurrentShow() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if on Netflix
    if (!tab.url || !tab.url.includes('netflix.com')) {
      showFallbackState('Open Netflix to see ratings');
      return;
    }
    
    // Ask content script for current show info
    chrome.tabs.sendMessage(tab.id, { action: 'getCurrentShow' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready:', chrome.runtime.lastError.message);
        showFallbackState('Play a show on Netflix');
        return;
      }
      
      if (response && response.isPlaying) {
        await displayShowInfo(response);
      } else {
        showFallbackState('Play a show on Netflix');
      }
    });
    
  } catch (error) {
    console.error('Error loading show:', error);
    showFallbackState('Error loading show');
  }
}

/**
 * Display show information
 */
async function displayShowInfo(showData) {
  // Show title (big text)
  elements.showTitle.textContent = showData.showName || showData.title || 'Unknown Show';
  
  // Episode info (smaller text)
  if (showData.episodeNumber && showData.episodeTitle) {
    elements.episodeInfo.textContent = `${showData.episodeNumber}: ${showData.episodeTitle}`;
  } else if (showData.episodeNumber) {
    elements.episodeInfo.textContent = showData.episodeNumber;
  } else {
    elements.episodeInfo.textContent = 'Movie';
  }
  
  // Get ratings from storage and calculate average
  await displayRating(showData.showName || showData.title);
}

/**
 * Calculate and display rating for current show
 */
async function displayRating(showName) {
  try {
    const result = await chrome.storage.local.get(['ratings']);
    const allRatings = result.ratings || [];
    
    // Filter ratings for this show
    const showRatings = allRatings.filter(r => 
      (r.showName && r.showName === showName) || 
      (r.title && r.title.includes(showName))
    );
    
    if (showRatings.length === 0) {
      elements.ratingValue.textContent = '-';
      elements.ratingCount.textContent = '(0)';
      return;
    }
    
    // Calculate average
    const sum = showRatings.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / showRatings.length;
    
    elements.ratingValue.textContent = avg.toFixed(1);
    elements.ratingCount.textContent = `(${showRatings.length})`;
    
  } catch (error) {
    console.error('Error calculating rating:', error);
    elements.ratingValue.textContent = '-';
    elements.ratingCount.textContent = '(0)';
  }
}

/**
 * Show fallback state when no show detected
 */
function showFallbackState(message) {
  elements.showTitle.textContent = message;
  elements.episodeInfo.textContent = '';
  elements.ratingValue.textContent = '-';
  elements.ratingCount.textContent = '(0)';
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  elements.dashboardBtn.addEventListener('click', () => {
    console.log('📊 Opening dashboard...');
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });
}

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.ratings) {
    console.log('🔄 Ratings updated');
    loadCurrentShow();
  }
});

/**
 * Listen for episode changes from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'episodeChanged') {
    console.log('🔄 Episode changed, refreshing popup...');
    loadCurrentShow();  // Reload the popup UI
    sendResponse({ success: true });
  }
});