import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Tests 55–57
router.get("/stats", dashboardController.getDashboardStats);
router.get("/revenue", dashboardController.getRevenueAnalytics);
router.get("/orders", dashboardController.getRecentOrders);

// Additional endpoints (if they exist – you can comment out if not)
router.get("/sales", dashboardController.getSalesAnalytics);
router.get("/products/top", dashboardController.getTopProducts);
router.get("/users/growth", dashboardController.getUserGrowth);
router.get("/orders/analytics", dashboardController.getOrderAnalytics);
router.get("/categories", dashboardController.getCategoryAnalytics);

export default router;