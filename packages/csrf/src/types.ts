/**
 * CSRF Types
 */

export interface CSRFConfig {
  /** Secret key for token generation (should be from env) */
  secret: string;
  /** Length of random component in token (default: 32) */
  tokenLength?: number;
  /** Name of the CSRF cookie (default: 'csrf-token') */
  cookieName?: string;
  /** Name of the CSRF header (default: 'x-csrf-token') */
  headerName?: string;
  /** Cookie options */
  cookieOptions?: CSRFCookieOptions;
  /** Paths to exclude from CSRF validation */
  excludePaths?: string[];
  /** Whether to exclude GET/HEAD/OPTIONS requests (default: true) */
  excludeSafeMethodsRequests?: boolean;
}

export interface CSRFCookieOptions {
  /** Whether cookie is httpOnly (default: true) */
  httpOnly: boolean;
  /** Whether cookie requires HTTPS (default: true in production) */
  secure: boolean;
  /** SameSite attribute (default: 'strict') */
  sameSite: 'strict' | 'lax' | 'none';
  /** Cookie path (default: '/') */
  path: string;
  /** Cookie max age in seconds (default: 86400 = 24 hours) */
  maxAge?: number;
}

export interface CSRFTokenPayload {
  /** Session identifier */
  sessionId: string;
  /** Token creation timestamp */
  timestamp: number;
  /** Random nonce */
  nonce: string;
}

export interface CSRFValidationResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Error code */
  code?: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INVALID_SESSION';
}

export interface CSRFErrorResponse {
  error: 'CSRF_VALIDATION_FAILED';
  message: string;
  code: 403;
}
