/**
 * ============================================
 * API CLIENT FOR NEXT.JS DASHBOARD
 * ============================================
 * 
 * Handles all HTTP requests to Express backend
 * Automatically includes JWT token in requests
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
 * Get JWT token from localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
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
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    
    // Get JWT token from localStorage
    const token = getToken()
    
    // Add Authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include',  // ← ADD THIS: Send cookies with request
      })
      
      clearTimeout(timeoutId)
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