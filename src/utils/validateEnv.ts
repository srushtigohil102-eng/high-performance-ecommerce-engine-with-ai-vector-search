import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
  "OPENAI_API_KEY",
  "REDIS_URL",
  "STRIPE_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `❌ Missing required environment variables:\n  ${missing.join("\n  ")}`;
    logger.error(errorMsg);
    console.error(errorMsg);
    process.exit(1);
  }

  // Validate numeric values
  const port = parseInt(process.env.PORT || "5000", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    const errorMsg = "❌ PORT must be a valid number between 1 and 65535";
    logger.error(errorMsg);
    console.error(errorMsg);
    process.exit(1);
  }

  // Validate JWT_EXPIRE format
  if (process.env.JWT_EXPIRE) {
    const validFormat = /^\d+[dhm]$/.test(process.env.JWT_EXPIRE);
    if (!validFormat) {
      const errorMsg = "❌ JWT_EXPIRE must be in format like '7d', '24h', '60m'";
      logger.error(errorMsg);
      console.error(errorMsg);
      process.exit(1);
    }
  }

  logger.info("✅ Environment variables validated successfully");
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`📍 Server Port: ${process.env.PORT || 5000}`);
};