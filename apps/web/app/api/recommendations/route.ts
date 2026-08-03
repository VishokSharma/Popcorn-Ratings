import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getAccessTokenFromRefresh() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) return null

  const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'

  const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `refresh_token=${refreshToken}`
    }
  })

  if (!refreshRes.ok) return null

  const data = await refreshRes.json()
  return data.data?.accessToken || null
}

export async function GET() {
  const accessToken = await getAccessTokenFromRefresh()

  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'

  const res = await fetch(`${apiUrl}/api/recommendations`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
