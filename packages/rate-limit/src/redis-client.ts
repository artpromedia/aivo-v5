/**
 * Redis Client for Rate Limiting
 * 
 * Singleton Redis client with connection management.
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[rate-limit] REDIS_URL not configured, rate limiting will use in-memory fallback');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectionName: 'aivo-rate-limit',
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('error', (err) => {
      console.error('[rate-limit] Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[rate-limit] Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('[rate-limit] Redis ready');
    });

    return redisClient;
  } catch (error) {
    console.error('[rate-limit] Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check if Redis is connected and ready
 */
export function isRedisReady(): boolean {
  return redisClient?.status === 'ready';
}
