/**
 * Popcorn Ratings - Popup Script
 */

const WEB_APP_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001';

// DOM Elements
const elements = {
  showTitle: document.getElementById('show-title'),
  episodeInfo: document.getElementById('episode-info'),
  ratingValue: document.getElementById('rating-value'),
  ratingCount: document.getElementById('rating-count'),
  dashboardBtn: document.getElementById('dashboard-btn'),
  posterImage: document.getElementById('poster-image'),
  placeholderIcon: document.getElementById('placeholder-icon'),
  authLoggedOut: document.getElementById('auth-logged-out'),
  authLoggedIn: document.getElementById('auth-logged-in'),
  authUserName: document.getElementById('auth-user-name'),
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🍿 Popcorn Ratings popup loaded');
  await checkAuthStatus();
  await loadCurrentShow();
  attachEventListeners();
});

/**
 * Check if user is logged in.
 * First checks local extension storage (fast path — already synced before).
 * If not found, tries to pick up the session from the website's
 * refresh_token cookie (user may have just logged in on the site).
 */
async function checkAuthStatus() {
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get(['auth_token', 'auth_user'], resolve);
  });

  if (stored.auth_token && stored.auth_user) {
    showLoggedInState(stored.auth_user);
    return;
  }

  await syncSessionFromWebsite();
}

/**
 * Pick up an existing website login session.
 * Calls the Next.js refresh endpoint (browser should auto-attach the
 * refresh_token cookie since we have host_permissions for the site),
 * then fetches the user's profile from the API with the new token.
 */
async function syncSessionFromWebsite() {
  try {
    const refreshRes = await fetch(`${WEB_APP_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!refreshRes.ok) {
      console.log('📴 No active website session found');
      showLoggedOutState();
      return;
    }

    const refreshData = await refreshRes.json();
    const accessToken = refreshData.data?.accessToken;

    if (!accessToken) {
      showLoggedOutState();
      return;
    }

    const meRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!meRes.ok) {
      showLoggedOutState();
      return;
    }

    const meData = await meRes.json();
    const user = meData.data;

    // Save to extension storage — background sync and content script
    // already read auth_token from here, nothing else needs to change
    await new Promise((resolve) => {
      chrome.storage.local.set({ auth_token: accessToken, auth_user: user }, resolve);
    });

    console.log('✅ Session synced from website:', user.email);
    showLoggedInState(user);

  } catch (error) {
    console.log('📴 Could not sync session from website:', error.message);
    showLoggedOutState();
  }
}

function showLoggedInState(user) {
  elements.authLoggedOut.style.display = 'none';
  elements.authLoggedIn.style.display = 'flex';
  elements.authUserName.textContent = user.name || user.email || 'User';
}

function showLoggedOutState() {
  elements.authLoggedOut.style.display = 'flex';
  elements.authLoggedIn.style.display = 'none';
}

/**
 * Load current show from active Netflix tab
 */
async function loadCurrentShow() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('netflix.com')) {
      showFallbackState('Open Netflix to see ratings');
      return;
    }
    
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
 * Fetch poster from TMDB API
 */
async function fetchPoster(showName) {
  try {
    const TMDB_API_KEY = 'a0345fb274682b8789f29be371c3bfad';
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
  
  elements.showTitle.textContent = showName;
  
  if (showData.episodeNumber && showData.episodeTitle) {
    elements.episodeInfo.textContent = `${showData.episodeNumber}: ${showData.episodeTitle}`;
  } else if (showData.episodeNumber) {
    elements.episodeInfo.textContent = showData.episodeNumber;
  } else {
    elements.episodeInfo.textContent = 'Movie';
  }
  
  const posterUrl = await fetchPoster(showName);
  if (posterUrl) {
    elements.posterImage.src = posterUrl;
    elements.posterImage.style.display = 'block';
    elements.placeholderIcon.style.display = 'none';
  } else {
    elements.posterImage.style.display = 'none';
    elements.placeholderIcon.style.display = 'block';
  }
  
  await displayRating(showName);
}

/**
 * Calculate and display rating for current show
 */
async function displayRating(showName) {
  try {
    const result = await chrome.storage.local.get(['ratings']);
    const allRatings = result.ratings || [];
    
    const showRatings = allRatings.filter(r => 
      (r.showName && r.showName === showName) || 
      (r.title && r.title.includes(showName))
    );
    
    if (showRatings.length === 0) {
      elements.ratingValue.textContent = '-';
      elements.ratingCount.textContent = '(0)';
      return;
    }
    
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
    chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` });
  });

  elements.loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/auth` });
  });

  elements.logoutBtn.addEventListener('click', async () => {
    await new Promise((resolve) => {
      chrome.storage.local.remove(['auth_token', 'auth_user'], resolve);
    });
    showLoggedOutState();
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
    loadCurrentShow();
    sendResponse({ success: true });
  }
});