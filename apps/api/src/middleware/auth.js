/**
 * ============================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================
 * 
 * Verifies JWT token and attaches user to request
 * 
 * FLOW:
 * 1. Extract token from Authorization header
 * 2. Verify token signature (JWT)
 * 3. Decode token to get user_id
 * 4. Attach user to req.user
 * 5. Pass to next middleware/route
 * 
 * USAGE:
 * app.get('/api/ratings', authenticateToken, (req, res) => {
 *   const userId = req.user.id  // User ID from token
 * })
 */

const jwt = require('jsonwebtoken')

/**
 * Middleware function to authenticate JWT token
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
function authenticateToken(req, res, next) {
  /**
   * STEP 1: Extract token from cookie OR Authorization header
   * 
   * Priority:
   * 1. Try cookie first (from HTTP-only cookie)
   * 2. Fall back to Authorization header (for API clients)
   */
  let token = req.cookies?.auth_token
  
  // If no cookie, try Authorization header
  if (!token) {
    const authHeader = req.headers['authorization']
    token = authHeader && authHeader.split(' ')[1]
  }
  
  /**
   * STEP 2: Check if token exists
   */
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    })
  }
  
  /**
   * STEP 3: Verify token
   * 
   * jwt.verify() checks:
   * - Token signature is valid (not tampered)
   * - Token hasn't expired
   * - Token was signed with our SECRET
   * 
   * If valid: decoded = { user_id: 5, email: "...", iat: ..., exp: ... }
   * If invalid: throws error
   */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    /**
     * STEP 4: Attach user to request
     * 
     * Now any route handler can access req.user
     * Contains: { id, email } from token payload
     */
    req.user = {
      id: decoded.user_id,
      email: decoded.email
    }
    
    /**
     * STEP 5: Continue to next middleware/route
     * 
     * Authentication successful!
     * Pass control to the route handler
     */
    next()
    
  } catch (error) {
    /**
     * Token verification failed
     * 
     * Common reasons:
     * - Token expired
     * - Token signature invalid (tampered)
     * - Token malformed
     * 
     * Return 403 Forbidden (token exists but invalid)
     */
    console.error('❌ Token verification failed:', error.message)
    
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token.'
    })
  }
}

/**
 * OPTIONAL: Middleware to check if user is authenticated
 * but doesn't fail if not (useful for optional auth)
 * 
 * Sets req.user if token valid, but continues either way
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    // No token, but that's okay
    req.user = null
    return next()
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.user_id,
      email: decoded.email
    }
  } catch (error) {
    // Invalid token, but that's okay
    req.user = null
  }
  
  next()
}

module.exports = {
  authenticateToken,
  optionalAuth
}