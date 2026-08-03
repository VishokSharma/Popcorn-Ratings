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
 * GET /api/ratings/show-average/:showName
 * 
 * Public endpoint — returns the average rating and count
 * across ALL users for a given show name. No auth required,
 * since this is aggregate data, not any single user's private list.
 */
router.get('/show-average/:showName', async (req, res) => {
  try {
    const { showName } = req.params

    const result = await pool.query(
      `SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(*) as rating_count
       FROM ratings
       WHERE show_name = $1`,
      [showName]
    )

    res.json({
      success: true,
      data: {
        avgRating: parseFloat(result.rows[0].avg_rating) || null,
        count: parseInt(result.rows[0].rating_count) || 0
      }
    })

  } catch (error) {
    console.error('❌ Error fetching show average:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch show average'
    })
  }
})

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
      `SELECT id, user_id, show_name, episode_number, episode_title, rating, platform, genre, url, created_at, tmdb_id, tmdb_poster_url, tmdb_type
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

    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 10'
      })
    }

    // Fetch poster from TMDB
    const tmdbService = require('../services/tmdb')
    const tmdbData = await tmdbService.searchShow(show_name)

    const result = await pool.query(
      `INSERT INTO ratings (user_id, show_name, episode_number, episode_title, rating, platform, genre, url, tmdb_id, tmdb_poster_url, tmdb_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        user_id,
        show_name,
        episode_number || null,
        episode_title || null,
        rating,
        platform || 'Netflix',
        genre || null,
        url || null,
        tmdbData?.tmdb_id || null,
        tmdbData?.poster_url || null,
        tmdbData?.tmdb_type || null
      ]
    )

    console.log(`✅ Rating created with poster for: ${show_name}`)

    res.status(201).json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('❌ Error creating rating:', error.message)
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