/**
 * ============================================
 * ERROR HANDLER MIDDLEWARE
 * ============================================
 * 
 * Catches all errors from route handlers
 * 
 * HOW IT WORKS:
 * 1. Error occurs in route handler
 * 2. Express passes error to this middleware
 * 3. We log it and send user-friendly response
 * 
 * MUST BE REGISTERED LAST in server.js (after all routes)
 */

/**
 * Error handler function
 * 
 * PARAMETERS:
 * - err: The error object
 * - req: Request object
 * - res: Response object
 * - next: Next middleware (not used here)
 * 
 * Note: Must have 4 parameters for Express to recognize
 * it as error handler (even if we don't use 'next')
 */
const errorHandler = (err, req, res, next) => {
  /**
   * Log error to console
   * 
   * In production, you'd send this to error tracking service
   * (Sentry, Rollbar, etc.)
   */
  console.error('❌ Error occurred:')
  console.error('Path:', req.method, req.path)
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)

  /**
   * Determine status code
   * 
   * If error has statusCode property, use it
   * Otherwise default to 500 (Internal Server Error)
   */
  const statusCode = err.statusCode || 500

  /**
   * Send error response
   * 
   * DEVELOPMENT: Send detailed error (for debugging)
   * PRODUCTION: Send generic message (don't expose internals)
   */
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error'  // Generic in production
      : err.message,              // Detailed in development
    
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  })
}

module.exports = errorHandler