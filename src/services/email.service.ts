import nodemailer from "nodemailer";
import handlebars from "handlebars";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";

// ===== REGISTER HANDLEBARS HELPERS =====
handlebars.registerHelper("multiply", (a: number, b: number) => {
  return (a * b).toFixed(2);
});

handlebars.registerHelper("json", (context: any) => {
  return JSON.stringify(context);
});

// ===== LOAD TEMPLATE =====
const loadTemplate = (templateName: string) => {
  const templatePath = path.join(__dirname, "../email/templates", `${templateName}.hbs`);
  const templateContent = fs.readFileSync(templatePath, "utf8");
  return handlebars.compile(templateContent);
};

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
  const template = loadTemplate("order-confirmation");
  const html = template({
    customerName: order.user.firstName + " " + order.user.lastName,
    orderNumber: order.orderNumber,
    orderId: order._id,
    orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    totalAmount: order.totalAmount.toFixed(2),
    status: order.status,
    items: order.items,
    shippingAddress: order.shippingAddress,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    year: new Date().getFullYear(),
    email: order.user.email,
  });

  return sendEmail(
    order.user.email,
    `Order Confirmation #${order.orderNumber}`,
    html
  );
};

// ===== WELCOME EMAIL =====
export const sendWelcomeEmail = async (user: any): Promise<boolean> => {
  const template = loadTemplate("welcome");
  const html = template({
    name: user.firstName,
    email: user.email,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    year: new Date().getFullYear(),
  });

  return sendEmail(
    user.email,
    "Welcome to E-Commerce AI Engine!",
    html
  );
};

// ===== ORDER STATUS UPDATE EMAIL =====
export const sendOrderStatusUpdateEmail = async (
  order: any,
  status: string
): Promise<boolean> => {
  const statusIcons: Record<string, string> = {
    processing: "⏳",
    shipped: "📦",
    delivered: "✅",
    cancelled: "❌",
  };

  const statusColors: Record<string, string> = {
    processing: "#ff9800",
    shipped: "#2196f3",
    delivered: "#4caf50",
    cancelled: "#f44336",
  };

  const statusMessages: Record<string, string> = {
    processing: "Your order is being processed.",
    shipped: "Your order has been shipped!",
    delivered: "Your order has been delivered.",
    cancelled: "Your order has been cancelled.",
  };

  const template = loadTemplate("order-status");
  const html = template({
    customerName: order.user.firstName + " " + order.user.lastName,
    orderNumber: order.orderNumber,
    orderId: order._id,
    status: status,
    statusIcon: statusIcons[status] || "📋",
    statusColor: statusColors[status] || "#1a237e",
    statusMessage: statusMessages[status] || `Your order is now ${status}.`,
    footerMessage: status === "delivered" 
      ? "We hope you enjoy your purchase! Please leave a review." 
      : "Thank you for shopping with us!",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    year: new Date().getFullYear(),
    email: order.user.email,
  });

  return sendEmail(
    order.user.email,
    `Order ${status} - #${order.orderNumber}`,
    html
  );
};