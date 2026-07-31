import { ApiClient } from '@/lib/api'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  // Note: This is a server component, so we can't use localStorage directly
  // In production, you'd handle auth via cookies or server sessions
  // For now, we'll fetch without auth and let DashboardClient handle it
  
  const apiRatings = await ApiClient.getRatings(1)
  
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