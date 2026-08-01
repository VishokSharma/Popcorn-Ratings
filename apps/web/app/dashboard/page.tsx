import { cookies } from 'next/headers'
import DashboardClient from './DashboardClient'

interface ApiRating {
  id: number
  user_id: number
  show_name: string
  episode_number: string | null
  episode_title: string | null
  rating: number
  platform: string
  genre: string | null
  url: string | null
  created_at: string
  tmdb_id?: number
  tmdb_poster_url?: string
  tmdb_type?: string
}

interface Rating {
  id: number
  title: string
  showName: string
  episodeNumber: string
  episodeTitle: string
  rating: number
  timestamp: number
  url: string
  platform: string
  genre: string
  posterUrl?: string
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  // If no refresh token, render empty dashboard (client will redirect to auth)
  if (!refreshToken) {
    console.log('⚠️ No refresh token found')
    return <DashboardClient initialRatings={[]} isAuthenticated={false} />
  }

  try {
    // Use refresh token to get new access token
    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'
    
    const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`
      },
      cache: 'no-store',
    })

    if (!refreshRes.ok) {
      console.log('⚠️ Token refresh failed')
      return <DashboardClient initialRatings={[]} isAuthenticated={false} />
    }

    const refreshData = await refreshRes.json()
    const accessToken = refreshData.data?.accessToken

    if (!accessToken) {
      console.log('⚠️ No access token in refresh response')
      return <DashboardClient initialRatings={[]} isAuthenticated={false} />
    }

    console.log('✅ Access token obtained via refresh')

    // Now fetch ratings with new access token
    const ratingsRes = await fetch(`${apiUrl}/api/ratings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!ratingsRes.ok) {
      console.error(`❌ Failed to fetch ratings: ${ratingsRes.status}`)
      return <DashboardClient initialRatings={[]} isAuthenticated={true} />
    }

    const apiResponse = await ratingsRes.json()
    const apiRatings: ApiRating[] = apiResponse.data || []

    const ratings: Rating[] = apiRatings.map((r) => ({
      id: r.id,
      title: `${r.show_name} - ${r.episode_number || ''}`,
      showName: r.show_name,
      episodeNumber: r.episode_number || '',
      episodeTitle: r.episode_title || '',
      rating: r.rating,
      timestamp: new Date(r.created_at).getTime(),
      url: r.url || '',
      platform: r.platform,
      genre: r.genre || '',
      posterUrl: r.tmdb_poster_url || undefined
    }))

    console.log(`✅ Fetched ${ratings.length} ratings`)

    return <DashboardClient initialRatings={ratings} isAuthenticated={true} />

  } catch (error) {
    console.error('❌ Dashboard error:', error)
    return <DashboardClient initialRatings={[]} isAuthenticated={true} />
  }
}