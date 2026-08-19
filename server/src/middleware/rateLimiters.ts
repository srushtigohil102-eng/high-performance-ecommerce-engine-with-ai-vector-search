import rateLimit from "express-rate-limit";

// Shared rate limiters. All keyed by IP. Thresholds are deliberately generous
// to keep demos friction-free while still stopping abuse.

const defaultOptions = {
  windowMs: 15 * 60 * 1000,
  message: { message: "Too many requests, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
};

// Auth (register/login) — configurable, matches the documented default.
export const authLimiter = rateLimit({
  ...defaultOptions,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "100", 10),
});

// Sensitive, token-generating auth flows (forgot/reset/verify/resend/refresh).
export const tokenLimiter = rateLimit({
  ...defaultOptions,
  max: 20,
});

// Checkout — prevents stock-sweeping / order spam from a single IP.
export const checkoutLimiter = rateLimit({
  ...defaultOptions,
  max: 10,
});

// Discount-code brute forcing.
export const discountLimiter = rateLimit({
  ...defaultOptions,
  max: 30,
});

// Public search abuse (scraping, DoS via expensive queries).
export const searchLimiter = rateLimit({
  ...defaultOptions,
  max: 120,
});

// Admin panel — safety net on top of auth + RBAC.
export const adminLimiter = rateLimit({
  ...defaultOptions,
  max: 120,
});
