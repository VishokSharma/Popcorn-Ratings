/**
 * Supabase Client Configuration
 * 
 * This file creates a Supabase client that can be used
 * throughout the app to interact with the database.
 * 
 * Key Concepts:
 * - Singleton pattern: One client instance shared everywhere
 * - Environment variables: Keeps secrets safe
 * - Type safety: TypeScript ensures correct data types
 */

import { createClient } from '@supabase/supabase-js'

// Get configuration from environment variables
// process.env = Node.js way to access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// The '!' tells TypeScript "trust me, this exists"
// In production, you'd add validation to ensure they exist

/**
 * Create Supabase client instance
 * 
 * This client handles:
 * - Authentication (we'll use later)
 * - Database queries (select, insert, update, delete)
 * - Real-time subscriptions (live updates)
 * - Storage (file uploads - future feature)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For now, we'll handle auth manually
    // Later we'll enable Supabase's built-in auth
    persistSession: false
  }
})

/**
 * TypeScript Type Definitions
 * 
 * These define the shape of our data
 * TypeScript will yell at us if we use wrong types
 */

// User type - matches our users table
export interface User {
  id: string              // UUID from database
  email: string
  name: string | null     // null means optional
  created_at: string      // ISO timestamp
}

// Rating type - matches our ratings table
export interface Rating {
  id: string
  user_id: string         // Links to users.id
  show_name: string
  episode_number: string | null
  episode_title: string | null
  rating: number          // 1-10
  platform: string | null
  genre: string | null
  timestamp: string
  url: string | null
}

// API Response types - what our endpoints return
export interface ApiResponse<T> {
  success: boolean        // Did it work?
  data?: T                // The actual data (optional)
  error?: string          // Error message (optional)
}