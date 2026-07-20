import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import logger from "../utils/logger";
import { sendOrderNotification, sendOrderStatusUpdate } from "../services/socket.service";
import { emailQueue } from "../config/queue";

// ===== CREATE ORDER FROM CART =====
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Cart is empty. Add items before placing order.",
      });
      return;
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product as any;
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product not found in cart`,
        });
        return;
      }

      // Check stock
      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
        return;
      }

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "pending",
      status: "pending",
      paymentStatus: "pending",
    });

    await emailQueue.add({
  type: "order_confirmation",
  data: {
    to: req.user?.email,
    order: order,
  },
});

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // Populate order details
    await order.populate("items.product");

    // ✅ SEND REAL-TIME NOTIFICATION
    await sendOrderNotification(order._id.toString(), userId);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    logger.error(`Create order error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: (error as Error).message,
    });
  }
};

// ===== GET USER ORDERS =====
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const filter: any = { user: userId };
    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.product", "name price images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get orders error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: (error as Error).message,
    });
  }
};

// ===== GET ORDER BY ID =====
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";

    const order = await Order.findById(id)
      .populate("items.product", "name price images")
      .populate("user", "firstName lastName email");

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Check authorization
    if (order.user._id.toString() !== userId && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error(`Get order error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: (error as Error).message,
    });
  }
};

// ===== UPDATE ORDER STATUS (Admin) =====
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Valid: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // If order is already cancelled or delivered, don't allow changes
    if (order.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
      return;
    }

    if (order.status === "delivered") {
      res.status(400).json({
        success: false,
        message: "Order is already delivered",
      });
      return;
    }

    order.status = status;
    await order.save();

    await order.populate("items.product");

    // ✅ SEND REAL-TIME STATUS UPDATE
    await sendOrderStatusUpdate(order._id.toString(), status);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    logger.error(`Update order status error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: (error as Error).message,
    });
  }
};

// ===== CANCEL ORDER =====
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Check authorization (only user who placed order can cancel)
    if (order.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own orders.",
      });
      return;
    }

    // Check if order can be cancelled
    if (order.status === "shipped" || order.status === "delivered") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel order after shipping",
      });
      return;
    }

    if (order.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
      return;
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    logger.error(`Cancel order error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: (error as Error).message,
    });
  }
};

// ===== ADMIN: GET ALL ORDERS =====
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (startDate) filter.createdAt = { $gte: new Date(startDate as string) };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate as string) };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "firstName lastName email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    // Calculate summary
    const summary = {
      totalOrders: total,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      processedOrders: orders.filter((o) => o.status === "processing").length,
      shippedOrders: orders.filter((o) => o.status === "shipped").length,
      deliveredOrders: orders.filter((o) => o.status === "delivered").length,
      cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    };

    res.status(200).json({
      success: true,
      summary,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get all orders error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: (error as Error).message,
    });
  }
};