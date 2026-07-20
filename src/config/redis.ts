import { createClient } from "redis";
import logger from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected Successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
  logger.error(`Redis error: ${err.message}`);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
  }
};