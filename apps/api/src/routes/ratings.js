/**
 * ============================================
 * RATINGS API ROUTES
 * ============================================
 * 
 * Handles all /api/ratings endpoints
 * 
 * ENDPOINTS:
 * GET  /api/ratings?user_id=1  - Get all ratings for a user
 * POST /api/ratings            - Create a new rating
 * 
 * CONCEPTS:
 * - Router: Groups related routes together
 * - Async/Await: Handle database queries cleanly
 * - Try/Catch: Handle errors gracefully
 * - SQL Parameterization: Prevent SQL injection
 */

const express = require('express')
const router = express.Router()
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')  

/**
 * ============================================
 * GET /api/ratings
 * ============================================
 * 
 * Fetch all ratings for a specific user
 * 
 * QUERY PARAMETERS:
 * - user_id (required): ID of the user
 * 
 * EXAMPLE REQUEST:
 * GET /api/ratings?user_id=1
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "user_id": 1,
 *       "show_name": "Breaking Bad",
 *       "rating": 10,
 *       ...
 *     }
 *   ]
 * }
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user_id from authenticated token (now from cookie!)
    const user_id = req.user.id
    
    console.log(`📋 Fetching ratings for user ${user_id}`)

    const result = await pool.query(
      `SELECT id, user_id, show_name, episode_number, episode_title, rating, platform, genre, url, created_at
       FROM ratings 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    )

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('❌ Error fetching ratings:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ratings'
    })
  }
})

/**
 * ============================================
 * POST /api/ratings
 * ============================================
 * 
 * Create a new rating
 * 
 * REQUEST BODY (JSON):
 * {
 *   "user_id": 1,
 *   "show_name": "Breaking Bad",
 *   "episode_number": "S5E14",
 *   "episode_title": "Ozymandias",
 *   "rating": 10,
 *   "platform": "Netflix",
 *   "genre": "Drama",
 *   "url": "https://netflix.com/..."
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 6,
 *     "user_id": 1,
 *     "show_name": "Breaking Bad",
 *     ...
 *   }
 * }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    /**
     * Extract data from request body
     * 
     * req.body is parsed by express.json() middleware
     * (configured in server.js)
     */
    // Get user_id from authenticated token (not request body)
    const user_id = req.user.id

    const {
      show_name,
      episode_number,
      episode_title,
      rating,
      platform,
      genre,
      url
    } = req.body

    if (!show_name || !rating) {
      return res.status(400).json({
        success: false,
        error: 'show_name and rating are required'
      })
    }

    /**
     * VALIDATION: Check rating is between 1-10
     * 
     * Database has CHECK constraint too, but validating
     * in application gives better error message
     */
    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: 'rating must be between 1 and 10'
      })
    }

    /**
     * INSERT INTO DATABASE
     * 
     * RETURNING *:
     * Returns the created row (including auto-generated id)
     * Without RETURNING, we'd only know success/failure
     * With RETURNING, we get the full created rating
     * 
     * PARAMETERIZED QUERY:
     * $1, $2, $3... are replaced with values from array
     * Safe from SQL injection
     */
    const result = await pool.query(
      `INSERT INTO ratings (
        user_id,
        show_name,
        episode_number,
        episode_title,
        rating,
        platform,
        genre,
        url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        user_id,
        show_name,
        episode_number || null,  // Convert undefined to null
        episode_title || null,
        rating,
        platform || 'Netflix',
        genre || null,
        url || null
      ]
    )

    /**
     * RETURN SUCCESS RESPONSE
     * 
     * Status 201 = Created (resource successfully created)
     * result.rows[0] = the newly created rating
     */
    res.status(201).json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * Common errors:
     * - Foreign key violation (user_id doesn't exist)
     * - Check constraint violation (rating outside 1-10)
     * - Database connection lost
     */
    console.error('❌ Error creating rating:', error)
    
    /**
     * Check for specific PostgreSQL errors
     * error.code = PostgreSQL error code
     * 
     * 23503 = Foreign key violation
     * 23514 = Check constraint violation
     */
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create rating'
    })
  }
})

/**
 * Export router to be used in server.js
 * 
 * Usage in server.js:
 * const ratingsRoutes = require('./routes/ratings')
 * app.use('/api/ratings', ratingsRoutes)
 */
module.exports = router