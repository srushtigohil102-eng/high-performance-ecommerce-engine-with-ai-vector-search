import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./config/db";
import { connectRedis } from "./config/redis";
import { Product } from "./models/Product";
import { seedIfEmpty } from "./utils/seedIfEmpty";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import searchRoutes from "./routes/searchRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import reviewRoutes from "./routes/reviewRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a reverse proxy (nginx, etc.), trust the first hop so rate limiting
// and req.ip use the real client IP instead of the proxy's. Set TRUST_PROXY=true
// in the environment only when such a proxy is actually in place.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing (refresh token is delivered via an httpOnly cookie)
app.use(cookieParser());

// NoSQL injection guard — strips `$`-prefixed and dotted keys from req.body,
// req.query, and req.params before any controller or validator sees them.
app.use(mongoSanitize());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler — maps thrown/parse errors to proper status codes.
// body-parser syntax errors (e.g. malformed JSON) are 4xx client faults, not
// 500 server faults; everything else stays a generic 500.
interface HttpError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
}

app.use(
  (
    err: HttpError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.statusCode ?? err.status ?? 500;

    if (status >= 500) {
      console.error("Unhandled error:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    const message =
      err.type === "entity.parse.failed"
        ? "Invalid JSON in request body"
        : err.message || "Bad request";
    res.status(status).json({ message });
  }
);

const start = async () => {
  // Fail fast with a clear message instead of generating unpredictable JWT
  // failures at request time when the secret is missing or trivially weak.
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 16) {
    console.error(
      "FATAL: JWT_SECRET is required and must be at least 16 characters. Set it in server/.env"
    );
    process.exit(1);
  }

  try {
    await connectDB();
    // Build schema indexes (incl. the $text search index) explicitly — Mongoose
    // disables autoIndex under NODE_ENV=production, and search silently 500s
    // without the text index on a fresh database.
    await Product.init();
    try {
      await connectRedis();
    } catch {
      console.warn("Redis unavailable — running without cache");
    }
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
