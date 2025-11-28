/**
 * CSRF Constants
 */

/** Default CSRF configuration values */
export const CSRF_DEFAULTS = {
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 86400, // 24 hours
  },
  excludeSafeMethodsRequests: true,
} as const;

/** HTTP methods that don't require CSRF protection */
export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;

/** Default paths excluded from CSRF validation */
export const DEFAULT_EXCLUDED_PATHS = [
  '/api/auth/',
  '/api/health',
  '/api/ready',
  '/api/webhooks/',
  '/api/csrf',
  '/_next/',
] as const;

/** Token expiration time in milliseconds (24 hours) */
export const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/** CSRF error messages */
export const CSRF_ERRORS = {
  MISSING_TOKEN: 'CSRF token is missing',
  INVALID_TOKEN: 'Invalid CSRF token',
  EXPIRED_TOKEN: 'CSRF token has expired',
  INVALID_SESSION: 'Invalid session for CSRF token',
  MISSING_SECRET: 'CSRF secret is not configured',
} as const;
