/**
 * ============================================
 * ACCESS TOKEN STORE
 * ============================================
 * 
 * Holds the in-memory access token for the current session.
 * Deliberately NOT localStorage/sessionStorage — cleared on
 * page refresh, refetched via the refresh_token cookie.
 */

let accessToken: string | null = null

/**
 * Set access token in memory
 */
export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken
}