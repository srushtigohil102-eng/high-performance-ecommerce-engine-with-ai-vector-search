import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { redisClient } from "../config/redis";

// ===== REQUEST TRACKING MIDDLEWARE =====
export const requestTracker = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Store response data
  let responseBody: any = null;

  // Override json to capture response
  res.json = function (body: any): Response {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Track when response is sent
  res.end = function (chunk?: any, encoding?: any, cb?: any): any {
    const duration = Date.now() - startTime;

    // Log request
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    // Track endpoint stats in Redis
    const endpoint = req.route?.path || req.path;
    try {
      if (redisClient.isReady) {
        const key = `stats:requests:${req.method}:${endpoint}`;
        redisClient.incr(key);
        redisClient.expire(key, 3600); // Expire after 1 hour
      }
    } catch (error) {
      // Redis not available
    }

    // Log errors (status >= 400)
    if (res.statusCode >= 400) {
      logger.error(`[${res.statusCode}] ${req.method} ${req.url} - ${duration}ms`, {
        error: responseBody,
        ...logData,
      });
    } else {
      logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }

    // Call original end
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};