import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post("/register", authLimiter, register);

// POST /api/auth/login
router.post("/login", authLimiter, login);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

export default router;
