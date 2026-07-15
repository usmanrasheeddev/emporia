// ═══════════════════════════════════════════════════════════════
// Redis Client Configuration
// ioredis client with reconnect strategy, error handling, helpers
// ═══════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/** Redis client singleton with automatic reconnection */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    logger.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => logger.info('✅ Redis connected successfully'));
redis.on('error', (err) => logger.error('❌ Redis error:', err.message));
redis.on('close', () => logger.warn('Redis connection closed'));

/** Connect to Redis. Call once at startup. */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Redis is optional — app can run without it (degraded mode)
  }
}

/** Disconnect Redis gracefully. */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}

// ─── Cache Helpers ───────────────────────────────────────────

/** Get a cached value, parsed as JSON */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

/** Set a cache value as JSON with TTL in seconds */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error(`Cache set failed for key ${key}:`, err);
  }
}

/** Delete a cache key */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error(`Cache delete failed for key ${key}:`, err);
  }
}

/** Delete all keys matching a pattern (e.g., "products:*") */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.error(`Cache pattern delete failed for ${pattern}:`, err);
  }
}

/** Check if a key exists in the blacklist (e.g., token blacklisting) */
export async function isBlacklisted(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch {
    return false;
  }
}

/** Add a key to the blacklist with TTL */
export async function addToBlacklist(key: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, '1');
  } catch (err) {
    logger.error(`Blacklist add failed for key ${key}:`, err);
  }
}
