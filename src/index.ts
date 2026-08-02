import express, { Application, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import { redisClient } from "./config/redis";
import logger from "./utils/logger";
import { initializeSocket } from "./services/socket.service";
import { connectRedis } from "./config/redis";
import { setupSwagger } from "./config/swagger";
import { validateEnv } from "./utils/validateEnv";


// Import routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import searchRoutes from "./routes/search.routes";
import reportRoutes from './routes/report.routes';
import healthRoutes from "./routes/health.routes";
import emailRoutes from "./routes/email.routes";
import dashboardRoutes from "./routes/dashboard.routes";

// Optional routes
let queueRoutes: any = null;
try {
  queueRoutes = require("./routes/queue.routes").default;
} catch (err) { /* ignore */ }

let cacheRoutes: any = null;
try {
  cacheRoutes = require("./routes/cache.routes").default;
} catch (err) { /* ignore */ }

dotenv.config();
validateEnv();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ===== MIDDLEWARE =====

// Webhook - raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(compression());
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// ===== SWAGGER =====
setupSwagger(app);

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);  // ← caching is now applied inside this router
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/email", emailRoutes);


if (queueRoutes) app.use("/api/queue", queueRoutes);
if (cacheRoutes) app.use("/api/cache", cacheRoutes);

// ===== HEALTH CHECK =====
app.get("/health", (_req: Request, res: Response) => {
  const redisStatus = redisClient.isReady ? "Connected" : "Disconnected";
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    redis: redisStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// ===== ROOT ENDPOINT =====
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "E-Commerce AI Engine API",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      payments: "/api/payments",
      search: "/api/search",
      cache: cacheRoutes ? "/api/cache" : "disabled",
      queue: queueRoutes ? "/api/queue" : "disabled",
      reports: "/api/reports",
      dashboard: "/api/dashboard",
      docs: "/api-docs",
      websocket: `ws://localhost:${PORT}`,
    },
  });
});

// ===== 404 HANDLER =====
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ===== ERROR HANDLER =====
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async () => {
  logger.info("🛑 Received shutdown signal. Gracefully shutting down...");
  try {
    await mongoose.disconnect();
    await redisClient.quit();
    server.close(() => {
      logger.info("💤 HTTP server closed.");
      process.exit(0);
    });
  } catch (err) {
    logger.error(`❌ Error during shutdown: ${err}`);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("uncaughtException", (err) => {
  logger.error(`💥 Uncaught exception: ${err.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error(`💥 Unhandled rejection: ${reason}`);
  process.exit(1);
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 E-COMMERCE AI ENGINE STARTED`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📦 Database: ${mongoose.connection.name}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`${"=".repeat(60)}\n`);
      console.log(`📋 AVAILABLE ENDPOINTS:\n`);
      console.log(`   ❤️  Health    → GET  /health`);
      console.log(`   🔐  Auth      → /api/auth`);
      console.log(`   📦  Products  → /api/products`);
      console.log(`   🛒  Cart      → /api/cart`);
      console.log(`   📦  Orders    → /api/orders`);
      console.log(`   💳  Payment   → /api/payments`);
      console.log(`   🔍  Search    → /api/search`);
      if (cacheRoutes) console.log(`   🗄️  Cache      → /api/cache`);
      if (queueRoutes) console.log(`   📋  Queue      → /api/queue`);
      console.log(`   📊  Reports   → /api/reports`);
      console.log(`   📈  Dashboard → /api/dashboard`);
      console.log(`   📚  Docs      → /api-docs`);
      console.log(`   🔌  WebSocket → ws://localhost:${PORT}`);
      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ API ready to accept requests\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();