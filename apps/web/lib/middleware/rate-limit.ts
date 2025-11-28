/**
 * Rate Limit Middleware for Next.js API Routes
 * 
 * Provides rate limiting utilities for API routes with:
 * - Tier-based rate limiting (auth, ai, upload, general, public)
 * - Automatic header injection
 * - IP and user-based identification
 * - Internal service bypass
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  rateLimit,
  rateLimitByTier,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitTier,
  getTierFromPath,
  RATE_LIMIT_TIERS,
} from '@aivo/rate-limit';

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not be available in all environments)
  return '127.0.0.1';
}

/**
 * Get rate limit identifier from request
 * 
 * Uses user ID if authenticated, otherwise falls back to IP
 */
export function getRateLimitIdentifier(
  request: NextRequest,
  userId?: string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIp(request)}`;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  
  if (!result.success) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return response;
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  message?: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: message || 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  );
  
  return addRateLimitHeaders(response, result);
}

/**
 * Internal API keys for bypassing rate limits
 */
const INTERNAL_API_KEYS = new Set(
  (process.env.INTERNAL_API_KEYS || '').split(',').filter(Boolean)
);

/**
 * Paths exempt from rate limiting
 */
const EXEMPT_PATHS = [
  '/api/health',
  '/api/ready',
  '/api/metrics',
  '/_next',
  '/favicon.ico',
];

/**
 * Check if request should bypass rate limiting
 */
export function shouldBypassRateLimit(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Check exempt paths
  if (EXEMPT_PATHS.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  // Check internal API key
  const apiKey = request.headers.get('x-internal-api-key');
  if (apiKey && INTERNAL_API_KEYS.has(apiKey)) {
    return true;
  }
  
  return false;
}

/**
 * Rate limit handler options
 */
export interface RateLimitHandlerOptions {
  /** Rate limit tier to use */
  tier?: RateLimitTier;
  /** Custom rate limit config (overrides tier) */
  config?: RateLimitConfig;
  /** Custom identifier (overrides automatic detection) */
  identifier?: string;
  /** User ID for authenticated requests */
  userId?: string | null;
  /** Custom message for rate limit exceeded */
  message?: string;
}

/**
 * Apply rate limiting to a request
 * 
 * Returns null if request is allowed, or a 429 response if rate limited.
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimitHandlerOptions = {}
): Promise<{ response: NextResponse | null; result: RateLimitResult }> {
  // Check bypass conditions
  if (shouldBypassRateLimit(request)) {
    return {
      response: null,
      result: {
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
        retryAfter: 0,
      },
    };
  }

  const { tier, config, identifier, userId, message } = options;
  
  // Determine identifier
  const rateLimitId = identifier || getRateLimitIdentifier(request, userId);
  
  // Apply rate limit
  let result: RateLimitResult;
  
  if (config) {
    result = await rateLimit(rateLimitId, config);
  } else {
    const effectiveTier = tier || getTierFromPath(request.nextUrl.pathname);
    result = await rateLimitByTier(rateLimitId, effectiveTier);
  }
  
  if (!result.success) {
    const tierConfig = tier ? RATE_LIMIT_TIERS[tier] : undefined;
    const errorMessage = message || tierConfig?.message || 'Rate limit exceeded.';
    
    return {
      response: rateLimitExceededResponse(result, errorMessage),
      result,
    };
  }
  
  return { response: null, result };
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * 
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { tier: 'ai' }
 * );
 * ```
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T, ...args: any[]) => Promise<NextResponse>,
  options: RateLimitHandlerOptions = {}
): (request: T, ...args: any[]) => Promise<NextResponse> {
  return async (request: T, ...args: any[]) => {
    const { response: rateLimitResponse, result } = await applyRateLimit(
      request,
      options
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Call the actual handler
    const response = await handler(request, ...args);
    
    // Add rate limit headers to successful response
    return addRateLimitHeaders(response, result);
  };
}

/**
 * Rate limit check for middleware
 * 
 * Returns headers to add and whether to block the request.
 */
export async function checkRateLimitForMiddleware(
  request: NextRequest,
  userId?: string | null
): Promise<{
  blocked: boolean;
  headers: Record<string, string>;
  retryAfter?: number;
}> {
  if (shouldBypassRateLimit(request)) {
    return { blocked: false, headers: {} };
  }

  const identifier = getRateLimitIdentifier(request, userId);
  const tier = getTierFromPath(request.nextUrl.pathname);
  const result = await rateLimitByTier(identifier, tier);

  const rateLimitHeaders: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    return {
      blocked: true,
      headers: {
        ...rateLimitHeaders,
        'Retry-After': result.retryAfter.toString(),
      },
      retryAfter: result.retryAfter,
    };
  }

  return { blocked: false, headers: rateLimitHeaders };
}
