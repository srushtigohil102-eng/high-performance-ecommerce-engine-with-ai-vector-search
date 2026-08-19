import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { AuditLog } from "../models/AuditLog";

// GET /api/admin/audit?page=1&limit=20&action=product.created
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const action =
      typeof req.query.action === "string" ? (req.query.action as string) : undefined;
    const filter = action ? { action } : {};

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("actor", "name email"),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
