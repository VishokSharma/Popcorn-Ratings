/**
 * ============================================
 * RECOMMENDATIONS ROUTES
 * ============================================
 */

const express = require('express')
const router = express.Router()
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const geminiService = require('../services/gemini')

/**
 * POST /api/recommendations/generate
 * 
 * Triggers a fresh recommendation generation for the logged-in user.
 * On-demand, replaces any previous recommendations for this user.
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`🎯 Generating recommendations for user ${userId}...`)

    const recommendations = await geminiService.generateRecommendations(userId)

    console.log(`✅ Generated ${recommendations.length} recommendations`)

    res.json({
      success: true,
      data: recommendations
    })

  } catch (error) {
    console.error('❌ Recommendation generation error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations'
    })
  }
})

/**
 * GET /api/recommendations
 * 
 * Returns the last-generated recommendations for the logged-in user
 * (no LLM call — just reads what's cached in the DB)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT show_name, reason, rank, poster_url, generated_at
       FROM recommendations
       WHERE user_id = $1
       ORDER BY rank ASC`,
      [userId]
    )

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('❌ Get recommendations error:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    })
  }
})

module.exports = router
