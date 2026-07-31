import { ApiClient } from '@/lib/api'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  // Fetch ratings for authenticated user
  // With cookies enabled, the API will know which user this is
  // For now, still fetching user 1 (will need server-side auth for multiple users)
  const apiRatings = await ApiClient.getRatings(1)
  
  // Transform API data
  const ratings = apiRatings.map((r) => ({
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

  return <DashboardClient initialRatings={ratings} />
}