import { Router } from "express";
import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getAdminStats,
} from "../controllers/orderController";
import { getAuditLogs } from "../controllers/auditController";
import { getAdminUsers, getAdminUserById } from "../controllers/adminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { adminLimiter } from "../middleware/rateLimiters";
import { updateOrderStatusValidation, updateTrackingValidation, idParamValidation } from "../middleware/validate";

const router = Router();

// All admin routes require auth + admin role, plus a rate limit safety net
router.use(authMiddleware, adminMiddleware, adminLimiter);

// GET /api/admin/audit — audit log (paginated)
router.get("/audit", getAuditLogs);

// GET /api/admin/stats — dashboard statistics
router.get("/stats", getAdminStats);

// GET /api/admin/users — customer list with order stats
router.get("/users", getAdminUsers);

// GET /api/admin/users/:id — single customer with their orders
router.get("/users/:id", idParamValidation, getAdminUserById);

// GET /api/admin/orders — all orders
router.get("/orders", getAllOrders);

// GET /api/admin/orders/:id — single order detail
router.get("/orders/:id", idParamValidation, getAdminOrderById);

// PATCH /api/admin/orders/:id/status — update order status
router.patch("/orders/:id/status", updateOrderStatusValidation, updateOrderStatus);

// PATCH /api/admin/orders/:id/tracking — set/clear the carrier tracking number
router.patch("/orders/:id/tracking", updateTrackingValidation, updateOrderTracking);

export default router;
