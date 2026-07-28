import { Router } from "express";
import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getAdminStats,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats — dashboard statistics
router.get("/stats", getAdminStats);

// GET /api/admin/orders — all orders
router.get("/orders", getAllOrders);

// GET /api/admin/orders/:id — single order detail
router.get("/orders/:id", getAdminOrderById);

// PATCH /api/admin/orders/:id/status — update order status
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
