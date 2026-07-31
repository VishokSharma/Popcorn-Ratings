/**
 * ============================================
 * SERVER-SIDE AUTH HELPER
 * ============================================
 * 
 * Used in server components to read JWT from cookies
 * and authenticate requests to API
 */

import { cookies } from 'next/headers'

/**
 * Get JWT token from cookies (server-side only)
 */
export async function getServerToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    return token || null
  } catch (error) {
    console.error('Failed to get token from cookies:', error)
    return null
  }
}

/**
 * Make authenticated API request from server
 */
export async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const token = await getServerToken()
    
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${endpoint}`
    
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
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',  // Include cookies
    })
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return data.data || null
    
  } catch (error) {
    console.error('API request failed:', error)
    return null
  }
}