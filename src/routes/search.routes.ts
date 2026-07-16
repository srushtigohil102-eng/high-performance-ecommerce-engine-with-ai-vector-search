import { Router } from "express";import {
  vectorSearch,
  hybridSearch,
  getSimilarProducts,
} from "../controllers/search.controller";

const router = Router();

// Public routes
router.get("/vector", vectorSearch);
router.get("/hybrid", hybridSearch);
router.get("/similar/:productId", getSimilarProducts);

export default router;