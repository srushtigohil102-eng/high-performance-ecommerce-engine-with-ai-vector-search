import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import logger from "../utils/logger";

let io: SocketServer;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("join-admin", () => {
      socket.join("admin");
      console.log("Admin joined admin room");
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const sendOrderNotification = async (orderId: string, userId: string) => {
  try {
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("user", "firstName lastName email") as any;

    if (!order) return;

    io.to(`user:${userId}`).emit("order-update", {
      type: "order_placed",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.length,
        timestamp: new Date(),
      },
    });

    io.to("admin").emit("admin-order-update", {
      type: "new_order",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: `${order.user?.firstName} ${order.user?.lastName}`,
        totalAmount: order.totalAmount,
        timestamp: new Date(),
      },
    });

    logger.info(`Order notification sent for order ${orderId}`);
  } catch (error) {
    logger.error(`Send order notification error: ${error}`);
  }
};

export const sendStockAlert = async (productId: string) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    io.to("admin").emit("stock-alert", {
      type: "low_stock",
      data: {
        productId: product._id,
        productName: product.name,
        stock: product.stock,
        sku: product.sku,
        timestamp: new Date(),
      },
    });

    logger.info(`Stock alert sent for product ${productId}`);
  } catch (error) {
    logger.error(`Send stock alert error: ${error}`);
  }
};

export const sendOrderStatusUpdate = async (orderId: string, status: string) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    io.to(`user:${order.user.toString()}`).emit("order-status-update", {
      type: "order_status_changed",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: status,
        timestamp: new Date(),
      },
    });

    logger.info(`Order status update sent for order ${orderId}`);
  } catch (error) {
    logger.error(`Send order status update error: ${error}`);
  }
};

export default { initializeSocket, sendOrderNotification, sendStockAlert, sendOrderStatusUpdate };
