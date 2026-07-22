import { Request, Response } from 'express';
import { generateSalesReport, generateInventoryReport, generateUserAnalyticsReport } from '../services/report.service';
import { reportQueue } from '../config/queue';
import logger from '../utils/logger';

// ===== DOWNLOAD SALES REPORT =====
export const downloadSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const buffer = await generateSalesReport(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    logger.error(`Download sales report error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: (error as Error).message,
    });
  }
};

// ===== DOWNLOAD INVENTORY REPORT =====
export const downloadInventoryReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const buffer = await generateInventoryReport();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    logger.error(`Download inventory report error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: (error as Error).message,
    });
  }
};

// ===== DOWNLOAD USER ANALYTICS REPORT =====
export const downloadUserAnalyticsReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const buffer = await generateUserAnalyticsReport();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=user-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    logger.error(`Download user analytics report error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate user analytics report',
      error: (error as Error).message,
    });
  }
};

// ===== GENERATE REPORT VIA QUEUE =====
export const generateReportAsync = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, filters } = req.body;

    const job = await reportQueue.add({
      type,
      filters,
      requestedBy: req.user?.id,
    });

    res.status(202).json({
      success: true,
      message: 'Report generation started',
      data: {
        jobId: job.id,
        status: 'queued',
      },
    });
  } catch (error) {
    logger.error(`Generate report async error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to start report generation',
      error: (error as Error).message,
    });
  }
};