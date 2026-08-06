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

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (order.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Order already paid",
      });
      return;
    }

    // ✅ FIX: Use automatic_payment_methods with allow_redirects: "never"
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // 👈 Prevents redirect-based payment methods
      },
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
        status: paymentIntent.status,
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

    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: "Payment Intent ID is required",
      });
      return;
    }

    // ✅ FIX: Confirm payment with a Stripe test payment method
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
    });

    if (confirmedIntent.status === "succeeded") {
      const orderId = confirmedIntent.metadata.orderId;
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = "paid";
        order.status = "processing";
        order.paymentId = confirmedIntent.id;
        await order.save();
      }

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          orderId,
          paymentStatus: "paid",
          paymentIntentId: confirmedIntent.id,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${confirmedIntent.status}`,
        status: confirmedIntent.status,
      });
    }
  } catch (error: any) {
    logger.error(`Confirm payment error: ${error.message}`);
    
    // ✅ Check if error is about return_url
    if (error.message.includes("return_url")) {
      res.status(400).json({
        success: false,
        message: "Please use the Stripe Dashboard to complete this payment.",
        instructions: "Go to https://dashboard.stripe.com/test/payments and add a payment method to complete the payment.",
        status: "requires_payment_method",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: `Payment confirmation failed: ${error.message}`,
      status: "requires_action",
    });
  }
};

// ===== GET PAYMENT STATUS =====
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: "Payment Intent ID is required",
      });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    logger.error(`Get payment status error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: (error as Error).message,
    });
  }
};