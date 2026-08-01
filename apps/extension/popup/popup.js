/**
 * Popcorn Ratings - Popup Script
 */

// DOM Elements
const elements = {
  showTitle: document.getElementById('show-title'),
  episodeInfo: document.getElementById('episode-info'),
  ratingValue: document.getElementById('rating-value'),
  ratingCount: document.getElementById('rating-count'),
  dashboardBtn: document.getElementById('dashboard-btn'),
  posterImage: document.getElementById('poster-image'),  // ← ADD THIS
  placeholderIcon: document.getElementById('placeholder-icon')  // ← ADD THIS
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
 * Fetch poster from TMDB API
 */
async function fetchPoster(showName) {
  try {
    const TMDB_API_KEY = 'a0345fb274682b8789f29be371c3bfad';  // Your API key
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(showName)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const poster = data.results[0].poster_path;
      if (poster) {
        return `https://image.tmdb.org/t/p/w500${poster}`;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error fetching poster:', error);
    return null;
  }
}

/**
 * Display show information
 */
async function displayShowInfo(showData) {
  const showName = showData.showName || showData.title || 'Unknown Show';
  
  // Show title (big text)
  elements.showTitle.textContent = showName;
  
  // Episode info (smaller text)
  if (showData.episodeNumber && showData.episodeTitle) {
    elements.episodeInfo.textContent = `${showData.episodeNumber}: ${showData.episodeTitle}`;
  } else if (showData.episodeNumber) {
    elements.episodeInfo.textContent = showData.episodeNumber;
  } else {
    elements.episodeInfo.textContent = 'Movie';
  }
  
  // Fetch and display poster
  const posterUrl = await fetchPoster(showName);
  if (posterUrl) {
    elements.posterImage.src = posterUrl;
    elements.posterImage.style.display = 'block';
    elements.placeholderIcon.style.display = 'none';
  } else {
    elements.posterImage.style.display = 'none';
    elements.placeholderIcon.style.display = 'block';
  }
  
  // Get ratings from storage and calculate average
  await displayRating(showName);
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