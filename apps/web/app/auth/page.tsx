'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function AuthPage() {
  const router = useRouter()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call Next.js Route Handler (not Express directly!)
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login'
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(isSignUp && { name })
        }),
        credentials: 'include',  // Important: send cookies
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Authentication failed')
      }

      // Success! Wait a moment for cookie to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Refresh to ensure cookie is picked up
      router.refresh()
      
      // Then redirect
      // Success! Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 200)

    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.marqueeLights}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={styles.bulb}></div>
        ))}
      </div>

      <div className={styles.authBox}>
        <div className={styles.header}>
          <h1 className={styles.logo}>
            <span className={styles.icon}>🍿</span>
            POPCORN RATINGS
          </h1>
          <p className={styles.subtitle}>Rate. Share. Enjoy.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${!isSignUp ? styles.active : ''}`}
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tab} ${isSignUp ? styles.active : ''}`}
              onClick={() => setIsSignUp(true)}
            >
              Sign Up
            </button>
          </div>

          {error && <div className={styles.error}>❌ {error}</div>}

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {isSignUp && (
            <div className={styles.inputGroup}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}