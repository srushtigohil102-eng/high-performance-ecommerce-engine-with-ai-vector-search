import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Order, IOrderItem } from "../models/Order";
import { Product } from "../models/Product";
import { DiscountCode } from "../models/DiscountCode";
import { User } from "../models/User";
import { getRedisClient } from "../config/redis";

const invalidateProductCache = async (): Promise<void> => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys("products:list:*");
    if (keys.length > 0) await redis.del(keys);
  } catch {
    // Redis unavailable
  }
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
    });

    // Invalidate product caches (stock changed)
    await invalidateProductCache();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
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
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/orders — all orders (admin)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user", "name email")
        .populate("items.product", "name imageUrl"),
      Order.countDocuments(),
    ]);

    res.json({
      orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/orders/:id/status — update order status (admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "shipped", "delivered"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/discount/validate — validate discount code
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
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/stats — dashboard statistics (admin)
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalProducts, totalOrders, lowStockProducts, revenueResult] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    res.json({
      totalProducts,
      totalOrders,
      lowStockProducts,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
