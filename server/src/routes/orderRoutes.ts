import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  reorder,
  validateDiscount,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";
import { checkoutLimiter, discountLimiter } from "../middleware/rateLimiters";
import { createOrderValidation, validateDiscountValidation, idParamValidation } from "../middleware/validate";

const router = Router();

// POST /api/orders — create order (checkout)
router.post("/", authMiddleware, checkoutLimiter, createOrderValidation, createOrder);

// GET /api/orders — logged-in user's orders
router.get("/", authMiddleware, getMyOrders);

// GET /api/orders/:id — single order (owner or admin)
router.get("/:id", authMiddleware, idParamValidation, getOrderById);

// POST /api/orders/discount/validate — validate discount code
router.post("/discount/validate", authMiddleware, discountLimiter, validateDiscountValidation, validateDiscount);

// POST /api/orders/:id/cancel — cancel own order while pending/confirmed (restores stock)
router.post("/:id/cancel", authMiddleware, idParamValidation, cancelOrder);

// POST /api/orders/:id/reorder — place a new order from a previous one
router.post("/:id/reorder", authMiddleware, idParamValidation, reorder);

export default router;
