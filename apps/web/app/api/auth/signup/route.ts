/**
 * ============================================
 * SIGNUP ROUTE HANDLER
 * ============================================
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name required' },
        { status: 400 }
      )
    }

    // Call Express API to signup
    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5001'
    
    const expressRes = await fetch(`${apiUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!expressRes.ok) {
      const errorData = await expressRes.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: errorData.error || 'Signup failed' },
        { status: expressRes.status }
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

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    console.log('✅ Signup successful, cookie set')

    return NextResponse.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('❌ Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    )
  }
}