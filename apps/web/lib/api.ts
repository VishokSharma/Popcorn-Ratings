/**
 * ============================================
 * API CLIENT FOR NEXT.JS DASHBOARD
 * ============================================
 * 
 * Handles all HTTP requests to Express backend
 * 
 * CONCEPTS:
 * - Centralized API calls (one place to change base URL)
 * - Type-safe responses (TypeScript interfaces)
 * - Error handling
 * - Retry logic for failed requests
 */

/**
 * API Configuration
 */
const API_CONFIG = {
  // Base URL for API
  // In production, this would be an environment variable
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  
  // Request timeout (10 seconds)
  timeout: 10000,
}

/**
 * TypeScript Interfaces
 * 
 * Define the shape of data we expect from API
 * Helps catch errors at compile time
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
 * API Client Class
 */
export class ApiClient {
  
  /**
   * Make HTTP request with timeout
   * 
   * @param url - Full URL to request
   * @param options - Fetch options
   * @returns Response
   */
  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
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
   * 
   * Fetch all ratings for a user
   * 
   * @param userId - User ID
   * @returns Array of ratings
   */
  static async getRatings(userId: number): Promise<Rating[]> {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings?user_id=${userId}`
      
      console.log('📡 Fetching ratings from API...')
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Important for Next.js: disable caching for dynamic data
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
      
      // Return empty array instead of throwing
      // Dashboard should still render even if API is down
      return []
    }
  }
  
  /**
   * POST /api/ratings
   * 
   * Create a new rating
   * 
   * @param ratingData - Rating to create
   * @returns Created rating or null
   */
  static async createRating(
    ratingData: Omit<Rating, 'id' | 'created_at'>
  ): Promise<Rating | null> {
    try {
      const url = `${API_CONFIG.baseURL}/api/ratings`
      
      console.log('📡 Creating rating:', ratingData.show_name)
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * 
   * @returns True if API is reachable
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