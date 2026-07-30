/**
 * ============================================
 * MIGRATION: Set password for test user
 * ============================================
 * 
 * Sets password 'password123' for test user
 * Hash: $2b$10$rK... (bcrypt with 10 rounds)
 * 
 * Run this once to set up test user for development
 */

const { Pool } = require('pg')
const bcrypt = require('bcrypt')

require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'popcorn_ratings',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
})

async function setTestUserPassword() {
  try {
    console.log('🔐 Setting password for test user...')
    
    // Hash the password 'password123'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    console.log('🔑 Generated hash:', hashedPassword.substring(0, 20) + '...')
    
    // Update test user
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email = 'test@popcornratings.com'
       RETURNING id, email, name`,
      [hashedPassword]
    )
    
    if (result.rowCount === 0) {
      console.log('❌ Test user not found. Creating new test user...')
      
      // Create test user if doesn't exist
      const newUser = await pool.query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name`,
        ['test@popcornratings.com', 'Test User', hashedPassword]
      )
      
      console.log('✅ Created test user:', newUser.rows[0])
    } else {
      console.log('✅ Updated test user:', result.rows[0])
    }
    
    console.log('\n📋 Test credentials:')
    console.log('   Email: test@popcornratings.com')
    console.log('   Password: password123')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

setTestUserPassword()