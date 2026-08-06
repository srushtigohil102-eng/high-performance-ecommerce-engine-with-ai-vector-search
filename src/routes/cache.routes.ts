import { Router } from "express";
import { getCacheStats, clearCache } from "../controllers/cache.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All cache routes require authentication
router.use(authenticate);

router.get("/stats", getCacheStats);
router.delete("/clear", clearCache);

export default router;