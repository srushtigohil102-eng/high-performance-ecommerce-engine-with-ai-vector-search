import mongoose, { Document, Schema, Types } from "mongoose";

export type AuditAction =
  | "user.registered"
  | "user.profile_updated"
  | "user.password_changed"
  | "user.address_added"
  | "user.address_updated"
  | "user.address_deleted"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "order.status_changed"
  | "order.tracking_updated";

export interface IAuditLog extends Document {
  actor: Types.ObjectId | null; // null for unauthenticated events
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    // Audit rows are append-only and read back through the admin endpoint,
    // which uses its own pagination — no transform needed.
  }
);

// Pagination-friendly: newest-first reads are the common query.
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
