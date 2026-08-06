import { Router } from "express";
import * as emailController from "../controllers/email.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/send-welcome", emailController.sendWelcome as any);
router.post("/send-order-confirmation", emailController.sendOrderConfirmation as any);
router.post("/send-password-reset", emailController.sendPasswordReset as any);

export default router;