import { Types } from "mongoose";
import { AuditLog, AuditAction } from "../models/AuditLog";

interface AuditEntry {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  actor?: Types.ObjectId | string | null;
  ip?: string;
  userAgent?: string;
}

// Best-effort audit write: a failed audit insert must never break the business
// operation that triggered it, so errors are logged and swallowed.
export const logAudit = async (entry: AuditEntry): Promise<void> => {
  try {
    await AuditLog.create({
      actor: entry.actor ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ?? {},
      ip: entry.ip,
      userAgent: entry.userAgent,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
