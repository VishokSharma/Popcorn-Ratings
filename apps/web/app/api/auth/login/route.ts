/**
 * ============================================
 * LOGIN ROUTE HANDLER
 * ============================================
 * 
 * Handles login requests from browser
 * Calls Express API, gets JWT, sets httpOnly cookie
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
    const token = data.data?.token
    const user = data.data?.user

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token received' },
        { status: 500 }
      )
    }

    // Set httpOnly cookie on Next.js domain (localhost:3000)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,  // Can't be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production',  // HTTPS in production
      sameSite: 'lax',  // CSRF protection
      path: '/',  // Available across entire app
      maxAge: 7 * 24 * 60 * 60,  // 7 days
    })

    console.log('✅ Login successful, cookie set')

    return NextResponse.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}