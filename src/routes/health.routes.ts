import { Router } from "express";
import { getSystemHealth, getPerformanceStats } from "../controllers/health.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();


// Public health check
router.get("/health", getSystemHealth);

// Admin only - performance stats
router.get("/performance", authenticate, requireAdmin, getPerformanceStats);

export default router;