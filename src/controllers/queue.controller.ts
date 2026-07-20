import { Request, Response } from "express";
import { emailQueue, embeddingQueue, reportQueue, notificationQueue } from "../config/queue";
import logger from "../utils/logger";

// ===== ADD TO QUEUE =====
export const addEmailJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body;

    const job = await emailQueue.add({ type, data });
    res.status(200).json({
      success: true,
      message: "Email job added to queue",
      data: { jobId: job.id },
    });
  } catch (error) {
    logger.error(`Add email job error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to add email job",
      error: (error as Error).message,
    });
  }
};

// ===== GET QUEUE STATUS =====
export const getQueueStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [emailCounts, embeddingCounts, reportCounts, notificationCounts] = await Promise.all([
      emailQueue.getJobCounts(),
      embeddingQueue.getJobCounts(),
      reportQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        email: emailCounts,
        embedding: embeddingCounts,
        report: reportCounts,
        notification: notificationCounts,
      },
    });
  } catch (error) {
    logger.error(`Get queue status error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get queue status",
      error: (error as Error).message,
    });
  }
};

// ===== CLEAR QUEUE =====
export const clearQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { queueName } = req.params;

    let queue;
    switch (queueName) {
      case "email":
        queue = emailQueue;
        break;
      case "embedding":
        queue = embeddingQueue;
        break;
      case "report":
        queue = reportQueue;
        break;
      case "notification":
        queue = notificationQueue;
        break;
      default:
        res.status(400).json({
          success: false,
          message: `Invalid queue name: ${queueName}`,
        });
        return;
    }

    await queue.empty();

    res.status(200).json({
      success: true,
      message: `Queue ${queueName} cleared successfully`,
    });
  } catch (error) {
    logger.error(`Clear queue error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to clear queue",
      error: (error as Error).message,
    });
  }
};