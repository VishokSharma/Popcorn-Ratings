/**
 * ============================================
 * LOGOUT ROUTE HANDLER
 * ============================================
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')

    console.log('✅ Logout successful, cookie deleted')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}