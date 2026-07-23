import { Router } from "express";
import {
  getDashboardStats,
  getSalesAnalytics,
  getTopProducts,
  getUserGrowth,
  getOrderAnalytics,
  getCategoryAnalytics,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/sales", getSalesAnalytics);
router.get("/products/top", getTopProducts);
router.get("/users/growth", getUserGrowth);
router.get("/orders/analytics", getOrderAnalytics);
router.get("/categories", getCategoryAnalytics);

export default router;