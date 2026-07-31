import { Request, Response } from "express";
import { redisClient } from "../config/redis";
import logger from "../utils/logger";

export const getCacheStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!redisClient) {
      res.status(503).json({
        success: false,
        message: "Redis is not connected",
      });
      return;
    }

    // Get Redis info
    const info = await redisClient.info();
    const stats: any = {};

    // Parse key metrics from Redis INFO output
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith('connected_clients:')) {
        stats.connectedClients = parseInt(line.split(':')[1]);
      } else if (line.startsWith('used_memory_human:')) {
        stats.usedMemory = line.split(':')[1];
      } else if (line.startsWith('total_commands_processed:')) {
        stats.totalCommands = parseInt(line.split(':')[1]);
      } else if (line.startsWith('keyspace_hits:')) {
        stats.hits = parseInt(line.split(':')[1]);
      } else if (line.startsWith('keyspace_misses:')) {
        stats.misses = parseInt(line.split(':')[1]);
      } else if (line.startsWith('uptime_in_seconds:')) {
        stats.uptime = parseInt(line.split(':')[1]);
      }
    }

    // Calculate hit rate
    const total = (stats.hits || 0) + (stats.misses || 0);
    stats.hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(2) + '%' : '0%';

    // Get key count by pattern (optional – expensive, so use with caution)
    // const keys = await redisClient.keys('*');
    // stats.totalKeys = keys.length;

    res.status(200).json({
      success: true,
      message: "Cache statistics retrieved",
      data: {
        connectedClients: stats.connectedClients || 0,
        usedMemory: stats.usedMemory || 'N/A',
        totalCommands: stats.totalCommands || 0,
        hits: stats.hits || 0,
        misses: stats.misses || 0,
        hitRate: stats.hitRate,
        uptimeSeconds: stats.uptime || 0,
        // totalKeys: stats.totalKeys || 0,
      },
    });
  } catch (error: any) {
    logger.error(`Cache stats error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get cache stats",
      error: error.message,
    });
  }
};

export const clearCache = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!redisClient) {
      res.status(503).json({
        success: false,
        message: "Redis is not connected",
      });
      return;
    }

    await redisClient.flushAll();
    logger.info('Cache cleared by admin');

    res.status(200).json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error: any) {
    logger.error(`Clear cache error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message,
    });
  }
};