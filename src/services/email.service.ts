// @ts-ignore: nodemail not be installed in some environments
import nodemailer from "nodemailer";
import logger from "../utils/logger";

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
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@ecommerce-ai.com",
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Email send error: ${error}`);
    throw error;
  }
};

// ===== ORDER CONFIRMATION EMAIL =====
export const sendOrderConfirmationEmail = async (to: string, order: any): Promise<void> => {
  const html = `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>
    <p>Order #${order.orderNumber}</p>
    <p>Total: $${order.totalAmount}</p>
    <p>Status: ${order.status}</p>
    <p>We'll notify you when your order ships.</p>
  `;
  await sendEmail(to, `Order Confirmation #${order.orderNumber}`, html);
};

// ===== WELCOME EMAIL =====
export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const html = `
    <h1>Welcome to E-Commerce AI Engine!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for joining us. Start exploring our products today!</p>
    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}">Shop Now</a>
  `;
  await sendEmail(to, "Welcome to E-Commerce AI Engine", html);
};