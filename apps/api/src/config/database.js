/**
 * ============================================
 * DATABASE CONNECTION POOL
 * ============================================
 * 
 * This file creates and exports a PostgreSQL connection pool.
 * 
 * CONNECTION POOL CONCEPT:
 * Instead of creating a new database connection for every request,
 * we maintain a "pool" of reusable connections.
 * 
 * Think of it like a taxi stand:
 * - Without pool: Call new taxi for every trip (slow, expensive)
 * - With pool: Taxis waiting at stand, grab one and return (fast, efficient)
 * 
 * BENEFITS:
 * - Faster queries (no connection overhead)
 * - Limited connections (don't overwhelm database)
 * - Auto-reconnection (handles network issues)
 */

const { Pool } = require('pg')

/**
 * Load environment variables from .env file
 * This makes process.env.DB_HOST available
 */
require('dotenv').config()

/**
 * Create PostgreSQL connection pool
 * 
 * CONFIGURATION:
 * - host: Where PostgreSQL is running (localhost via Docker)
 * - port: PostgreSQL port (5432 is default)
 * - database: Which database to connect to
 * - user: PostgreSQL username
 * - password: PostgreSQL password
 * - max: Maximum connections in pool (20 is good default)
 * - idleTimeoutMillis: Close idle connections after 30s
 * - connectionTimeoutMillis: Fail if can't connect in 2s
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'popcorn_ratings',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  
  // Pool configuration
  max: 20,                      // Maximum 20 connections in pool
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Fail fast if can't connect in 2s
})

/**
 * Test database connection on startup
 * 
 * This helps catch configuration errors early:
 * - Wrong password → fails immediately on startup
 * - Database not running → fails immediately
 * - Instead of failing on first API request
 */
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

/**
 * Handle connection errors
 * 
 * If database connection is lost (network issue, DB restart),
 * this logs the error instead of crashing the server
 */
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err)
  // Don't process.exit() - let pool retry connection
})

/**
 * Export the pool for use in other files
 * 
 * Usage in routes:
 * const pool = require('./config/database')
 * const result = await pool.query('SELECT * FROM ratings')
 */
module.exports = pool
