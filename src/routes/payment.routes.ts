import { Router } from "express";
import { createPaymentIntent, confirmPayment } from "../controllers/payment.controller";
import { stripeWebhook } from "../controllers/webhook.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Webhook route - raw body required, no authentication
router.post("/webhook", stripeWebhook);

// Payment routes - require authentication
router.post("/create-intent", authenticate, createPaymentIntent);
router.post("/confirm", authenticate, confirmPayment);

export default router;