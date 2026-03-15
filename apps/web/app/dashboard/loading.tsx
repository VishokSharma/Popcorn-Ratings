/**
 * ============================================
 * DASHBOARD LOADING STATE
 * ============================================
 * 
 * Shows while dashboard fetches data from API
 * 
 * Next.js automatically shows this component
 * when dashboard/page.tsx is loading data
 */

import styles from './dashboard.module.css'

export default function DashboardLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍿 Your Ratings</h1>
        <p className={styles.subtitle}>Loading your ratings...</p>
      </div>

      {/* Stats Loading Skeleton */}
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.skeleton} style={{ width: '60px', height: '40px', marginBottom: '8px' }}></div>
            <div className={styles.skeleton} style={{ width: '100px', height: '16px' }}></div>
          </div>
        ))}
      </div>

      {/* Ratings List Loading Skeleton */}
      <div className={styles.ratingsSection}>
        <div className={styles.skeleton} style={{ width: '200px', height: '24px', marginBottom: '16px' }}></div>
        
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.ratingCard}>
            <div className={styles.skeleton} style={{ width: '100%', height: '60px' }}></div>
          </div>
        ))}
      </div>
    </div>
  )
}