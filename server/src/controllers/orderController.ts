import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Order, IOrderItem, IOrder, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import { DiscountCode } from "../models/DiscountCode";
import { User } from "../models/User";
import type { IUser } from "../models/User";
import { invalidateProductCache, PRODUCT_CACHE_PATTERNS } from "../utils/cache";
import { logAudit } from "../utils/audit";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} from "../services/emailService";

// Fire-and-forget customer email helper — SMTP failures are logged inside the
// email service and must never fail the order flow that triggered the email.
const notifyOrderCustomer = async (
  userId: string,
  order: IOrder,
  fn: (user: IUser, order: IOrder) => Promise<void>
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (user) await fn(user, order);
  } catch (error) {
    console.error("[email] Failed to notify customer:", error);
  }
};

// A cancelled order releases the items it claimed back into stock and drops
// cached product/search responses so the restore is visible immediately.
const restoreOrderStock = async (order: IOrder): Promise<void> => {
  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: item.quantity } },
    },
  }));
  await Product.bulkWrite(bulkOps);
  await invalidateProductCache([
    ...PRODUCT_CACHE_PATTERNS,
    ...order.items.map((item: IOrderItem) => `products:item:${item.product.toString()}`),
  ]);
};

// Append to the per-order timeline and set the current status in one step.
const pushStatus = (order: IOrder, status: OrderStatus, note?: string): void => {
  order.status = status;
  order.statusHistory.push({ status, at: new Date(), note });
};

const auditOrderChange = (
  req: AuthRequest,
  action: "order.status_changed" | "order.tracking_updated",
  resourceId: string,
  details: Record<string, unknown>
): void => {
  void logAudit({
    action,
    resource: "order",
    resourceId,
    details,
    actor: req.user?._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
};

// POST /api/orders — create order (checkout)
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, shippingAddress, discountCode } = req.body;

    if (!items || !items.length) {
      res.status(400).json({ message: "Please provide at least one item" });
      return;
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.country
    ) {
      res.status(400).json({ message: "Complete shipping address is required" });
      return;
    }

    // Fetch all products in the order
    const productIds = items.map((item: { product: string }) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: "One or more products not found" });
      return;
    }

    // Build order items, validate stock, calculate subtotal
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find(
        (p) => p._id.toString() === item.product
      );

      if (!product) {
        res.status(400).json({ message: `Product ${item.product} not found` });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        });
        return;
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Validate discount code
    let discount = 0;
    let appliedCode: string | undefined;

    if (discountCode) {
      const dc = await DiscountCode.findOne({
        code: discountCode.toUpperCase(),
        active: true,
      });

      if (!dc) {
        res.status(400).json({ message: "Invalid or inactive discount code" });
        return;
      }

      discount = Math.round((subtotal * dc.percentage) / 100 * 100) / 100;
      appliedCode = dc.code;
    }

    const total = Math.round((subtotal - discount) * 100) / 100;

    // Decrement stock
    const bulkOps = items.map((item: { product: string; quantity: number }) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    await Product.bulkWrite(bulkOps);

    // Create order
    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      shippingAddress,
      discountCode: appliedCode,
      subtotal,
      discount,
      total,
      status: "pending",
      statusHistory: [{ status: "pending", at: new Date() }],
    });

    // Invalidate product caches (stock changed)
    await invalidateProductCache([
      ...PRODUCT_CACHE_PATTERNS,
      ...productIds.map((id: string) => `products:item:${id}`),
    ]);

    // Order confirmation email — never blocks order creation.
    void notifyOrderCustomer(order.user.toString(), order, sendOrderConfirmationEmail);

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/orders — user's own orders
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name imageUrl");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/orders/:id — single order (owner or admin)
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "name imageUrl category"
    );

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Only owner or admin can view
    if (
      order.user.toString() !== req.user!._id &&
      req.user!.role !== "admin"
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/orders — all orders (admin)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const status =
      typeof req.query.status === "string" ? (req.query.status as string) : undefined;
    const filter = status ? { status } : {};

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user", "name email")
        .populate("items.product", "name imageUrl"),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/orders/:id/status — update order status (admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    const validStatuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const previousStatus = order.status;
    if (previousStatus === status) {
      res.json(order);
      return;
    }

    // Cancellation is irreversible and releases the reserved stock.
    if (status === "cancelled") {
      await restoreOrderStock(order);
    }

    pushStatus(order, status as OrderStatus);
    await order.save();

    auditOrderChange(req, "order.status_changed", order.id, {
      from: previousStatus,
      to: status,
    });

    // Notify the customer about the status change (admin flow).
    void notifyOrderCustomer(order.user.toString(), order, (u, o) =>
      sendOrderStatusUpdateEmail(u, o, status as OrderStatus)
    );

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/orders/:id/cancel — cancel own order while pending/confirmed
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Owner or admin may cancel.
    if (order.user.toString() !== req.user!._id && req.user!.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    if (order.status === "cancelled") {
      res.json(order);
      return;
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      res.status(400).json({
        message: `Orders in "${order.status}" status cannot be cancelled`,
      });
      return;
    }

    await restoreOrderStock(order);
    pushStatus(
      order,
      "cancelled",
      req.user!.role === "admin" ? "Cancelled by admin" : "Cancelled by customer"
    );
    await order.save();

    auditOrderChange(req, "order.status_changed", order.id, {
      from: order.statusHistory[order.statusHistory.length - 2]?.status ?? order.status,
      to: "cancelled",
    });

    // Notify the customer that their order was cancelled.
    void notifyOrderCustomer(order.user.toString(), order, (u, o) =>
      sendOrderStatusUpdateEmail(u, o, "cancelled")
    );

    res.json(order);
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/orders/:id/reorder — place a new order from a previous one
export const reorder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const source = await Order.findById(req.params.id);
    if (!source) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Owner or admin may reorder.
    if (source.user.toString() !== req.user!._id && req.user!.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const productIds = source.items.map((item: IOrderItem) => item.product.toString());
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: "One or more products are no longer available" });
      return;
    }

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of source.items) {
      const product = products.find(
        (p) => p._id.toString() === item.product.toString()
      );
      if (!product) {
        res.status(400).json({ message: `Product ${item.product} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        });
        return;
      }
      subtotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const total = Math.round(subtotal * 100) / 100;

    await Product.bulkWrite(
      orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } },
        },
      }))
    );

    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      shippingAddress: source.shippingAddress,
      subtotal: total,
      discount: 0,
      total,
      status: "pending",
      statusHistory: [
        { status: "pending", at: new Date(), note: `Reordered from order ${source.id}` },
      ],
    });

    await invalidateProductCache([
      ...PRODUCT_CACHE_PATTERNS,
      ...orderItems.map((item) => `products:item:${item.product.toString()}`),
    ]);

    // Order confirmation email for the reordered order.
    void notifyOrderCustomer(order.user.toString(), order, sendOrderConfirmationEmail);

    res.status(201).json(order);
  } catch (error) {
    console.error("Error reordering:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/orders/:id/tracking — set/clear the carrier tracking number
export const updateOrderTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const { trackingNumber } = req.body;
    const value = typeof trackingNumber === "string" ? trackingNumber.trim() : "";
    order.trackingNumber = value || undefined;

    pushStatus(
      order,
      order.status,
      value ? `Tracking number added: ${value}` : "Tracking number removed"
    );
    await order.save();

    auditOrderChange(req, "order.tracking_updated", order.id, { trackingNumber: value });

    res.json(order);
  } catch (error) {
    console.error("Error updating tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/orders/discount/validate — validate discount code
export const validateDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ message: "Please provide a discount code" });
      return;
    }

    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!discountCode) {
      res.status(404).json({ message: "Invalid or inactive discount code" });
      return;
    }

    res.json({
      code: discountCode.code,
      percentage: discountCode.percentage,
      message: `${discountCode.percentage}% discount applied`,
    });
  } catch (error) {
    console.error("Error validating discount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/orders/:id — single order detail (admin)
export const getAdminOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name imageUrl category");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching admin order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/stats — dashboard statistics (admin)
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalProducts, totalOrders, lowStockProducts, revenueResult, recentOrders, topProductsResult, lowStockList] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Product.countDocuments({ stock: { $lte: 5 } }),
        Order.aggregate([
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.find()
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .limit(5),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              quantitySold: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            },
          },
          { $sort: { quantitySold: -1, revenue: -1 } },
          { $limit: 5 },
          {
            $project: {
              name: "$_id",
              quantitySold: 1,
              revenue: 1,
            },
          },
        ]),
        Product.find({ stock: { $lte: 5 } })
          .select("name stock imageUrl price")
          .sort({ stock: 1 })
          .limit(8),
      ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    res.json({
      totalProducts,
      totalOrders,
      lowStockProducts,
      totalRevenue,
      recentOrders: recentOrders.map((order) => {
        const customer = order.user as unknown as { name?: string; email?: string } | null;
        return {
          id: order.id,
          customerName: customer?.name ?? "Unknown",
          customerEmail: customer?.email ?? "",
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        };
      }),
      topProducts: topProductsResult.map((entry) => ({
        name: entry.name,
        quantitySold: entry.quantitySold,
        revenue: entry.revenue,
      })),
      lowStockList: lowStockList.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: product.price,
        imageUrl: product.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
