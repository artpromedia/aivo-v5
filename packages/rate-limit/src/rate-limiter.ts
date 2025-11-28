/**
 * Rate Limiter Implementation
 * 
 * Implements sliding window rate limiting using Redis.
 * Falls back to in-memory store when Redis is unavailable.
 */

import type { RateLimitConfig, RateLimitResult, RateLimitTier } from './types';
import { getRedisClient } from './redis-client';
import { getRateLimitConfig } from './tiers';

/**
 * In-memory rate limit store for fallback when Redis is unavailable
 */
const memoryStore = new Map<string, { count: number; windowStart: number }>();

/**
 * Clean up expired entries from memory store
 */
function cleanupMemoryStore(windowMs: number): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now - value.windowStart >= windowMs) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Sliding window rate limit using Redis
 * 
 * Uses Redis sorted sets for efficient sliding window implementation.
 * Each request is stored with its timestamp as the score.
 */
async function rateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  if (!redis) {
    return rateLimitMemory(key, config);
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = `${config.keyPrefix || 'rl'}:${key}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Remove entries outside the current window
    pipeline.zremrangebyscore(fullKey, '-inf', windowStart);
    
    // Count current entries in window
    pipeline.zcard(fullKey);
    
    // Add current request
    pipeline.zadd(fullKey, now, `${now}:${Math.random()}`);
    
    // Set expiry on the key
    pipeline.pexpire(fullKey, config.windowMs);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline returned null');
    }

    // Get count from zcard result (index 1)
    const countResult = results[1];
    const currentCount = (countResult?.[1] as number) || 0;
    
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    const reset = Math.ceil((now + config.windowMs) / 1000);
    const retryAfter = Math.ceil(config.windowMs / 1000);

    return {
      success: currentCount < config.maxRequests,
      limit: config.maxRequests,
      remaining,
      reset,
      retryAfter,
    };
  } catch (error) {
    console.error('[rate-limit] Redis error, falling back to memory:', error);
    return rateLimitMemory(key, config);
  }
}

/**
 * In-memory rate limiting fallback
 * 
 * Uses a simple fixed window approach for simplicity.
 * Not suitable for distributed systems.
 */
function rateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const fullKey = `${config.keyPrefix || 'rl'}:${key}`;
  
  // Periodic cleanup
  if (Math.random() < 0.01) {
    cleanupMemoryStore(config.windowMs);
  }

  const entry = memoryStore.get(fullKey);
  
  if (!entry || now - entry.windowStart >= config.windowMs) {
    // New window
    memoryStore.set(fullKey, { count: 1, windowStart: now });
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  // Existing window
  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = Math.ceil((entry.windowStart + config.windowMs) / 1000);
  const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);

  return {
    success: entry.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining,
    reset,
    retryAfter: Math.max(1, retryAfter),
  };
}

/**
 * Main rate limit function
 * 
 * @param identifier - Unique identifier (user ID, IP, or API key)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimitRedis(identifier, config);
}

/**
 * Rate limit by tier
 * 
 * @param identifier - Unique identifier
 * @param tier - Rate limit tier
 * @returns Rate limit result
 */
export async function rateLimitByTier(
  identifier: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const config = getRateLimitConfig(tier);
  return rateLimit(identifier, config);
}

/**
 * Check rate limit without incrementing
 * 
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result (success indicates if request would be allowed)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  if (!redis) {
    // For memory store, just return current state
    const fullKey = `${config.keyPrefix || 'rl'}:${identifier}`;
    const entry = memoryStore.get(fullKey);
    const now = Date.now();
    
    if (!entry || now - entry.windowStart >= config.windowMs) {
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.ceil((now + config.windowMs) / 1000),
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    }
    
    return {
      success: entry.count < config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      reset: Math.ceil((entry.windowStart + config.windowMs) / 1000),
      retryAfter: Math.ceil((entry.windowStart + config.windowMs - now) / 1000),
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = `${config.keyPrefix || 'rl'}:${identifier}`;

  try {
    // Remove old entries and count
    await redis.zremrangebyscore(fullKey, '-inf', windowStart);
    const count = await redis.zcard(fullKey);
    
    const remaining = Math.max(0, config.maxRequests - count);
    const reset = Math.ceil((now + config.windowMs) / 1000);

    return {
      success: count < config.maxRequests,
      limit: config.maxRequests,
      remaining,
      reset,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  } catch (error) {
    console.error('[rate-limit] Redis check error:', error);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.ceil((now + config.windowMs) / 1000),
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }
}

/**
 * Reset rate limit for an identifier
 * 
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 */
export async function resetRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const fullKey = `${config.keyPrefix || 'rl'}:${identifier}`;
  
  // Clear from memory store
  memoryStore.delete(fullKey);
  
  // Clear from Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(fullKey);
    } catch (error) {
      console.error('[rate-limit] Failed to reset rate limit:', error);
    }
  }
}
