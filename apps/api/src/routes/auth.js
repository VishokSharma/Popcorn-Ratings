/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 * 
 * Handles user registration and login
 * 
 * ENDPOINTS:
 * POST /api/auth/signup  - Register new user
 * POST /api/auth/signin  - Login existing user
 * GET  /api/auth/me      - Get current user info
 */

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

/**
 * ============================================
 * POST /api/auth/signup
 * ============================================
 * 
 * Register a new user account
 * 
 * REQUEST BODY:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": 5, "email": "...", "name": "..." },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/signup',
  /**
   * VALIDATION MIDDLEWARE
   * 
   * Validates and sanitizes input before processing
   * Uses express-validator
   */
  [
    // Email must be valid email format
    body('email')
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),  // Convert to lowercase, trim
    
    // Password must be at least 8 characters
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    
    // Name is required
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name too long (max 100 characters)')
  ],
  async (req, res) => {
    try {
      /**
       * STEP 1: Check validation errors
       */
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        })
      }
      
      const { email, password, name } = req.body
      
      /**
       * STEP 2: Check if user already exists
       * 
       * Prevent duplicate email registrations
       */
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        })
      }
      
      /**
       * STEP 3: Hash password
       * 
       * bcrypt.hash(password, saltRounds)
       * saltRounds = 10 (good balance of security vs speed)
       * 
       * Higher = more secure but slower
       * 10 = ~100ms (perfect for login/signup)
       */
      console.log('🔐 Hashing password...')
      const hashedPassword = await bcrypt.hash(password, 10)
      
      /**
       * STEP 4: Insert user into database
       * 
       * RETURNING * gives us back the created user
       */
      console.log('💾 Creating user in database...')
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email, hashedPassword, name]
      )
      
      const newUser = result.rows[0]
      
      /**
       * STEP 5: Create JWT token
       * 
       * Payload: user_id and email (public info)
       * Secret: from environment variable
       * Expiration: 7 days (from env or default)
       */
      const token = jwt.sign(
        {
          user_id: newUser.id,
          email: newUser.email
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      )
      
      console.log('✅ User created successfully:', newUser.email)
      
      /**
       * STEP 6: Return user and token
       * 
       * Don't return password_hash!
       */
      // Set HTTP-only cookie with JWT
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            created_at: newUser.created_at
          },
          token
        }
      })
      
    } catch (error) {
      console.error('❌ Signup error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      })
    }
  }
)

/**
 * ============================================
 * POST /api/auth/signin
 * ============================================
 * 
 * Login existing user
 * 
 * REQUEST BODY:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": 5, "email": "...", "name": "..." },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      /**
       * STEP 1: Validate input
       */
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        })
      }
      
      const { email, password } = req.body
      
      /**
       * STEP 2: Find user by email
       */
      console.log('🔍 Looking up user:', email)
      const result = await pool.query(
        `SELECT id, email, name, password_hash, created_at
         FROM users 
         WHERE email = $1`,
        [email]
      )
      
      if (result.rows.length === 0) {
        /**
         * User not found
         * 
         * SECURITY: Don't reveal whether email exists
         * Same error message as wrong password
         */
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        })
      }
      
      const user = result.rows[0]
      
      /**
       * STEP 3: Verify password
       * 
       * bcrypt.compare(plainText, hash)
       * Returns true if password matches, false otherwise
       * 
       * This is secure because:
       * - Timing attack resistant
       * - Handles salt automatically
       */
      console.log('🔑 Verifying password...')
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!isValidPassword) {
        /**
         * Wrong password
         * 
         * SECURITY: Same error message as email not found
         */
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        })
      }
      
      /**
       * STEP 4: Create JWT token
       */
      const token = jwt.sign(
        {
          user_id: user.id,
          email: user.email
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      )
      
      console.log('✅ Login successful:', user.email)
      
      /**
       * STEP 5: Return user and token
       * 
       * Don't return password_hash!
       */
      // Set HTTP-only cookie with JWT
      res.cookie('auth_token', token, {
        httpOnly: true,           // JavaScript can't access (secure!)
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
        sameSite: 'lax',          // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
          },
          token  // Still send in JSON for client-side backup
        }
      })
      
    } catch (error) {
      console.error('❌ Signin error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to sign in'
      })
    }
  }
)

/**
 * ============================================
 * GET /api/auth/me
 * ============================================
 * 
 * Get current authenticated user's info
 * 
 * REQUIRES: Valid JWT token in Authorization header
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 5,
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "created_at": "2026-03-08T..."
 *   }
 * }
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    /**
     * req.user set by authenticateToken middleware
     * Contains: { id, email }
     */
    const userId = req.user.id
    
    /**
     * Fetch full user data from database
     * (Token only has id and email)
     */
    const result = await pool.query(
      `SELECT id, email, name, created_at
       FROM users 
       WHERE id = $1`,
      [userId]
    )
    
    if (result.rows.length === 0) {
      /**
       * User in token doesn't exist in database
       * (Should never happen unless user was deleted)
       */
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error('❌ Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    })
  }
})

module.exports = router