/**
 * Popcorn Ratings - Netflix Content Script
 * Detects episode endings and triggers rating popup
 */

console.log("🍿 Popcorn Ratings content script loaded");

let autoplayDetected = false;
let cachedMetadata = null;

/**
 * Capture show metadata from Netflix DOM
 */
function captureMetadata() {
    let previousShowName = '';  
    
    const observer = new MutationObserver(() => {
      const titleElement = document.querySelector('[data-uia="video-title"]');
      
      if (titleElement) {
        const showName = titleElement.querySelector('h4')?.textContent || '';
        const spans = titleElement.querySelectorAll('span');
        const episodeNumber = spans[0]?.textContent || '';
        const episodeTitle = spans[1]?.textContent || '';
        
        const newMetadata = {
          showName: showName.trim(),
          episodeNumber: episodeNumber.trim(),
          episodeTitle: episodeTitle.trim(),
          fullTitle: `${showName} - ${episodeNumber} ${episodeTitle}`.trim()
        };
        
        // Check if episode changed (different from previous)
        if (newMetadata.fullTitle !== cachedMetadata?.fullTitle) {
          cachedMetadata = newMetadata;
          console.log('📺 New episode detected:', cachedMetadata);
          
          // Notify popup about new episode
          notifyPopupOfNewEpisode(cachedMetadata);
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('👀 Metadata observer started');
  }

  /**
   * Notify popup when episode changes
   */
  function notifyPopupOfNewEpisode(metadata) {
    chrome.runtime.sendMessage({
      action: 'episodeChanged',
      metadata: metadata
    }).catch(() => {
      // Popup not open, that's fine
    });
  }

/**
 * Check if Netflix autoplay UI is visible
 */
function isAutoplayUIVisible() {
  return !!document.querySelector('[data-uia^="next-episode-seamless-button"]');
}

/**
 * Get current episode/movie metadata
 */
function getCurrentMetadata() {
  // Always get fresh metadata (don't rely on cache)
  const titleElement = document.querySelector('[data-uia="video-title"]');
  
  if (titleElement) {
    const showName = titleElement.querySelector('h4')?.textContent || '';
    const spans = titleElement.querySelectorAll('span');
    const episodeNumber = spans[0]?.textContent || '';
    const episodeTitle = spans[1]?.textContent || '';
    
    const freshMetadata = {
      showName: showName.trim(),
      episodeNumber: episodeNumber.trim(),
      episodeTitle: episodeTitle.trim(),
      fullTitle: `${showName} - ${episodeNumber} ${episodeTitle}`.trim()
    };
    
    // Update cache
    cachedMetadata = freshMetadata;
    return freshMetadata;
  }
  
  // If cached exists, return it
  if (cachedMetadata) {
    return cachedMetadata;
  }
  
  // Fallback: use page title
  const pageTitle = document.title.replace(' | Netflix', '').replace(' - Netflix', '').trim();
  return {
    showName: pageTitle,
    episodeNumber: '',
    episodeTitle: '',
    fullTitle: pageTitle
  };
}

/**
 * Pause the current video
 */
function pauseCurrentVideo() {
  const video = document.querySelector("video");

  if (!video) {
    console.warn("⚠️ No video element found");
    return;
  }

  if (video.paused) {
    console.log("ℹ️ Video already paused");
    return;
  }

  video.pause();
  console.log("⏸ Video paused by extension");
}

/**
 * Resume video playback
 */
function resumeVideo() {
  const video = document.querySelector("video");
  if (video && video.paused) {
    video.play();
    console.log("▶️ Video resumed");
  }
}

/**
 * Log all ratings in a table format
 */
function logAllRatingsTable() {
  chrome.storage.local.get(["ratings"], (result) => {
    const ratings = result.ratings || [];

    if (!ratings.length) {
      console.log("No ratings stored yet.");
      return;
    }

    const tableData = ratings.map((r, index) => ({
      "#": index + 1,
      Show: r.showName || r.title,
      Episode: r.episodeNumber || '-',
      Rating: r.rating,
      Date: new Date(r.timestamp).toLocaleString(),
    }));

    console.table(tableData);
  });
}

/**
 * Handle rating submission
 */
function handleRatingSubmit(rating) {
  const metadata = getCurrentMetadata();

  const newRating = {
    title: metadata.fullTitle,
    showName: metadata.showName,
    episodeNumber: metadata.episodeNumber,
    episodeTitle: metadata.episodeTitle,
    rating: rating,
    timestamp: Date.now(),
    url: window.location.href,
  };

  console.log(`⭐ Rating submitted: ${rating}/10 for "${metadata.fullTitle}"`);

  chrome.storage.local.get(["ratings"], (result) => {
    const ratings = result.ratings || [];
    ratings.push(newRating);

    chrome.storage.local.set({ ratings }, () => {
      console.log("💾 Rating saved to Chrome local storage");
      logAllRatingsTable();
    });
  });
}

/**
 * Handle skip action
 */
function handleSkip() {
  console.log('⏭ Rating skipped');
}

/**
 * Called when autoplay/episode end is detected
 */
function onAutoplayDetected() {
  if (autoplayDetected) return;
  
  autoplayDetected = true;
  console.log("⭐ Episode end detected!");

  pauseCurrentVideo();

  const metadata = getCurrentMetadata();

  if (window.PopcornRating) {
    setTimeout(() => {
      window.PopcornRating.open({
        episodeTitle: metadata.fullTitle,
        showName: metadata.showName,
        episodeNumber: metadata.episodeNumber,
        episodeName: metadata.episodeTitle,
        onSubmit: handleRatingSubmit,
        onSkip: handleSkip
      });
    }, 300);
  } else {
    console.error('❌ PopcornRating not loaded');
  }
}

/**
 * MutationObserver to detect Netflix autoplay UI
 */
const autoplayObserver = new MutationObserver((mutations) => {
  if (autoplayDetected) return;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;

      if (node.querySelector?.('[data-uia^="next-episode-seamless-button"]')) {
        onAutoplayDetected();
        return;
      }

      if (node.matches?.('[data-uia^="next-episode-seamless-button"]')) {
        onAutoplayDetected();
        return;
      }
    }
  }
});

/**
 * Reset detection when autoplay UI disappears
 */
setInterval(() => {
  if (autoplayDetected && !isAutoplayUIVisible()) {
    autoplayDetected = false;
    cachedMetadata = null;
    console.log("🔄 Ready for next episode");
  }
}, 1000);

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentShow') {
    const metadata = getCurrentMetadata();
    const video = document.querySelector('video');
    
    sendResponse({
      isPlaying: video && !video.paused,
      title: metadata.showName,
      episodeNumber: metadata.episodeNumber,
      episodeTitle: metadata.episodeTitle,
      fullTitle: metadata.fullTitle
    });
  }
  return true;
});

/**
 * Initialize
 */
function init() {
  captureMetadata();
  
  autoplayObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  console.log("🍿 Popcorn Ratings initialized");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

