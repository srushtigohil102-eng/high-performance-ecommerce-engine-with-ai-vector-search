import { Router } from "express";
import { searchProducts } from "../controllers/searchController";

const router = Router();

// GET /api/search?q=<query>&page=1&limit=12
// Public endpoint — no auth required (same as GET /api/products).
// Returns the same response shape so the frontend can consume it directly.
router.get("/", searchProducts);

export default router;
