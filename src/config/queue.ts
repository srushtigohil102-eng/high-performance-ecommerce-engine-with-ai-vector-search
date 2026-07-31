import Queue from "bull";
import logger from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ===== EMAIL QUEUE =====
export const emailQueue = new Queue("email", REDIS_URL);

// ===== EMBEDDING QUEUE =====
export const embeddingQueue = new Queue("embedding", REDIS_URL);

// ===== REPORT QUEUE =====
export const reportQueue = new Queue("report", REDIS_URL);

// ===== NOTIFICATION QUEUE =====
export const notificationQueue = new Queue("notification", REDIS_URL);

// ===== QUEUE EVENTS =====
emailQueue.on("completed", (job) => {
  logger.info(`✅ Email job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  logger.error(`❌ Email job ${job.id} failed: ${err.message}`);
});

embeddingQueue.on("completed", (job) => {
  logger.info(`✅ Embedding job ${job.id} completed`);
});

embeddingQueue.on("failed", (job, err) => {
  logger.error(`❌ Embedding job ${job.id} failed: ${err.message}`);
});

reportQueue.on("completed", (job) => {
  logger.info(`✅ Report job ${job.id} completed`);
});

reportQueue.on("failed", (job, err) => {
  logger.error(`❌ Report job ${job.id} failed: ${err.message}`);
});

notificationQueue.on("completed", (job) => {
  logger.info(`✅ Notification job ${job.id} completed`);
});

notificationQueue.on("failed", (job, err) => {
  logger.error(`❌ Notification job ${job.id} failed: ${err.message}`);
});