
/**
 * ============================================
 * AUTHENTICATION CONTEXT
 * ============================================
 * 
 * Provides global authentication state
 * Available to all components via useAuth() hook
 */

'use client'

import { createContext, useContext, useState, useEffect } from 'react'

/**
 * User type
 */
interface User {
  id: number
  email: string
  name: string
  created_at: string
}

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

/**
 * Create context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 * 
 * Wraps app and provides auth state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Load token from localStorage on mount
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setLoading(false)
  }, [])

  /**
   * Login function
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)

      const response = await fetch('http://localhost:5001/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()

      // Save token and user
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.data.user))

      setToken(data.data.token)
      setUser(data.data.user)

      console.log('✅ Login successful')
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Signup function
   */
  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)

      const response = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        throw new Error('Signup failed')
      }

      const data = await response.json()

      // Save token and user
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.data.user))

      setToken(data.data.token)
      setUser(data.data.user)

      console.log('✅ Signup successful')
    } catch (error) {
      console.error('❌ Signup error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    console.log('✅ Logged out')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
