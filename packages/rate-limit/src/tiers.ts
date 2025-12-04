/**
 * Rate Limit Tiers
 *
 * Different rate limit configurations for different endpoint types.
 */

import type { RateLimitConfig, RateLimitTier } from './types';

/**
 * Predefined rate limit configurations for different tiers
 */
export const RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitConfig> = {
  /**
   * Auth endpoints (login, register, password reset)
   * Very restrictive to prevent brute force attacks
   * 10 requests per 15 minutes per IP
   */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyPrefix: 'rl:auth',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  /**
   * AI/LLM endpoints
   * Moderate limits due to high computational cost
   * 20 requests per minute per user
   */
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'rl:ai',
    message: 'AI request limit reached. Please wait a moment before trying again.',
  },

  /**
   * File upload endpoints
   * Conservative limits to prevent storage abuse
   * 50 uploads per hour per user
   */
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyPrefix: 'rl:upload',
    message: 'Upload limit reached. Please try again in an hour.',
  },

  /**
   * General API endpoints
   * Standard limits for authenticated users
   * 100 requests per 15 minutes per user
   */
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: 'rl:general',
    message: 'Rate limit exceeded. Please slow down your requests.',
  },

  /**
   * Public/unauthenticated endpoints
   * More restrictive than authenticated endpoints
   * 50 requests per 15 minutes per IP
   */
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    keyPrefix: 'rl:public',
    message: 'Rate limit exceeded. Please try again later.',
  },

  /**
   * Internal service-to-service calls
   * Very high limits, effectively unlimited for trusted services
   * 10000 requests per minute
   */
  internal: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000,
    keyPrefix: 'rl:internal',
    message: 'Internal rate limit exceeded.',
  },

  /**
   * Webhook endpoints (Stripe, etc.)
   * Moderate limits to prevent abuse while allowing legitimate traffic
   * 100 requests per minute per source IP
   */
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rl:webhook',
    message: 'Webhook rate limit exceeded.',
  },
};

/**
 * Get rate limit config for a tier
 */
export function getRateLimitConfig(tier: RateLimitTier): RateLimitConfig {
  return RATE_LIMIT_TIERS[tier];
}

/**
 * Create custom rate limit config with defaults
 */
export function createRateLimitConfig(
  partial: Partial<RateLimitConfig> & Pick<RateLimitConfig, 'windowMs' | 'maxRequests'>,
): RateLimitConfig {
  return {
    keyPrefix: 'rl:custom',
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    message: 'Rate limit exceeded.',
    ...partial,
  };
}

/**
 * Determine rate limit tier based on request path
 */
export function getTierFromPath(pathname: string): RateLimitTier {
  // Webhook endpoints
  if (pathname.includes('/webhooks/')) {
    return 'webhook';
  }

  // Auth endpoints
  if (
    pathname.includes('/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/password')
  ) {
    return 'auth';
  }

  // AI/LLM endpoints
  if (
    pathname.includes('/agents/') ||
    pathname.includes('/ai/') ||
    pathname.includes('/hint') ||
    pathname.includes('/generate') ||
    pathname.includes('/speech/analyze') ||
    pathname.includes('/assessment/generate')
  ) {
    return 'ai';
  }

  // Upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/file') || pathname.includes('/media')) {
    return 'upload';
  }

  // Default to general for authenticated endpoints
  return 'general';
}
