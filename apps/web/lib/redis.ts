/**
 * Redis Client Singleton
 * 
 * Provides a shared Redis client instance for the web application.
 * Used for rate limiting, caching, and session management.
 */

import Redis from 'ioredis';

// Singleton instance
let redis: Redis | null = null;

/**
 * Get the Redis client singleton
 * 
 * Creates a new connection if one doesn't exist.
 * Returns null if REDIS_URL is not configured.
 */
export function getRedis(): Redis | null {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[redis] REDIS_URL not configured');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectionName: 'aivo-web',
      reconnectOnError: (err) => {
        if (err.message.includes('READONLY')) {
          return true;
        }
        return false;
      },
    });

    redis.on('error', (err) => {
      console.error('[redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[redis] Connected');
    });

    return redis;
  } catch (error) {
    console.error('[redis] Failed to create client:', error);
    return null;
  }
}

/**
 * Close the Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis?.status === 'ready';
}

// Re-export the Redis type for convenience
export type { Redis };
