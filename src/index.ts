import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import logger from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";



dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====

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
app.use("/api/auth", authRoutes);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/products", productRoutes);

// ===== ROUTES =====

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "E-Commerce AI Engine API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Update root endpoint with auth info
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "E-Commerce AI Engine API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        changePassword: "PUT /api/auth/change-password",
      },
      api: "/api",
    },
  });
});

// ===== START SERVER =====

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 E-COMMERCE AI ENGINE STARTED`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📦 Database: ${mongoose.connection.name}`);
      console.log(`${"=".repeat(60)}\n`);
      
      console.log(`📋 AVAILABLE ENDPOINTS:\n`);
      console.log(`   ❤️  Health    → GET  /health`);
      console.log(`   🏠  Root      → GET  /`);
      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ API ready to accept requests\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();