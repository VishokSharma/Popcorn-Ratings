/**
 * ============================================
 * MIGRATION: Fetch and update posters for all ratings
 * ============================================
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })


const { Pool } = require('pg')
const tmdbService = require('../../src/services/tmdb')

require('dotenv').config({ path: '../../.env' })

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'popcorn_ratings',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
})

async function fetchPosters() {
  try {
    console.log('🎬 Fetching posters for all ratings...')

    // Get all ratings without posters
    const result = await pool.query(
      'SELECT id, show_name FROM ratings WHERE tmdb_poster_url IS NULL'
    )

    const ratings = result.rows
    console.log(`Found ${ratings.length} ratings without posters`)

    for (const rating of ratings) {
      try {
        // Search TMDB
        const tmdbData = await tmdbService.searchShow(rating.show_name)

        if (tmdbData) {
          // Update rating with poster
          await pool.query(
            `UPDATE ratings 
             SET tmdb_id = $1, tmdb_poster_url = $2, tmdb_type = $3
             WHERE id = $4`,
            [tmdbData.tmdb_id, tmdbData.poster_url, tmdbData.tmdb_type, rating.id]
          )

          console.log(`✅ Updated: ${rating.show_name}`)
        } else {
          console.log(`⚠️ No poster found: ${rating.show_name}`)
        }

        // Small delay to avoid rate limiting TMDB
        await new Promise(resolve => setTimeout(resolve, 250))

      } catch (error) {
        console.error(`❌ Error for ${rating.show_name}:`, error.message)
      }
    }

    console.log('✅ Migration complete!')
    await pool.end()

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

fetchPosters()
