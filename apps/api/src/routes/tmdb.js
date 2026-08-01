/**
 * ============================================
 * TMDB ROUTES
 * ============================================
 * 
 * Endpoints for searching TMDB and getting posters
 */

const express = require('express')
const router = express.Router()
const tmdbService = require('../services/tmdb')

/**
 * POST /api/tmdb/search
 * Search for a show/movie on TMDB
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      })
    }

    const result = await tmdbService.searchShow(query)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Show not found'
      })
    }

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('❌ TMDB search error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search TMDB'
    })
  }
})

module.exports = router
