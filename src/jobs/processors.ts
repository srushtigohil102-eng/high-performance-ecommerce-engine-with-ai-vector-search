import { emailQueue, embeddingQueue, reportQueue, notificationQueue } from "../config/queue";
import { sendOrderConfirmationEmail, sendWelcomeEmail } from "../services/email.service";
import { generateProductEmbedding } from "../services/embedding.service";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import logger from "../utils/logger";

// ===== EMAIL PROCESSOR =====
emailQueue.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case "order_confirmation":
      await sendOrderConfirmationEmail(data.to, data.order);
      break;
    case "welcome":
      await sendWelcomeEmail(data.to, data.name);
      break;
    default:
      logger.warn(`Unknown email type: ${type}`);
  }
});

// ===== EMBEDDING PROCESSOR =====
embeddingQueue.process(async (job) => {
  const { productId } = job.data;

  try {
    await generateProductEmbedding(productId);
    logger.info(`Embedding generated for product ${productId}`);
  } catch (error) {
    logger.error(`Embedding generation failed for ${productId}: ${error}`);
    throw error;
  }
});

// ===== REPORT PROCESSOR =====
reportQueue.process(async (job) => {
  const { type, filters } = job.data;

  switch (type) {
    case "sales_report":
      // Generate sales report
      const orders = await Order.find(filters).populate("items.product");
      return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders,
      };
    case "inventory_report":
      // Generate inventory report
      const products = await Product.find(filters);
      return {
        totalProducts: products.length,
        lowStockProducts: products.filter((p) => p.stock < 10),
        outOfStockProducts: products.filter((p) => p.stock === 0),
      };
    default:
      logger.warn(`Unknown report type: ${type}`);
      return null;
  }
});

// ===== NOTIFICATION PROCESSOR =====
notificationQueue.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case "order_placed":
      // Send notifications
      await sendOrderConfirmationEmail(data.user.email, data.order);
      break;
    default:
      logger.warn(`Unknown notification type: ${type}`);
  }
});