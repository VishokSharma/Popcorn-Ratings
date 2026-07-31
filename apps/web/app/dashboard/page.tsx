
import { ApiClient } from '@/lib/api'
import DashboardClient from './DashboardClient'



export default async function Dashboard() {
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