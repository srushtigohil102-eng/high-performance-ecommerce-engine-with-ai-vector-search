import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../models/User";
import { Order } from "../models/Order";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePage = (value: string | undefined, fallback: number, max: number): number =>
  Math.min(max, Math.max(1, parseInt(value ?? "", 10) || fallback));

// GET /api/admin/users?page=1&limit=20&search=alice&role=customer
// Lists users with live order stats (count + total spent, excluding cancelled orders).
export const getAdminUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = normalizePage(req.query.page as string, 1, Infinity);
    const limit = normalizePage(req.query.limit as string, 20, 50);
    const skip = (page - 1) * limit;

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : undefined;

    const match: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      match.$or = [{ name: regex }, { email: regex }];
    }
    if (role) match.role = role;

    const [users, total] = await Promise.all([
      User.aggregate([
        { $match: match },
        { $lookup: { from: "orders", localField: "_id", foreignField: "user", as: "orders" } },
        {
          $project: {
            id: { $toString: "$_id" },
            name: 1,
            email: 1,
            role: 1,
            emailVerified: 1,
            createdAt: 1,
            activeOrders: {
              $filter: {
                input: "$orders",
                as: "order",
                cond: { $ne: ["$$order.status", "cancelled"] },
              },
            },
          },
        },
        {
          $project: {
            id: 1,
            name: 1,
            email: 1,
            role: 1,
            emailVerified: 1,
            createdAt: 1,
            orderCount: { $size: "$activeOrders" },
            totalSpent: { $sum: "$activeOrders.total" },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      User.countDocuments(match),
    ]);

    res.json({
      users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/users/:id
// Single user with their most recent orders and lifetime stats.
export const getAdminUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id as string;
    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid ID format" });
      return;
    }

    const [user, orders, statsResult] = await Promise.all([
      User.findById(userId),
      Order.find({ user: userId })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(20),
      Order.aggregate([
        { $match: { user: new Types.ObjectId(userId), status: { $ne: "cancelled" } } },
        { $group: { _id: null, count: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
      ]),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const stats = statsResult[0];

    res.json({
      user,
      orders,
      orderCount: stats?.count ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin user detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
