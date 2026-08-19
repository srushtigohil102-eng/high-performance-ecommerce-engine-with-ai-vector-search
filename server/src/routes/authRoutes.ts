import { Router } from "express";
import {
  register,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
} from "../middleware/validate";
import { authLimiter, tokenLimiter } from "../middleware/rateLimiters";

const router = Router();

// POST /api/auth/register
router.post("/register", authLimiter, registerValidation, register);

// POST /api/auth/login
router.post("/login", authLimiter, loginValidation, login);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

// POST /api/auth/refresh — new access token from httpOnly refresh cookie
router.post("/refresh", tokenLimiter, refresh);

// POST /api/auth/logout — invalidate refresh token + clear cookie
router.post("/logout", logout);

// POST /api/auth/forgot-password
router.post("/forgot-password", tokenLimiter, forgotPasswordValidation, forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", tokenLimiter, resetPasswordValidation, resetPassword);

// GET /api/auth/verify-email?token=...&email=...
router.get("/verify-email", tokenLimiter, verifyEmailValidation, verifyEmail);

// POST /api/auth/resend-verification
router.post("/resend-verification", tokenLimiter, resendVerificationValidation, resendVerification);

export default router;
