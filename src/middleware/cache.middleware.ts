import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import logger from "../utils/logger";

// ===== CACHE MIDDLEWARE =====
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key from URL and query params
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      // Check if Redis is connected
      if (!redisClient.isReady) {
        return next();
      }

      // Try to get cached data
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // Return cached response
        const data = JSON.parse(cachedData);
        res.setHeader("X-Cache", "HIT");
        res.status(200).json(data);
        return;
      }

      // Store original send function
      const originalSend = res.json.bind(res);

      // Override json function to cache response
      res.json = function (body: any): Response {
        // Store in cache if status is 200
        if (res.statusCode === 200 && duration > 0) {
          redisClient.setEx(key, duration, JSON.stringify(body)).catch((err) => {
            logger.error(`Cache set error: ${err}`);
          });
          res.setHeader("X-Cache", "MISS");
        }
        return originalSend(body);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error}`);
      next();
    }
  };
};

// ===== CACHE INVALIDATION =====
export const invalidateCache = async (pattern: string = "cache:*"): Promise<void> => {
  try {
    if (!redisClient.isReady) return;

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache invalidated: ${keys.length} keys deleted`);
    }
  } catch (error) {
    logger.error(`Cache invalidation error: ${error}`);
  }
};

// ===== GET CACHE STATS =====
export const getCacheStats = async (): Promise<{ totalKeys: number; keys: string[] }> => {
  try {
    if (!redisClient.isReady) {
      return { totalKeys: 0, keys: [] };
    }

    const keys = await redisClient.keys("cache:*");
    return {
      totalKeys: keys.length,
      keys: keys.slice(0, 100), // Limit to 100 keys
    };
  } catch (error) {
    logger.error(`Get cache stats error: ${error}`);
    return { totalKeys: 0, keys: [] };
  }
};