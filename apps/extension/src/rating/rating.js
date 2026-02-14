/**
 * Popcorn Ratings - Rating Component
 * Creates and manages the rating popup UI
 */

const PopcornRating = (function () {
  let currentRating = 0;
  let isOpen = false;
  let onSubmitCallback = null;
  let onSkipCallback = null;

  // Rating reactions
  const reactions = [
    '',
    'Trash 🗑️',
    'Awful 💀',
    'Bad 👎',
    'Meh 😑',
    'Okay 🤷',
    'Good 👍',
    'Great 🔥',
    'Amazing 🚀',
    'Incredible 💎',
    'Masterpiece 👑'
  ];

  /**
   * Creates the HTML structure for the rating popup
   */
  function createPopupHTML(displayText = '') {
    return `
      <div class="pcr-overlay" id="pcr-overlay">
        <div class="pcr-overlay-bg" id="pcr-overlay-bg"></div>
        
        <div class="pcr-modal" id="pcr-modal">
          <button class="pcr-close" id="pcr-close" aria-label="Close">×</button>
          
          <!-- Popcorn Display -->
          <div class="pcr-popcorn-display">
            <div class="pcr-tub">🍿</div>
          </div>
          
          <!-- Title -->
          <h1 class="pcr-title">POPCORN RATINGS</h1>
          
          <!-- Admit One Badge -->
          <div class="pcr-admit-badge">
            <span>★ RATE THIS SHOW ★</span>
          </div>
          
          <!-- Show/Episode Info -->
          <div class="pcr-subtitle" id="pcr-episode-details">
            ${displayText || 'How was this episode? 🎬'}
          </div>
          
          <!-- Rating Label -->
          <div class="pcr-rating-label">SELECT YOUR RATING</div>
          
          <!-- Stars Container -->
          <div class="pcr-stars-container" id="pcr-stars-container"></div>
          
          <!-- Rating Text Display -->
          <div class="pcr-rating-text" id="pcr-rating-text"></div>
          
          <!-- Perforation -->
          <div class="pcr-perforation"></div>
          
          <!-- Buttons -->
          <div class="pcr-buttons">
            <button class="pcr-btn pcr-btn-skip" id="pcr-btn-skip">SKIP</button>
            <button class="pcr-btn pcr-btn-submit" id="pcr-btn-submit" disabled>SUBMIT RATING</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generates star elements
   */
  function generateStars() {
    const container = document.getElementById('pcr-stars-container');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
      const star = document.createElement('span');
      star.className = 'pcr-star';
      star.dataset.value = i;
      star.innerHTML = `⭐<span class="pcr-star-num">${i}</span>`;
      container.appendChild(star);
    }

    attachStarListeners();
  }

  /**
   * Attaches event listeners to stars
   */
  function attachStarListeners() {
    const stars = document.querySelectorAll('.pcr-star');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.value);
        updateStarsUI();
        updateRatingText();
        updateSubmitButton();
      });

      star.addEventListener('mouseenter', () => {
        highlightStars(parseInt(star.dataset.value));
      });

      star.addEventListener('mouseleave', () => {
        highlightStars(currentRating);
      });
    });
  }

  /**
   * Highlights stars up to a certain value
   */
  function highlightStars(value) {
    const stars = document.querySelectorAll('.pcr-star');
    stars.forEach(star => {
      const starValue = parseInt(star.dataset.value);
      star.classList.toggle('pcr-active', starValue <= value);
    });
  }

  /**
   * Updates the stars UI based on current rating
   */
  function updateStarsUI() {
    highlightStars(currentRating);
  }

  /**
   * Updates the rating text display
   */
  function updateRatingText() {
    const ratingText = document.getElementById('pcr-rating-text');
    if (ratingText && currentRating > 0) {
      ratingText.textContent = `${currentRating}/10 • ${reactions[currentRating]}`;
    }
  }

  /**
   * Updates submit button state
   */
  function updateSubmitButton() {
    const submitBtn = document.getElementById('pcr-btn-submit');
    if (submitBtn) {
      submitBtn.disabled = currentRating === 0;
    }
  }

  /**
   * Attaches main event listeners
   */
  function attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('pcr-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Background click to close
    const overlayBg = document.getElementById('pcr-overlay-bg');
    if (overlayBg) {
      overlayBg.addEventListener('click', close);
    }

    // Skip button
    const skipBtn = document.getElementById('pcr-btn-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (onSkipCallback) {
          onSkipCallback();
        }
        close();
      });
    }

    // Submit button
    const submitBtn = document.getElementById('pcr-btn-submit');

if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    if (currentRating > 0) {
      if (onSubmitCallback) {
        onSubmitCallback(currentRating);
      }

      const modal = document.getElementById('pcr-modal');
      if (modal) {
        modal.classList.add('pcr-success');
      }

      close(); // close immediately
    }
  });
}

    // Escape key to close
    document.addEventListener('keydown', handleKeyDown);
  }

  /**
   * Handles keyboard events
   */
  function handleKeyDown(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
    }

    // Number keys 1-9 and 0 for rating
    if (e.key >= '1' && e.key <= '9') {
      currentRating = parseInt(e.key);
      updateStarsUI();
      updateRatingText();
      updateSubmitButton();
    }
    if (e.key === '0') {
      currentRating = 10;
      updateStarsUI();
      updateRatingText();
      updateSubmitButton();
    }
  }

  /**
   * Opens the rating popup
   */
  function open(options = {}) {
    if (isOpen) return;

    const { 
      episodeTitle = '', 
      showName = '',
      episodeNumber = '',
      episodeName = '',
      onSubmit = null, 
      onSkip = null 
    } = options;
    
    // Format the display text
    let displayText = episodeTitle;
    if (showName && episodeNumber && episodeName) {
      displayText = `${showName}<br><span class="pcr-episode-title">${episodeNumber}: ${episodeName}</span>`;
    }

    onSubmitCallback = onSubmit;
    onSkipCallback = onSkip;
    currentRating = 0;

    // Remove existing popup if any
    const existing = document.getElementById('pcr-overlay');
    if (existing) {
      existing.remove();
    }

    // Create and inject popup
    const container = document.createElement('div');
    container.innerHTML = createPopupHTML(displayText);
    document.body.appendChild(container.firstElementChild);

    // Generate stars
    generateStars();

    // Attach listeners
    attachEventListeners();

    // Show popup with animation
    requestAnimationFrame(() => {
      const overlay = document.getElementById('pcr-overlay');
      if (overlay) {
        overlay.classList.add('pcr-active');
      }
    });

    isOpen = true;
    console.log('🍿 Popcorn Ratings popup opened');
  }

  /**
   * Closes the rating popup
   */
  function close() {
    const overlay = document.getElementById('pcr-overlay');
    if (!overlay) return;

    overlay.classList.remove('pcr-active');

    setTimeout(() => {
      overlay.remove();
      isOpen = false;
      currentRating = 0;
      document.removeEventListener('keydown', handleKeyDown);
      console.log('🍿 Popcorn Ratings popup closed');
    }, 400);
  }

  /**
   * Check if popup is currently open
   */
  function isPopupOpen() {
    return isOpen;
  }

  // Public API
  return {
    open,
    close,
    isOpen: isPopupOpen
  };
})();

// Make it globally accessible
window.PopcornRating = PopcornRating;