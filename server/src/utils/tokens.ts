import crypto from "crypto";

// Time-to-live constants for one-time auth tokens.
// Tokens are single-use, high-entropy (32 random bytes), stored hashed (sha256)
// so a database leak never exposes usable tokens.
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const generateAuthToken = (): string =>
  crypto.randomBytes(32).toString("hex");

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

// Base URL used to build links embedded in transactional emails (verification,
// password reset, order confirmations, status updates). Override with CLIENT_URL.
export const getClientUrl = (): string =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
