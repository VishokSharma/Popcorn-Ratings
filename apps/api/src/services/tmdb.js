/**
 * ============================================
 * TMDB SERVICE
 * ============================================
 * 
 * Handles all requests to The Movie Database API
 * Fetches show/movie data including posters
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

/**
 * Search for a TV show or movie
 * 
 * @param {string} query - Show/movie name to search
 * @returns {Promise<Object>} - Show data with poster URL
 */
async function searchShow(query) {
  try {
    if (!query || query.trim() === '') {
      console.log('⚠️ Empty search query')
      return null
    }

    console.log(`🔍 Searching TMDB for: "${query}"`)

    // Search for TV shows first
    const tvResponse = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    )

    if (!tvResponse.ok) {
      throw new Error(`TMDB API error: ${tvResponse.status}`)
    }

    const tvData = await tvResponse.json()

    // If TV show found, return it
    if (tvData.results && tvData.results.length > 0) {
      const show = tvData.results[0]

      return {
        tmdb_id: show.id,
        tmdb_type: 'tv',
        name: show.name,
        poster_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        overview: show.overview,
        rating: show.vote_average
      }
    }

    // If no TV show, try movies
    const movieResponse = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    )

    if (!movieResponse.ok) {
      throw new Error(`TMDB API error: ${movieResponse.status}`)
    }

    const movieData = await movieResponse.json()

    if (movieData.results && movieData.results.length > 0) {
      const movie = movieData.results[0]

      return {
        tmdb_id: movie.id,
        tmdb_type: 'movie',
        name: movie.title,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        overview: movie.overview,
        rating: movie.vote_average
      }
    }

    console.log(`⚠️ No results found for: "${query}"`)
    return null

  } catch (error) {
    console.error('❌ TMDB search error:', error)
    return null
  }
}

/**
 * Get poster URL for a show name
 * Uses cache to avoid repeated API calls
 */
const posterCache = new Map()

async function getPosterUrl(showName) {
  // Check cache first
  if (posterCache.has(showName)) {
    console.log(`✅ Poster found in cache: ${showName}`)
    return posterCache.get(showName)
  }

  // Search TMDB
  const result = await searchShow(showName)

  if (result && result.poster_url) {
    // Cache for future use
    posterCache.set(showName, result.poster_url)
    console.log(`✅ Poster found: ${showName}`)
    return result.poster_url
  }

  console.log(`❌ No poster found: ${showName}`)
  return null
}

module.exports = {
  searchShow,
  getPosterUrl
}
