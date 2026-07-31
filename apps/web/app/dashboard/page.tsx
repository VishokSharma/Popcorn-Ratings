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
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  // If no token, just return empty dashboard
  // DashboardClient will handle the redirect
  if (!token) {
    console.log('⚠️ No auth token, rendering empty dashboard')
    return <DashboardClient initialRatings={[]} isAuthenticated={false} />
  }

  console.log('✅ Auth token found, fetching ratings...')

  try {
    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'
    
    const res = await fetch(`${apiUrl}/api/ratings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`❌ Failed to fetch ratings: ${res.status}`)
      return <DashboardClient initialRatings={[]} isAuthenticated={true} />
    }

    const apiResponse = await res.json()
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
    }))

    console.log(`✅ Fetched ${ratings.length} ratings`)

    return <DashboardClient initialRatings={ratings} isAuthenticated={true} />

  } catch (error) {
    console.error('❌ Dashboard error:', error)
    return <DashboardClient initialRatings={[]} isAuthenticated={true} />
  }
}