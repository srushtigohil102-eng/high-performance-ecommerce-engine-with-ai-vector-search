import { Request, Response } from "express";
import mongoose from "mongoose";
import os from "os";
import { redisClient } from "../config/redis";
import logger from "../utils/logger";

// ===== SYSTEM HEALTH CHECK =====
export const getSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();

    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Check Redis
    let redisStatus = "disconnected";
    try {
      if (redisClient.isReady) {
        await redisClient.ping();
        redisStatus = "connected";
      }
    } catch (error) {
      redisStatus = "error";
    }

    // System metrics
    const systemMetrics = {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        pid: process.pid,
        version: process.version,
      },
    };

    const healthData = {
      status: mongoStatus === "connected" && redisStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        mongodb: {
          status: mongoStatus,
          name: mongoose.connection.name || "unknown",
          host: mongoose.connection.host || "localhost",
          port: mongoose.connection.port || 27017,
        },
        redis: {
          status: redisStatus,
          url: process.env.REDIS_URL || "redis://localhost:6379",
        },
        server: {
          port: process.env.PORT || 5000,
          nodeVersion: process.version,
          platform: os.platform(),
        },
      },
      system: systemMetrics,
      responseTime: Date.now() - startTime,
    };

    // Log health check
    logger.info(`Health check: ${healthData.status} - ${healthData.responseTime}ms`);

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    logger.error(`Health check error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: (error as Error).message,
    });
  }
};

// ===== GET PERFORMANCE STATS =====
export const getPerformanceStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get request counts from Redis
    let requestCounts: Record<string, number> = {};
    try {
      const keys = await redisClient.keys("stats:requests:*");
      for (const key of keys) {
        const count = await redisClient.get(key);
        const endpoint = key.replace("stats:requests:", "");
        requestCounts[endpoint] = parseInt(count || "0");
      }
    } catch (error) {
      // Redis not available
    }

    res.status(200).json({
      success: true,
      data: {
        totalRequests: Object.values(requestCounts).reduce((a: number, b: number) => a + b, 0),
        endpoints: requestCounts,
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cpu: os.cpus().length,
        },
      },
    });
  } catch (error) {
    logger.error(`Performance stats error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get performance stats",
      error: (error as Error).message,
    });
  }
};