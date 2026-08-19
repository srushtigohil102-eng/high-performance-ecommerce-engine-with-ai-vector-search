import { getRedisClient } from "../config/redis";

// All cache prefixes that describe product data. Product list, search results,
// search suggestions, and the category counts all change when a product is
// created/updated/deleted (or its stock/rating changes), so invalidating them
// together keeps the storefront consistent.
export const PRODUCT_CACHE_PATTERNS = [
  "products:list:*",
  "products:categories",
  "search:*",
  "suggest:*",
];

// Best-effort product cache invalidation. Any Redis failure is logged and
// swallowed — a stale cache is acceptable, a crashed request is not.
export const invalidateProductCache = async (
  patterns: string[] = []
): Promise<void> => {
  try {
    const redis = getRedisClient();
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(keys);
    }
  } catch {
    // Redis unavailable
  }
};
