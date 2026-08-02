/**
 * ============================================
 * REFRESH ROUTE HANDLER
 * ============================================
 * 
 * Reads the refresh_token cookie, forwards it to Express,
 * returns a fresh access token. Used by the dashboard (server-side)
 * and now also by the extension popup (client-side, via fetch
 * with credentials: 'include').
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token found' },
        { status: 401 }
      )
    }

    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'

    const expressRes = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`
      }
    })

    if (!expressRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Refresh failed' },
        { status: 401 }
      )
    }

    const data = await expressRes.json()

    return NextResponse.json({
      success: true,
      data: { accessToken: data.data?.accessToken }
    })

  } catch (error) {
    console.error('❌ Refresh route error:', error)
    return NextResponse.json(
      { success: false, error: 'Refresh failed' },
      { status: 500 }
    )
  }
}
