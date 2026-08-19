import { Router } from "express";
import { searchProducts, suggestProducts, getTrendingSearches } from "../controllers/searchController";
import { searchLimiter } from "../middleware/rateLimiters";

const router = Router();

// GET /api/search?q=<query>&page=1&limit=12
// Public endpoint — no auth required (same as GET /api/products).
// Returns the same response shape so the frontend can consume it directly.
// Supports filters (category, minPrice, maxPrice, inStock) and sort.
router.get("/", searchLimiter, searchProducts);

// GET /api/search/suggest?q=<query> — as-you-type suggestions
// Returns matching product names, a few product hits, and categories.
router.get("/suggest", searchLimiter, suggestProducts);

// GET /api/search/trending — most-searched terms recorded in Redis
router.get("/trending", searchLimiter, getTrendingSearches);

export default router;
