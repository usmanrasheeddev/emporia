// ═══════════════════════════════════════════════════════════════
// Cache Middleware
// Redis caching middleware for optimizing repetitive read requests
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Caches successful responses using the request path as key.
 * @param ttlSeconds - Time-To-Live in seconds
 */
export function cacheResponse(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching in development/testing if disabled, or for non-GET methods
    if (process.env.NODE_ENV === 'test' || req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cached = await cacheGet<any>(key);
      if (cached) {
        logger.debug(`Cache hit for key: ${key}`);
        res.status(200).json(cached);
        return;
      }

      // Intercept res.json to cache the output before sending
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Cache only successful JSON responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(key, body, ttlSeconds).catch((err) =>
            logger.error(`Failed to cache response for ${key}:`, err)
          );
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error(`Cache middleware error for key ${key}:`, err);
      next();
    }
  };
}

/**
 * Helper utility to invalidate cache entries by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    await cacheDelPattern(`cache:${pattern}`);
    logger.debug(`Invalidated cache with pattern: cache:${pattern}`);
  } catch (err) {
    logger.error(`Cache invalidation failed for pattern ${pattern}:`, err);
  }
}
