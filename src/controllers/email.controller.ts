import { Request, Response } from "express";
import { Order } from "../models/Order";
import { User } from "../models/User";
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
} from "../services/email.service";
import logger from "../utils/logger";

export const sendWelcome = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    await sendWelcomeEmail({ email, firstName: name || "User" });
    res.status(200).json({ success: true, message: "Welcome email sent" });
  } catch (error: any) {
    logger.error(`Send welcome email error: ${error}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOrderConfirmation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ success: false, message: "Order ID is required" });
      return;
    }
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    await sendOrderConfirmationEmail(order);
    res.status(200).json({ success: true, message: "Order confirmation email sent" });
  } catch (error: any) {
    logger.error(`Send order confirmation error: ${error}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const resetToken = "dummy-token-for-testing";
    await sendPasswordResetEmail(email, resetToken);
    res.status(200).json({ success: true, message: "Password reset email sent" });
  } catch (error: any) {
    logger.error(`Send password reset error: ${error}`);
    res.status(500).json({ success: false, message: error.message });
  }
};