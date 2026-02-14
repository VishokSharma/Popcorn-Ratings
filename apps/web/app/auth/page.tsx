'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication logic with Supabase
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <main className={styles.main}>
      {/* Background Elements */}
      <div className={styles.filmGrain}></div>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      {/* Floating Popcorn */}
      <div className={styles.floatingPopcorn}>
        <span className={styles.popcorn1}>🍿</span>
        <span className={styles.popcorn2}>🍿</span>
        <span className={styles.popcorn3}>🍿</span>
        <span className={styles.popcorn4}>🍿</span>
      </div>

      {/* Back to Home */}
      <Link href="/" className={styles.backBtn}>
        <span>←</span>
        <span>Back to Home</span>
      </Link>

      {/* Auth Container */}
      <div className={styles.authContainer}>
        
        {/* Ticket Stub */}
        <div className={styles.ticketStub}>
          <div className={styles.stubText}>ADMIT</div>
          <div className={styles.stubText}>ONE</div>
          <div className={styles.stubIcon}>🎫</div>
        </div>

        {/* Main Auth Card */}
        <div className={styles.authCard}>
          
          {/* Vintage Stamp */}
          <div className={styles.vintageStamp}>
            <span>{isSignUp ? 'NEW' : 'VIP'}</span>
            <span>{isSignUp ? 'MEMBER' : 'ACCESS'}</span>
          </div>

          {/* Header */}
          <div className={styles.authHeader}>
            <div className={styles.popcornLogo}>🍿</div>
            <h1 className={styles.authTitle}>
              {isSignUp ? 'JOIN THE SHOW' : 'WELCOME BACK'}
            </h1>
            <p className={styles.authSubtitle}>
              {isSignUp 
                ? 'Get your ticket to never forget a rating' 
                : 'Continue your binge tracking journey'}
            </p>
          </div>

          <div className={styles.perforation}></div>

          {/* Toggle Tabs */}
          <div className={styles.authTabs}>
            <button 
              className={`${styles.tab} ${!isSignUp ? styles.tabActive : ''}`}
              onClick={() => setIsSignUp(false)}
            >
              SIGN IN
            </button>
            <button 
              className={`${styles.tab} ${isSignUp ? styles.tabActive : ''}`}
              onClick={() => setIsSignUp(true)}
            >
              SIGN UP
            </button>
          </div>

          {/* Form */}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            
            {isSignUp && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>NAME</label>
                <input
                  type="text"
                  name="name"
                  className={styles.formInput}
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>EMAIL</label>
              <input
                type="email"
                name="email"
                className={styles.formInput}
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>PASSWORD</label>
              <input
                type="password"
                name="password"
                className={styles.formInput}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {isSignUp && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={styles.formInput}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {!isSignUp && (
              <div className={styles.forgotPassword}>
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              <span>{isSignUp ? 'GET YOUR TICKET' : 'ENTER THEATER'}</span>
              <span className={styles.btnIcon}>→</span>
            </button>

          </form>

          <div className={styles.perforation}></div>

          {/* Social Login */}
          <div className={styles.socialLogin}>
            <p className={styles.orText}>OR CONTINUE WITH</p>
            
            <div className={styles.socialButtons}>
              <button className={styles.socialBtn}>
                <span className={styles.socialIcon}>G</span>
                <span>Google</span>
              </button>
              <button className={styles.socialBtn}>
                <span className={styles.socialIcon}>@</span>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.authFooter}>
            {isSignUp ? (
              <p>
                Already have a ticket? 
                <button onClick={() => setIsSignUp(false)} className={styles.toggleBtn}>
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have a ticket yet? 
                <button onClick={() => setIsSignUp(true)} className={styles.toggleBtn}>
                  Sign Up
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Features Badges */}
      <div className={styles.featureBadges}>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>🔒</span>
          <span>100% Secure</span>
        </div>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>⚡</span>
          <span>Instant Access</span>
        </div>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>🎬</span>
          <span>Free Forever</span>
        </div>
      </div>

    </main>
  )
}