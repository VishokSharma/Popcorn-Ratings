/**
 * ============================================
 * GEMINI RECOMMENDATION SERVICE
 * ============================================
 * 
 * Content-based recommendation engine:
 * 1. Look at user's highly-rated shows (rating >= 7) and their genres
 * 2. Search TMDB for other popular shows in those genres
 * 3. Hand both lists to Gemini, ask it to rank + explain top picks
 */

const pool = require('../config/database')
const tmdbService = require('./tmdb')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`

/**
 * Get genres TMDB associates with a show, plus overview text.
 * We already fetch poster_path in tmdbService.searchShow — this
 * pulls genre_ids and overview too, which we weren't using before.
 */
async function getShowDetails(showName) {
  try {
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(showName)}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const show = data.results[0]
      return {
        genre_ids: show.genre_ids || [],
        overview: show.overview || ''
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching show details:', error.message)
    return null
  }
}

/**
 * Search TMDB for popular shows in a given genre, excluding
 * shows the user has already rated.
 */
async function discoverShowsByGenre(genreId, excludeNames) {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.results) return []

    return data.results
      .filter(show => !excludeNames.includes(show.name))
      .slice(0, 8)
      .map(show => ({
        name: show.name,
        overview: show.overview,
        poster_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
      }))
  } catch (error) {
    console.error('Error discovering shows:', error.message)
    return []
  }
}

/**
 * Ask Gemini to rank candidates and explain each pick
 */
async function askGeminiToRank(likedShows, candidates) {
  const prompt = `You are a TV/movie recommendation assistant.

Here are shows this user rated highly:
${likedShows.map(s => `- "${s.show_name}" (rated ${s.rating}/10): ${s.overview || 'No description available'}`).join('\n')}

Here are candidate shows they haven't watched:
${candidates.map(c => `- "${c.name}": ${c.overview || 'No description available'}`).join('\n')}

Pick the 5-6 candidates this user is most likely to enjoy, based on tone, themes, and genre similarity to what they already liked. For each pick, write ONE short sentence explaining why.

Respond ONLY with valid JSON, no other text, in this exact format:
[
  { "show_name": "Example Show", "reason": "One sentence reason here." }
]`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Strip markdown code fences if Gemini wraps the JSON in ```json ... ```
  const cleaned = text.replace(/```json|```/g, '').trim()

  return JSON.parse(cleaned)
}

/**
 * Main entry point: generate recommendations for a user
 */
async function generateRecommendations(userId) {
  // Step 1: Get user's highly-rated shows
  const likedResult = await pool.query(
    `SELECT DISTINCT show_name, rating, genre 
     FROM ratings 
     WHERE user_id = $1 AND rating >= 7
     ORDER BY rating DESC`,
    [userId]
  )

  if (likedResult.rows.length === 0) {
    throw new Error('Not enough rated shows to generate recommendations (need at least one rating of 7+)')
  }

  const likedShows = likedResult.rows

  // Step 2: Get all show names user has already rated (any rating), to exclude from candidates
  const allRatedResult = await pool.query(
    `SELECT DISTINCT show_name FROM ratings WHERE user_id = $1`,
    [userId]
  )
  const alreadyRatedNames = allRatedResult.rows.map(r => r.show_name)

  // Step 3: For each liked show, get its genres + overview from TMDB
  const genreIdSet = new Set()
  const likedShowsWithOverview = []

  for (const show of likedShows) {
    const details = await getShowDetails(show.show_name)
    likedShowsWithOverview.push({
      ...show,
      overview: details?.overview || ''
    })
    if (details?.genre_ids) {
      details.genre_ids.forEach(id => genreIdSet.add(id))
    }
  }

  if (genreIdSet.size === 0) {
    throw new Error('Could not determine genres for any liked shows')
  }

  // Step 4: Discover candidate shows in those genres
  let candidates = []
  for (const genreId of genreIdSet) {
    const shows = await discoverShowsByGenre(genreId, alreadyRatedNames)
    candidates.push(...shows)
  }

  // Dedupe candidates by name
  const seen = new Set()
  candidates = candidates.filter(c => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })

  if (candidates.length === 0) {
    throw new Error('No candidate shows found for these genres')
  }

  // Step 5: Ask Gemini to rank + explain
  const ranked = await askGeminiToRank(likedShowsWithOverview, candidates)

  // Step 6: Attach poster URLs from our candidate list (Gemini only returns name + reason)
  const finalRecommendations = ranked.map((rec, index) => {
    const matchedCandidate = candidates.find(c => c.name === rec.show_name)
    return {
      show_name: rec.show_name,
      reason: rec.reason,
      rank: index + 1,
      poster_url: matchedCandidate?.poster_url || null
    }
  })

  // Step 7: Store in DB, replacing previous recommendations for this user
  await pool.query('DELETE FROM recommendations WHERE user_id = $1', [userId])

  for (const rec of finalRecommendations) {
    await pool.query(
      `INSERT INTO recommendations (user_id, show_name, reason, rank, poster_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, rec.show_name, rec.reason, rec.rank, rec.poster_url]
    )
  }

  return finalRecommendations
}

module.exports = {
  generateRecommendations
}
