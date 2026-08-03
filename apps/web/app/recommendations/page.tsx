'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './recommendations.module.css'

interface Recommendation {
  show_name: string
  reason: string
  rank: number
  poster_url: string | null
  generated_at?: string
}

export default function RecommendationsPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load existing cached recommendations on page load (no LLM call)
  useEffect(() => {
    loadCachedRecommendations()
  }, [])

  async function loadCachedRecommendations() {
    try {
      const res = await fetch('/api/recommendations', {
        credentials: 'include'
      })

      if (res.status === 401) {
        router.push('/auth')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load cached recommendations:', err)
    } finally {
      setHasLoaded(true)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate recommendations')
      }

      setRecommendations(data.data || [])

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
        <h1 className={styles.title}>🎯 Recommended For You</h1>
        <p className={styles.subtitle}>Based on your ratings, matched by genre, ranked by AI</p>
      </header>

      <div className={styles.actionBar}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '🎬 Analyzing your taste...' : '✨ Get Recommendations'}
        </button>
      </div>

      {error && (
        <div className={styles.errorBox}>
          ❌ {error}
        </div>
      )}

      {hasLoaded && recommendations.length === 0 && !loading && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍿</div>
          <p>No recommendations yet. Click "Get Recommendations" above!</p>
          <p className={styles.emptyHint}>You need at least one show rated 7 or higher for this to work.</p>
        </div>
      )}

      <div className={styles.grid}>
        {recommendations.map((rec) => (
          <div key={rec.show_name} className={styles.card}>
            <div className={styles.posterWrap}>
              {rec.poster_url ? (
                <img src={rec.poster_url} alt={rec.show_name} className={styles.poster} />
              ) : (
                <div className={styles.posterFallback}>🎬</div>
              )}
              <span className={styles.rankBadge}>#{rec.rank}</span>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.showName}>{rec.show_name}</h3>
              <p className={styles.reason}>{rec.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
