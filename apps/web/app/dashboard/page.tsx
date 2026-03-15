import { ApiClient } from '@/lib/api'
import DashboardClient from './DashboardClient'

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
  // Fetch ratings on server (before page loads)
  const apiRatings = await ApiClient.getRatings(1)
  
  // Transform API data
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

  // Pass to client component
  return <DashboardClient initialRatings={ratings} />
}