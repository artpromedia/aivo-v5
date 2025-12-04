/**
 * Rate Limit Types
 */

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Redis key prefix for namespacing */
  keyPrefix?: string;
  /** Skip counting failed requests (4xx/5xx) */
  skipFailedRequests?: boolean;
  /** Skip counting successful requests */
  skipSuccessfulRequests?: boolean;
  /** Custom message for rate limit exceeded */
  message?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp when the window resets */
  reset: number;
  /** Time until reset in seconds */
  retryAfter: number;
}

export interface RateLimitInfo {
  /** Number of requests made in current window */
  count: number;
  /** Window start timestamp */
  windowStart: number;
  /** Window end timestamp */
  windowEnd: number;
}

/**
 * Rate limit tier identifiers
 */
export type RateLimitTier =
  | 'auth' // Login, register, password reset
  | 'ai' // LLM/AI endpoints
  | 'upload' // File uploads
  | 'general' // General API endpoints
  | 'public' // Public/unauthenticated endpoints
  | 'internal' // Internal service-to-service
  | 'webhook'; // Webhook endpoints (Stripe, etc.)

/**
 * Key generator function type
 */
export type KeyGenerator = (identifier: string, tier: RateLimitTier) => string;

/**
 * Rate limit bypass configuration
 */
export interface RateLimitBypassConfig {
  /** Internal API keys that bypass rate limiting */
  internalApiKeys: string[];
  /** Paths that are exempt from rate limiting */
  exemptPaths: string[];
}
