import { Request, Response } from "express";
import Stripe from "stripe";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import logger from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// ===== STRIPE WEBHOOK =====
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err}`);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "paid";
          order.status = "processing";
          order.paymentId = paymentIntent.id;
          await order.save();
          logger.info(`Payment successful for order: ${orderId}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "failed";
          await order.save();

          // Restore stock
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock += item.quantity;
              await product.save();
            }
          }

          logger.warn(`Payment failed for order: ${orderId}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata.orderId;

        const order = await Order.findById(orderId);
        if (order) {
          order.status = "cancelled";
          // paymentStatus union type doesn't include 'refunded' in the Order model
          // cast to any to allow storing refunded state from the webhook
          (order as any).paymentStatus = "refunded";
          await order.save();
          logger.info(`Order refunded: ${orderId}`);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook error: ${error}`);
    res.status(500).json({ error: (error as Error).message });
  }
};