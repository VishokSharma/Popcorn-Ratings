/**
 * ============================================
 * LOGIN ROUTE HANDLER
 * ============================================
 * 
 * Handles login requests from browser
 * Calls Express API, gets JWT tokens, sets refresh token cookie
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Call Express API to authenticate
    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'
    
    const expressRes = await fetch(`${apiUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!expressRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const data = await expressRes.json()
    const accessToken = data.data?.accessToken
    const refreshToken = data.data?.refreshToken
    const user = data.data?.user

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No tokens received' },
        { status: 500 }
      )
    }

    // Set refresh token as httpOnly cookie on Next.js domain
    const cookieStore = await cookies()
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,  // 7 days
    })

    console.log('✅ Login successful, refresh token cookie set')

    // Return access token to client (stored in memory)
    return NextResponse.json({
      success: true,
      data: { 
        user,
        accessToken  // Client stores this in memory
      }
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}