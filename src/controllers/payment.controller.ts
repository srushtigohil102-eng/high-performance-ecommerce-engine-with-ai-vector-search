import { Request, Response } from "express";
import Stripe from "stripe";
import { Order } from "../models/Order";
import logger from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// ===== CREATE PAYMENT INTENT =====
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    // Check if order already paid
    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Order already paid",
      });
      return;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
      receipt_email: req.user?.email,
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
        currency: "usd",
      },
    });
  } catch (error) {
    logger.error(`Create payment intent error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: (error as Error).message,
    });
  }
};

// ===== CONFIRM PAYMENT =====
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const orderId = paymentIntent.metadata.orderId;

      // Update order status
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "processing";
        order.paymentId = paymentIntentId;
        await order.save();
      }

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          orderId,
          paymentStatus: "paid",
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}`,
      });
    }
  } catch (error) {
    logger.error(`Confirm payment error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: (error as Error).message,
    });
  }
};