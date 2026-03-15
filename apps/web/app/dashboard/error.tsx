'use client'

/**
 * ============================================
 * DASHBOARD ERROR STATE
 * ============================================
 * 
 * Shows when data fetching fails
 * 
 * Must be a Client Component ('use client')
 * because it uses interactivity (reset button)
 */

import styles from './dashboard.module.css'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍿 Your Ratings</h1>
        <p className={styles.subtitle}>Oops! Something went wrong</p>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(255, 59, 48, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 59, 48, 0.3)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ marginBottom: '8px' }}>Failed to load ratings</h2>
        <p style={{ color: '#999', marginBottom: '24px' }}>
          {error.message || 'Could not connect to the API server'}
        </p>
        
        <button
          onClick={reset}
          style={{
            background: '#ff3b30',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Try Again
        </button>
        
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666',
        }}>
          <strong>Troubleshooting:</strong>
          <ul style={{ textAlign: 'left', marginTop: '8px' }}>
            <li>Make sure the API server is running (<code>npm run dev</code> in <code>apps/api</code>)</li>
            <li>Check that PostgreSQL is running (<code>docker ps</code>)</li>
            <li>Verify API is accessible at <code>http://localhost:5001/health</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}