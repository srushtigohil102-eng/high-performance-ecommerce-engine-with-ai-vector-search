import nodemailer from "nodemailer";
import logger from "../utils/logger";
import { orderConfirmationTemplate } from "../email/templates/order-confirmation";
import { welcomeTemplate } from "../email/templates/welcome";

const orderStatusTemplate = ({
  customerName,
  orderNumber,
  orderId,
  status,
  message,
  footerMessage,
}: {
  customerName: string;
  orderNumber: string;
  orderId: string;
  status: string;
  message: string;
  footerMessage: string;
}): string => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h1>Order Status Update</h1>
    <p>Hi ${customerName},</p>
    <p>${message}</p>
    <ul>
      <li><strong>Order Number:</strong> ${orderNumber}</li>
      <li><strong>Order ID:</strong> ${orderId}</li>
      <li><strong>Status:</strong> ${status}</li>
    </ul>
    <p>${footerMessage}</p>
  </div>
`;

// ===== EMAIL TRANSPORTER =====
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ===== SEND EMAIL =====
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@ecommerce-ai.com",
      to,
      subject,
      html,
    });
    logger.info(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`❌ Email send error: ${error}`);
    return false;
  }
};

// ===== ORDER CONFIRMATION EMAIL =====
export const sendOrderConfirmationEmail = async (order: any): Promise<boolean> => {
  const html = orderConfirmationTemplate({
    customerName: order.user.firstName + ' ' + order.user.lastName,
    customerEmail: order.user.email,
    orderNumber: order.orderNumber,
    orderId: order._id,
    orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod || 'Card',
    items: order.items,
    shippingAddress: order.shippingAddress,
  });

  return sendEmail(
    order.user.email,
    `Order Confirmation #${order.orderNumber}`,
    html
  );
};

// ===== WELCOME EMAIL =====
export const sendWelcomeEmail = async (user: any): Promise<boolean> => {
  const html = welcomeTemplate({
    name: user.firstName,
    email: user.email,
  });

  return sendEmail(
    user.email,
    'Welcome to E-Commerce AI Engine!',
    html
  );
};

// ===== ORDER STATUS UPDATE EMAIL =====
export const sendOrderStatusUpdateEmail = async (
  order: any,
  status: string,
  message?: string
): Promise<boolean> => {
  const statusMessages: Record<string, string> = {
    processing: 'Your order is being processed.',
    shipped: 'Your order has been shipped!',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
  };

  const html = orderStatusTemplate({
    customerName: order.user.firstName + ' ' + order.user.lastName,
    orderNumber: order.orderNumber,
    orderId: order._id,
    status: status,
    message: message || statusMessages[status] || `Your order is now ${status}.`,
    footerMessage: status === 'delivered' 
      ? 'We hope you enjoy your purchase! Please leave a review.' 
      : 'Thank you for shopping with us!',
  });

  return sendEmail(
    order.user.email,
    `Order ${status} - #${order.orderNumber}`,
    html
  );
};