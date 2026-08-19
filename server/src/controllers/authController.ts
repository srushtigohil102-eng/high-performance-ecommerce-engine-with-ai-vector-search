import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  generateAuthToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  EMAIL_VERIFY_TTL_MS,
  getClientUrl,
} from "../utils/tokens";
import { logAudit } from "../utils/audit";
import {
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";

const REFRESH_COOKIE_NAME = "refreshToken";

// httpOnly cookie so the refresh token is never readable from JS (XSS-safe).
// `secure` is env-controlled: off for local http dev, on when serving HTTPS in
// production (COOKIE_SECURE=true). SameSite=Lax keeps the cookie usable for
// cross-origin XHR between the Vite dev server (5173) and the API (5000),
// which share the same site (localhost).
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Please provide name, email, and password" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({ name, email, password });

    // Email verification (soft, dev-mode): account starts unverified and a
    // verification link is "emailed" via the console stand-in above.
    const verificationToken = generateAuthToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
    await user.save();

    // Fire-and-forget emails (never block or fail registration): a welcome
    // message plus the verification link so the account can be confirmed.
    void sendWelcomeEmail(user);
    void sendEmailVerificationEmail(
      user,
      `${getClientUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
    );

    // Issue access token + httpOnly refresh token cookie
    const token = generateToken(user.id, user.email, user.role, user.emailVerified);
    const refreshToken = generateAuthToken();
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await user.save();
    setRefreshTokenCookie(res, refreshToken);

    // Fire-and-forget audit trail (never blocks or fails the registration).
    void logAudit({
      action: "user.registered",
      resource: "user",
      resourceId: user.id,
      details: { email: user.email },
      actor: user.id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      token,
    });
  } catch (error) {
    // Unique-index race: two registrations with the same email landing here
    // hit E11000 instead of the pre-check above — report it as a conflict.
    if ((error as { code?: number }).code === 11000) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id, user.email, user.role, user.emailVerified);

    // Rotate the refresh token on every login
    const refreshToken = generateAuthToken();
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await user.save();
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/refresh — issue a new access token from the refresh cookie.
// Rotates the refresh token (old one is invalidated) so a stolen cookie can't
// be replayed indefinitely. The rotation is done atomically with findOneAndUpdate
// so two concurrent refreshes with the same cookie can't both succeed.
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const receivedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!receivedToken) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    const newRefreshToken = generateAuthToken();
    const user = await User.findOneAndUpdate(
      {
        refreshToken: hashToken(receivedToken),
        refreshTokenExpires: { $gt: new Date() },
      },
      {
        $set: {
          refreshToken: hashToken(newRefreshToken),
          refreshTokenExpires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
      { new: true }
    );

    if (!user) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const token = generateToken(user.id, user.email, user.role, user.emailVerified);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/logout — invalidate the refresh token and clear the cookie.
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const receivedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (receivedToken) {
      await User.updateOne(
        { refreshToken: hashToken(receivedToken) },
        { $unset: { refreshToken: "", refreshTokenExpires: "" } }
      );
    }
    clearRefreshTokenCookie(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = generateAuthToken();
      user.passwordResetToken = hashToken(resetToken);
      user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      await user.save();

      void sendPasswordResetEmail(
        user,
        `${getClientUrl()}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
      );
    }

    // Always respond the same way regardless of whether the account exists,
    // so the endpoint can't be used to enumerate registered emails.
    res.json({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token) {
      res.status(400).json({ message: "Reset token is required" });
      return;
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Revoke the account's refresh token so existing sessions (including the
    // one that initiated the reset) are forced to sign in with the new password.
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save();
    clearRefreshTokenCookie(res);

    res.json({ message: "Password has been reset. You can now sign in." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/auth/verify-email?token=...&email=...
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email } = req.query;

    if (!token) {
      res.status(400).json({ message: "Verification token is required" });
      return;
    }

    const filter: Record<string, unknown> = {
      emailVerificationToken: hashToken(String(token)),
      emailVerificationExpires: { $gt: new Date() },
    };
    if (email) filter.email = String(email).toLowerCase();

    const user = await User.findOne(filter);

    if (!user) {
      res.status(400).json({ message: "Invalid or expired verification token" });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", emailVerified: true });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/resend-verification
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user && !user.emailVerified) {
      const verificationToken = generateAuthToken();
      user.emailVerificationToken = hashToken(verificationToken);
      user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
      await user.save();

      void sendEmailVerificationEmail(
        user,
        `${getClientUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
      );
    }

    res.json({
      message: "If your account is unverified, a new verification email has been sent.",
    });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
