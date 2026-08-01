/**
 * ============================================
 * API CLIENT FOR NEXT.JS DASHBOARD
 * ============================================
 * 
 * Handles all HTTP requests to Express backend
 * Automatically includes JWT token in requests
 * Handles token refresh on 401 errors
 */

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
}

/**
 * TypeScript Interfaces
 */
export interface Rating {
  id: number
  user_id: number
  show_name: string
  episode_number: string | null
  episode_title: string | null
  rating: number
  platform: string
  genre: string | null
  url: string | null
  created_at: string
}

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Store for access token (in memory, not localStorage)
 * Gets cleared on page refresh (good for security)
 */
let accessToken: string | null = null

/**
 * Set access token in memory
 */
export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * Get access token from memory
 */
function getAccessToken(): string | null {
  return accessToken
}

/**
 * Refresh access token using refresh token (in cookie)
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    console.log('🔄 Refreshing access token...')

    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // Send refresh token cookie
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    const newAccessToken = data.data?.accessToken

    if (newAccessToken) {
      setAccessToken(newAccessToken)
      console.log('✅ Access token refreshed')
      return newAccessToken
    }

    return null

  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return null
  }
}

/**
 * API Client Class
 */
export class ApiClient {
  
  /**
   * Make HTTP request with timeout and JWT
   */
  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit = {},
    retry = true
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    
    // Get access token from memory
    const token = getAccessToken()
    
    // Add Authorization header if token exists
    const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}

// Safely merge existing headers
  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers)
  }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      let response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include',  // Send refresh token cookie
      })
      
      clearTimeout(timeoutId)

      // If 401 (token expired), try to refresh
      if (response.status === 401 && retry) {
        console.log('⚠️ Access token expired, attempting refresh...')
        
        const newToken = await refreshAccessToken()
        
        if (newToken) {
          // Retry with new token
          headers['Authorization'] = `Bearer ${newToken}`
          
          response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
            credentials: 'include',
          })
        }
      }
      
      return response
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }
  
  /**
   * GET /api/ratings
   */
  static async getRatings(userId: number): Promise<Rating[]> {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings?user_id=${userId}`
      
      console.log('📡 Fetching ratings from API...')
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        cache: 'no-store',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: ApiResponse<Rating[]> = await response.json()
      
      console.log('✅ Fetched', data.data?.length || 0, 'ratings')
      
      return data.data || []
      
    } catch (error) {
      console.error('❌ Failed to fetch ratings:', error)
      return []
    }
  }
  
  /**
   * POST /api/ratings
   */
  static async createRating(
    ratingData: Omit<Rating, 'id' | 'created_at' | 'user_id'>
  ): Promise<Rating | null> {
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
      
      const data: ApiResponse<Rating> = await response.json()
      
      console.log('✅ Rating created with ID:', data.data?.id)
      
      return data.data || null
      
    } catch (error) {
      console.error('❌ Failed to create rating:', error)
      return null
    }
  }
  
  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const url = `${API_CONFIG.baseURL}/health`
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
      })
      
      return response.ok
      
    } catch (error) {
      console.log('📴 API health check failed')
      return false
    }
  }
}