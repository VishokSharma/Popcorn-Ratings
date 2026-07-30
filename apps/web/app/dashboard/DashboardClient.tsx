'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
const { user, token, loading, logout } = useAuth()

import { useState } from 'react'
import Link from 'next/link'
import styles from './dashboard.module.css'

interface Rating {
  title: string
  showName: string
  episodeNumber: string
  episodeTitle: string
  rating: number
  timestamp: number
  url: string
  platform?: string
  genre?: string
}

export default function DashboardClient({ initialRatings }: { initialRatings: Rating[] }) {

  const router = useRouter()
  const { user, token, loading } = useAuth()


  const [ratings, setRatings] = useState<Rating[]>(initialRatings)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterRating, setFilterRating] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [showUserMenu, setShowUserMenu] = useState(false)


  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !token) {
      // Redirect to login if not authenticated
      router.push('/auth')
    }
  }, [loading, token, router])

  // Show loading while checking auth
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
  }

  // Don't render dashboard if not authenticated
  if (!token) {
    return null
  }

  // Calculate stats
  const totalShows = new Set(ratings.map(r => r.showName)).size
  const totalEpisodes = ratings.length
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0'
  
  const thisMonth = ratings.filter(r => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return r.timestamp > monthAgo
  }).length

  // Platform distribution
  const platformCounts = ratings.reduce((acc, r) => {
    const platform = r.platform || 'Unknown'
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Genre distribution
  const genreCounts = ratings.reduce((acc, r) => {
    const genre = r.genre || 'Unknown'
    acc[genre] = (acc[genre] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Rating distribution (1-10)
  const ratingDist = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: ratings.filter(r => r.rating === i + 1).length
  }))

  // Top rated shows
  const showAverages = ratings.reduce((acc, r) => {
    const show = acc[r.showName]
    if (!show) {
        acc[r.showName] = { total: r.rating, count: 1, platform: r.platform || '' }
    } else {
        show.total += r.rating
        show.count += 1
    }
    return acc
    }, {} as Record<string, { total: number; count: number; platform: string }>)

  const topShows = Object.entries(showAverages)
    .map(([name, data]) => ({
      name,
      avg: (data.total / data.count).toFixed(1),
      count: data.count,
      platform: data.platform
    }))
    .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))
    .slice(0, 5)

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    
    // Format as DD/MM/YYYY (consistent across server/client)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
    }

  // Delete rating
  const handleDelete = (timestamp: number) => {
    if (confirm('Delete this rating?')) {
      setRatings(ratings.filter(r => r.timestamp !== timestamp))
    }
  }

  // Export data
  const handleExport = () => {
    const json = JSON.stringify(ratings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `popcorn-ratings-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Filtered ratings
  const filteredRatings = ratings
    .filter(r => {
      if (searchQuery && !r.showName.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false
      if (filterRating !== 'all') {
        if (filterRating === 'high' && r.rating < 8) return false
        if (filterRating === 'mid' && (r.rating < 5 || r.rating >= 8)) return false
        if (filterRating === 'low' && r.rating >= 5) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return b.timestamp - a.timestamp
        case 'date-asc': return a.timestamp - b.timestamp
        case 'rating-desc': return b.rating - a.rating
        case 'rating-asc': return a.rating - b.rating
        default: return 0
      }
    })

  return (
    <main className={styles.dashboard}>
      
      {/* Marquee Lights */}
      <div className={styles.marqueeLights}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={styles.bulb}></div>
        ))}
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🍿</span>
            <span className={styles.logoText}>POPCORN RATINGS</span>
          </Link>

          <div className={styles.headerRight}>
            <div className={styles.quickActions}>
              <button className={styles.actionBtn}>
                <span>➕</span> Add Rating
              </button>
              <button className={styles.actionBtn}>
                <span>⬇️</span> Install Extension
              </button>
            </div>

            <div className={styles.userMenu}>
              <button 
                className={styles.userBtn}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className={styles.userAvatar}>👤</span>
                <span>{user?.name || 'User'}</span>
              </button>
              
              {showUserMenu && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    {user?.email}
                  </div>
                  <a href="#settings">⚙️ Settings</a>
                  <a href="#profile">👤 Profile</a>
                  <button 
                    onClick={() => {
                      logout()
                      router.push('/auth')
                    }}
                    className={styles.logoutBtn}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Hero Stats */}
      <section className={styles.heroStats}>
        <div className={styles.statsGrid}>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statValue}>{totalShows}</div>
            <div className={styles.statLabel}>Shows Rated</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎬</div>
            <div className={styles.statValue}>{totalEpisodes}</div>
            <div className={styles.statLabel}>Episodes Rated</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statValue}>{avgRating}</div>
            <div className={styles.statLabel}>Average Rating</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statValue}>{thisMonth}</div>
            <div className={styles.statLabel}>This Month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>7</div>
            <div className={styles.statLabel}>Day Streak</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎭</div>
            <div className={styles.statValue}>{Object.keys(genreCounts)[0] || 'N/A'}</div>
            <div className={styles.statLabel}>Top Genre</div>
          </div>

        </div>
      </section>

      {/* Filters & Search */}
      <section className={styles.controls}>
        <div className={styles.controlsInner}>
          
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search your ratings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className={styles.select}>
            <option value="all">All Platforms</option>
            <option value="Netflix">Netflix</option>
            <option value="Prime Video">Prime Video</option>
            <option value="Hotstar">Hotstar</option>
          </select>

          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className={styles.select}>
            <option value="all">All Ratings</option>
            <option value="high">8-10 ⭐</option>
            <option value="mid">5-7 ⭐</option>
            <option value="low">1-4 ⭐</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
            <option value="date-desc">Latest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="rating-asc">Lowest Rated</option>
          </select>

          <button onClick={handleExport} className={styles.exportBtn}>
            📥 Export
          </button>

        </div>
      </section>

      {/* Main Content Grid */}
      <div className={styles.mainContent}>
        
        {/* Left Column - Recent Ratings */}
        <div className={styles.leftColumn}>
          
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>RECENT RATINGS</h2>
            <span className={styles.sectionCount}>{filteredRatings.length} shows</span>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : filteredRatings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎬</div>
              <p>No ratings found. Start watching!</p>
            </div>
          ) : (
            <div className={styles.ratingsList}>
              {filteredRatings.slice(0, 10).map((rating) => (
                <div key={rating.id || rating.timestamp} className={styles.ratingCard}>
                  
                  <div className={styles.cardLeft}>
                    <div className={styles.cardThumbnail}>
                      <span className={styles.thumbnailIcon}>🎬</span>
                    </div>
                  </div>

                  <div className={styles.cardMiddle}>
                    <h3 className={styles.cardTitle}>{rating.showName}</h3>
                    <p className={styles.cardEpisode}>
                      {rating.episodeNumber}: {rating.episodeTitle}
                    </p>
                    <div className={styles.cardMeta}>
                      <span className={styles.platformBadge}>{rating.platform}</span>
                      <span className={styles.cardDate}>{formatDate(rating.timestamp)}</span>
                    </div>
                  </div>

                  <div className={styles.cardRight}>
                    <div className={styles.cardRating}>
                      <span className={styles.ratingNum}>{rating.rating}</span>
                      <span className={styles.ratingStar}>⭐</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.actionIcon} title="Edit">✏️</button>
                      <button 
                        className={styles.actionIcon} 
                        title="Delete"
                        onClick={() => handleDelete(rating.timestamp)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Column - Insights */}
        <div className={styles.rightColumn}>
          
          {/* Top Rated Shows */}
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>🏆 TOP RATED SHOWS</h3>
            <div className={styles.topShowsList}>
              {topShows.map((show, idx) => (
                <div key={show.name} className={styles.topShowItem}>
                  <span className={styles.topShowRank}>#{idx + 1}</span>
                  <div className={styles.topShowInfo}>
                    <div className={styles.topShowName}>{show.name}</div>
                    <div className={styles.topShowMeta}>
                      {show.count} episodes • {show.platform}
                    </div>
                  </div>
                  <div className={styles.topShowRating}>{show.avg} ⭐</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Distribution */}
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>📺 PLATFORM BREAKDOWN</h3>
            <div className={styles.platformList}>
              {Object.entries(platformCounts).map(([platform, count]) => {
                const percentage = ((count / totalEpisodes) * 100).toFixed(0)
                return (
                  <div key={platform} className={styles.platformItem}>
                    <div className={styles.platformInfo}>
                      <span className={styles.platformName}>{platform}</span>
                      <span className={styles.platformPercent}>{percentage}%</span>
                    </div>
                    <div className={styles.platformBar}>
                      <div 
                        className={styles.platformBarFill} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>📊 RATING DISTRIBUTION</h3>
            <div className={styles.ratingDistribution}>
              {ratingDist.filter(r => r.count > 0).map((item) => (
                <div key={item.rating} className={styles.distItem}>
                  <span className={styles.distRating}>{item.rating}⭐</span>
                  <div className={styles.distBar}>
                    <div 
                      className={styles.distBarFill}
                      style={{ 
                        width: `${(item.count / totalEpisodes) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className={styles.distCount}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>🏅 ACHIEVEMENTS</h3>
            <div className={styles.achievementsList}>
              <div className={styles.achievement}>
                <span className={styles.achievementIcon}>🏆</span>
                <span className={styles.achievementText}>First Rating</span>
              </div>
              {totalEpisodes >= 10 && (
                <div className={styles.achievement}>
                  <span className={styles.achievementIcon}>🌟</span>
                  <span className={styles.achievementText}>10 Episodes Rated</span>
                </div>
              )}
              {parseFloat(avgRating) >= 8 && (
                <div className={styles.achievement}>
                  <span className={styles.achievementIcon}>⭐</span>
                  <span className={styles.achievementText}>Generous Rater</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2026 Popcorn Ratings • v1.0.0</p>
          <div className={styles.footerLinks}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hi@popcornratings.com">Contact</a>
            <a href="https://github.com/VishokSharma/Popcorn-Ratings" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}
