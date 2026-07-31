import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";
// socket service not used in routes; import removed to avoid unused import warning

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);

// Admin only routes
router.get("/admin/all", requireAdmin, getAllOrders);
router.put("/admin/:id/status", requireAdmin, updateOrderStatus);

export default router;