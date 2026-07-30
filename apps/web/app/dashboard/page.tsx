import { useAuth } from '@/lib/auth-context'
import { ApiClient } from '@/lib/api'
import DashboardClient from './DashboardClient'

interface Rating {
  id: number
  showName: string
  episodeNumber: string
  episodeTitle: string
  rating: number
  timestamp: number
  platform: string
  genre: string
}

export default async function Dashboard() {
  // Note: This is a server component, but we need to fetch data
  // In a real app, we'd need to handle auth differently on server
  // For now, we'll rely on client-side auth check
  
  // Fetch ratings for user ID 1 (will be updated when we properly handle auth on server)
  const apiRatings = await ApiClient.getRatings(1)
  
  // Transform API data
  const ratings: Rating[] = apiRatings.map((r) => ({
    id: r.id,
    showName: r.show_name,
    episodeNumber: r.episode_number || '',
    episodeTitle: r.episode_title || '',
    rating: r.rating,
    timestamp: new Date(r.created_at).getTime(),
    platform: r.platform,
    genre: r.genre || '',
  }))

  // Pass to client component
  return <DashboardClient initialRatings={ratings} />
}