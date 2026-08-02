/**
 * ============================================
 * API SERVICE FOR CHROME EXTENSION
 * ============================================
 * 
 * Handles all communication with Express backend
 * Automatically includes JWT token in requests
 */

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: 'http://localhost:5001',
  timeout: 10000,
}

/**
 * Get JWT token from chrome.storage
 * 
 * @returns {Promise<string|null>} JWT token or null
 */
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['auth_token'], (result) => {
      resolve(result.auth_token || null)
    })
  })
}

/**
 * Save JWT token to chrome.storage
 * 
 * @param {string} token JWT token
 */
async function saveToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth_token: token }, resolve)
  })
}

/**
 * Clear JWT token from chrome.storage
 */
async function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['auth_token'], resolve)
  })
}

/**
 * Get current user from chrome.storage
 * 
 * @returns {Promise<object|null>} User object or null
 */
async function getCurrentUser() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['auth_user'], (result) => {
      resolve(result.auth_user || null)
    })
  })
}

/**
 * Save user to chrome.storage
 * 
 * @param {object} user User object
 */
async function saveUser(user) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth_user: user }, resolve)
  })
}

/**
 * APIService class
 */
class APIService {
  
  /**
   * Make HTTP request with timeout and JWT
   */
  static async fetchWithTimeout(url, options = {}, timeout = API_CONFIG.timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      // Get JWT token
      const token = await getToken()
      
      // Add headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      return response
      
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
  
  /**
   * POST /api/auth/signin
   * 
   * Login user and save token
   */
  static async signin(email, password) {
    try {
      const url = `${API_CONFIG.baseURL}/api/auth/signin`
      
      console.log('🔐 Signing in...')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        throw new Error('Login failed')
      }
      
      const data = await response.json()
      
      // Save token and user
      await saveToken(data.data.accessToken)
      await saveUser(data.data.user)
      
      console.log('✅ Signin successful')
      
      return data.data
      
    } catch (error) {
      console.error('❌ Signin error:', error)
      throw error
    }
  }
  
  /**
   * POST /api/auth/signup
   * 
   * Register new user and save token
   */
  static async signup(email, password, name) {
    try {
      const url = `${API_CONFIG.baseURL}/api/auth/signup`
      
      console.log('📝 Signing up...')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      
      if (!response.ok) {
        throw new Error('Signup failed')
      }
      
      const data = await response.json()
      
      // Save token and user
      await saveToken(data.data.accessToken)
      await saveUser(data.data.user)
      
      console.log('✅ Signup successful')
      
      return data.data
      
    } catch (error) {
      console.error('❌ Signup error:', error)
      throw error
    }
  }
  
  /**
   * POST /api/ratings
   * 
   * Create new rating (requires authentication)
   */
  static async createRating(ratingData) {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings`
      
      console.log('📡 Creating rating:', ratingData.show_name)
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(ratingData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('✅ Rating created with ID:', data.data?.id)
      
      return data.data
      
    } catch (error) {
      console.error('❌ Failed to create rating:', error.message)
      return null
    }
  }
  
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    const token = await getToken()
    const user = await getCurrentUser()
    return !!(token && user)
  }
  
  /**
   * Get current authenticated user
   */
  static async getUser() {
    return getCurrentUser()
  }
  
  /**
   * Logout - clear token and user
   */
  static async logout() {
    await clearToken()
    
    // Also clear from storage
    return new Promise((resolve) => {
      chrome.storage.local.remove(['auth_user'], resolve)
    })
  }
  
  /**
   * Health check
   */
  static async healthCheck() {
    try {
      const url = `${API_CONFIG.baseURL}/health`
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      
      return response.ok
      
    } catch (error) {
      console.log('📴 API health check failed')
      return false
    }
  }
}

// Export for use in extension
window.APIService = APIService