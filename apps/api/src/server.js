/**
 * ============================================
 * EXPRESS API SERVER - MAIN ENTRY POINT
 * ============================================
 * 
 * This file:
 * 1. Creates Express application
 * 2. Configures middleware (CORS, JSON parsing, etc.)
 * 3. Registers API routes
 * 4. Starts the server
 * 
 * To run:
 * node src/server.js
 * 
 * Or in development (auto-restart on changes):
 * npm run dev
 */

// Load environment variables from .env file
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const pool = require('./config/database')
const errorHandler = require('./middleware/errorHandler')

/**
 * CREATE EXPRESS APP
 * 
 * The app object represents your API server
 * You configure it, then start it with app.listen()
 */
const app = express()

/**
 * CONFIGURATION
 * 
 * Get port from environment variable or default to 5000
 * process.env.PORT comes from .env file
 */
const PORT = process.env.PORT || 5000

/**
 * ============================================
 * MIDDLEWARE SETUP
 * ============================================
 * 
 * Middleware runs in order, before route handlers
 */

/**
 * 1. CORS (Cross-Origin Resource Sharing)
 * 
 * WHY NEEDED:
 * Your extension runs on chrome-extension://abc123
 * Your API runs on http://localhost:5000
 * Different origins = browser blocks requests
 * 
 * CORS adds headers that tell browser:
 * "It's okay, allow this cross-origin request"
 * 
 * CONFIGURATION:
 * - origin: Which origins can access API
 * - credentials: Allow cookies/auth headers
 * - methods: Which HTTP methods are allowed
 */
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost and chrome extensions
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

/**
 * 2. JSON Body Parser
 * 
 * Parses JSON request bodies and makes them available
 * in req.body
 * 
 * Without this:
 * req.body = undefined
 * 
 * With this:
 * req.body = { user_id: 1, rating: 10, ... }
 */
app.use(express.json())

/**
 * 3. URL-Encoded Parser
 * 
 * Parses URL-encoded form data (application/x-www-form-urlencoded)
 * 
 * Example: name=John&age=30
 * Becomes: { name: 'John', age: '30' }
 */
app.use(express.urlencoded({ extended: true }))

/**
 * 4. Request Logger (Development Only)
 * 
 * Logs every request to console
 * Helps with debugging
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`)
    next()  // Pass to next middleware/route
  })
}

/**
 * ============================================
 * ROUTES
 * ============================================
 */

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify server is running
 * 
 * GET /health
 * Response: { status: 'ok', timestamp: '2026-02-17...' }
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * Database Health Check
 * 
 * Verifies database connection is working
 * 
 * GET /health/db
 * Response: { status: 'ok', database: 'connected' }
 */
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT NOW()')
    res.json({
      status: 'ok',
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    })
  }
})

/**
 * API Routes
 * 
 * Import and register route modules
 * 
 * app.use('/api/ratings', ratingsRoutes)
 * Maps all routes from ratingsRoutes under /api/ratings
 * 
 * So router.get('/') becomes GET /api/ratings
 * And router.post('/') becomes POST /api/ratings
 */
const ratingsRoutes = require('./routes/ratings')
app.use('/api/ratings', ratingsRoutes)

/**
 * 404 Handler - Catch-all for undefined routes
 * 
 * If request doesn't match any route above,
 * this catches it and returns 404
 * 
 * Must be defined AFTER all routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  })
})

/**
 * ============================================
 * ERROR HANDLER
 * ============================================
 * 
 * Catches errors from any route handler
 * Must be registered LAST
 */
app.use(errorHandler)

/**
 * ============================================
 * START SERVER
 * ============================================
 * 
 * Listen for incoming HTTP requests
 * 
 * app.listen(port, callback)
 * - port: Which port to listen on
 * - callback: Function to run when server starts
 */
app.listen(PORT, () => {
  console.log('🍿 ====================================')
  console.log('🍿  POPCORN RATINGS API SERVER')
  console.log('🍿 ====================================')
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/ratings`)
  console.log(`🗄️  Database: ${process.env.DB_NAME}`)
  console.log('🍿 ====================================')
})

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 * 
 * Handle Ctrl+C (SIGINT) and termination (SIGTERM)
 * Cleanly close database connections before exiting
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  
  // Close database pool
  await pool.end()
  console.log('✅ Database connections closed')
  
  // Exit process
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...')
  await pool.end()
  process.exit(0)
})