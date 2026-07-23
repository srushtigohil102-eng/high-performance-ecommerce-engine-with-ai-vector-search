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
import logger from "./utils/logger";
import { initializeSocket } from "./services/socket.service";
import { connectRedis } from "./config/redis";
import { cacheMiddleware } from "./middleware/cache.middleware";


// Import routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import searchRoutes from "./routes/search.routes";
import reportRoutes from './routes/report.routes';
import dashboardRoutes from "./routes/dashboard.routes";


// queue.routes is optional; if not present, skip mounting queue routes
let queueRoutes: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  queueRoutes = require("./routes/queue.routes").default;
} catch (err) {
  // ignore if file doesn't exist
}

// cache.routes is optional; if not present, skip mounting cache routes
let cacheRoutes: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cacheRoutes = require("./routes/cache.routes").default;
} catch (err) {
  // ignore if file doesn't exist
}

// Import controllers for caching
import { getAllProducts, getProductById } from "./controllers/product.controller";
import { getAllCategories } from "./controllers/category.controller";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ===== MIDDLEWARE =====

// Webhook route - raw body required (MUST be before express.json)
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

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/search", searchRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/queue", queueRoutes);
if (cacheRoutes) {
  app.use("/api/cache", cacheRoutes);
}

// ===== CACHED ROUTES =====
// Products - cached for 5 minutes (300 seconds)
app.get("/api/products", cacheMiddleware(300), getAllProducts);
// Product by ID - cached for 10 minutes (600 seconds)
app.get("/api/products/:id", cacheMiddleware(600), getProductById);
// Categories - cached for 10 minutes (600 seconds)
app.get("/api/products/categories", cacheMiddleware(600), getAllCategories);

// ===== HEALTH CHECK =====
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    redis: "Connected", // This will be updated dynamically
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
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
      cache: "/api/cache",
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

// ===== START SERVER =====

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Initialize Socket.io
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 E-COMMERCE AI ENGINE STARTED`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📦 Database: ${mongoose.connection.name}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
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