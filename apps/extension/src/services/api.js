/**
 * ============================================
 * API SERVICE
 * ============================================
 * 
 * Handles all communication with the Express backend.
 * 
 * RESPONSIBILITIES:
 * - Make HTTP requests to API endpoints
 * - Handle network errors gracefully
 * - Retry failed requests
 * - Return standardized responses
 * 
 * ARCHITECTURE:
 * Extension → API Service → Express Backend → PostgreSQL
 */

/**
 * API Configuration
 * 
 * In production, this would come from environment variables
 * For development, we hardcode localhost
 */
const API_CONFIG = {
  // Base URL for all API endpoints
  // Change to production URL when deploying
  baseURL: 'http://localhost:5001',
  
  // Timeout for requests (10 seconds)
  timeout: 10000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 5000  // 5 seconds base delay
}

/**
 * APIService class
 * 
 * Provides methods to interact with backend API
 * All methods are async and return promises
 */
class APIService {
  
  /**
   * HELPER: Make HTTP request with timeout
   * 
   * PROBLEM: fetch() has no built-in timeout
   * If server hangs, request waits forever
   * 
   * SOLUTION: Race fetch against timeout promise
   * Whichever finishes first wins
   * 
   * @param {string} url - Full URL to request
   * @param {object} options - Fetch options (method, headers, body)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Response>}
   */
  static async fetchWithTimeout(url, options = {}, timeout = API_CONFIG.timeout) {
    /**
     * Create abort controller
     * 
     * AbortController allows us to cancel a fetch request
     * Used to implement timeout
     */
    const controller = new AbortController()
    const signal = controller.signal
    
    /**
     * Create timeout promise
     * 
     * This promise rejects after timeout milliseconds
     * When it rejects, we abort the fetch request
     */
    const timeoutId = setTimeout(() => {
      controller.abort()  // Cancel the fetch
    }, timeout)
    
    try {
      /**
       * Make fetch request with abort signal
       * 
       * If timeout occurs, signal.abort() is called
       * Fetch throws AbortError
       */
      const response = await fetch(url, {
        ...options,
        signal  // Pass abort signal to fetch
      })
      
      clearTimeout(timeoutId)  // Clear timeout if request succeeds
      return response
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      /**
       * Handle different error types
       * 
       * AbortError = Timeout
       * TypeError = Network error (offline, DNS failure)
       * Others = Unknown error
       */
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }
  
  /**
   * GET /api/ratings
   * 
   * Fetch all ratings for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of rating objects
   */
  static async getRatings(userId) {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings?user_id=${userId}`
      
      console.log('📡 API: Fetching ratings for user', userId)
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      /**
       * Check HTTP status
       * 
       * 200-299 = Success
       * 400-499 = Client error (bad request)
       * 500-599 = Server error
       */
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log('✅ API: Fetched', data.data?.length || 0, 'ratings')
      
      return data.data || []
      
    } catch (error) {
      console.error('❌ API: Failed to fetch ratings:', error.message)
      
      /**
       * Don't throw error - return empty array
       * 
       * WHY? If API is down, extension should still work
       * with local data. Failing to fetch shouldn't crash app.
       */
      return []
    }
  }
  
  /**
   * POST /api/ratings
   * 
   * Create a new rating in the database
   * 
   * @param {object} ratingData - Rating object to create
   * @returns {Promise<object|null>} Created rating or null if failed
   */
  static async createRating(ratingData) {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings`
      
      console.log('📡 API: Creating rating:', ratingData.show_name)
      
      /**
       * Transform extension format to API format
       * 
       * Extension uses camelCase (showName)
       * API expects snake_case (show_name)
       */
      const apiPayload = {
        user_id: ratingData.user_id || ratingData.userId,
        show_name: ratingData.showName || ratingData.show_name,
        episode_number: ratingData.episodeNumber || ratingData.episode_number,
        episode_title: ratingData.episodeTitle || ratingData.episode_title,
        rating: ratingData.rating,
        platform: ratingData.platform || 'Netflix',
        genre: ratingData.genre,
        url: ratingData.url
      }
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiPayload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('✅ API: Rating created with ID:', data.data?.id)
      
      return data.data
      
    } catch (error) {
      console.error('❌ API: Failed to create rating:', error.message)
      
      /**
       * Return null on failure
       * 
       * Caller (background worker) will retry later
       */
      return null
    }
  }
  
  /**
   * Health check
   * 
   * Verifies API is reachable
   * Used to detect online/offline status
   * 
   * @returns {Promise<boolean>} True if API is reachable
   */
  static async healthCheck() {
    try {
      const url = `${API_CONFIG.baseURL}/health`
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET'
      }, 5000)  // Short timeout for health check
      
      return response.ok
      
    } catch (error) {
      console.log('📴 API: Health check failed (offline or API down)')
      return false
    }
  }
}

/**
 * Export for use in other files
 * 
 * Usage:
 * const ratings = await APIService.getRatings(userId)
 * const created = await APIService.createRating(ratingData)
 */
window.APIService = APIService