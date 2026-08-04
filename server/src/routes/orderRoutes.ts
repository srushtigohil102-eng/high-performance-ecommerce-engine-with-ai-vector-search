import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  validateDiscount,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createOrderValidation, validateDiscountValidation, idParamValidation } from "../middleware/validate";

const router = Router();

// POST /api/orders — create order (checkout)
router.post("/", authMiddleware, createOrderValidation, createOrder);

// GET /api/orders — logged-in user's orders
router.get("/", authMiddleware, getMyOrders);

// GET /api/orders/:id — single order (owner or admin)
router.get("/:id", authMiddleware, idParamValidation, getOrderById);

// POST /api/orders/discount/validate — validate discount code
router.post("/discount/validate", authMiddleware, validateDiscountValidation, validateDiscount);

export default router;
