import ExcelJS from 'exceljs';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import logger from '../utils/logger';

// ===== GENERATE SALES REPORT =====
export const generateSalesReport = async (startDate?: Date, endDate?: Date): Promise<Buffer> => {
  try {
    const filter: any = {};
    if (startDate) filter.createdAt = { $gte: startDate };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: endDate };

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name sku category');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Commerce AI Engine';
    workbook.created = new Date();

    // ===== SUMMARY SHEET =====
    const summarySheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: 'FF1A237E' } },
    });

    // Title
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = 'SALES REPORT';
    summarySheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 40;

    // Summary Stats
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    summarySheet.addRow([]);
    summarySheet.addRow(['Total Orders', totalOrders]);
    summarySheet.addRow(['Total Revenue', `$${totalRevenue.toFixed(2)}`]);
    summarySheet.addRow(['Average Order Value', `$${avgOrderValue.toFixed(2)}`]);

    // Style summary
    summarySheet.getColumn(1).width = 20;
    summarySheet.getColumn(2).width = 20;
    summarySheet.getRow(3).font = { bold: true };
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(5).font = { bold: true };

    // ===== ORDERS SHEET =====
    const ordersSheet = workbook.addWorksheet('Orders', {
      properties: { tabColor: { argb: 'FF4CAF50' } },
    });

    // Headers
    const orderHeaders = ['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Payment'];
    const orderHeaderRow = ordersSheet.addRow(orderHeaders);
    orderHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    orderHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    orderHeaderRow.height = 25;

    ordersSheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    // Data rows
    for (const order of orders) {
      const customer = order.user as any;
      const items = order.items.map((item: any) => {
        const product = item.product as any;
        return `${product.name} x${item.quantity}`;
      }).join(', ');

      ordersSheet.addRow([
        order.orderNumber,
        customer ? `${customer.firstName} ${customer.lastName}` : 'N/A',
        order.createdAt.toLocaleDateString(),
        items.substring(0, 50) + (items.length > 50 ? '...' : ''),
        `$${order.totalAmount.toFixed(2)}`,
        order.status.toUpperCase(),
        order.paymentStatus.toUpperCase(),
      ]);
    }

    // ===== PRODUCTS SHEET =====
    const productsSheet = workbook.addWorksheet('Products', {
      properties: { tabColor: { argb: 'FFFF9800' } },
    });

    const productHeaders = ['SKU', 'Product Name', 'Category', 'Price', 'Stock', 'Status'];
    const productHeaderRow = productsSheet.addRow(productHeaders);
    productHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    productHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    productHeaderRow.height = 25;

    productsSheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    const products = await Product.find({ isActive: true });
    for (const product of products) {
      productsSheet.addRow([
        product.sku,
        product.name,
        product.category,
        `$${product.price.toFixed(2)}`,
        product.stock,
        product.stock > 0 ? 'In Stock' : 'Out of Stock',
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    logger.error(`Generate sales report error: ${error}`);
    throw error;
  }
};

// ===== GENERATE INVENTORY REPORT =====
export const generateInventoryReport = async (): Promise<Buffer> => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ stock: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Commerce AI Engine';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Inventory Report', {
      properties: { tabColor: { argb: 'FF2196F3' } },
    });

    // Title
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'INVENTORY REPORT';
    sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Summary
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock < 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    sheet.addRow([]);
    sheet.addRow(['Total Products', totalProducts]);
    sheet.addRow(['Low Stock (<10)', lowStock]);
    sheet.addRow(['Out of Stock', outOfStock]);

    sheet.getRow(3).font = { bold: true };
    sheet.getRow(4).font = { bold: true };
    sheet.getRow(5).font = { bold: true };

    sheet.addRow([]);

    // Headers
    const headers = ['SKU', 'Product Name', 'Category', 'Price', 'Stock', 'Status'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    headerRow.height = 25;

    sheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    // Data rows with color coding
    for (const product of products) {
      const row = sheet.addRow([
        product.sku,
        product.name,
        product.category,
        `$${product.price.toFixed(2)}`,
        product.stock,
        product.stock > 0 ? 'In Stock' : 'Out of Stock',
      ]);

      // Color code based on stock level
      if (product.stock === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
        });
      } else if (product.stock < 10) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    logger.error(`Generate inventory report error: ${error}`);
    throw error;
  }
};

// ===== GENERATE USER ANALYTICS REPORT =====
export const generateUserAnalyticsReport = async (): Promise<Buffer> => {
  try {
    const users = await User.find();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Commerce AI Engine';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('User Analytics', {
      properties: { tabColor: { argb: 'FF9C27B0' } },
    });

    // Title
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'USER ANALYTICS REPORT';
    sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Summary
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;

    sheet.addRow([]);
    sheet.addRow(['Total Users', totalUsers]);
    sheet.addRow(['Active Users', activeUsers]);
    sheet.addRow(['Inactive Users', totalUsers - activeUsers]);

    sheet.getRow(3).font = { bold: true };
    sheet.getRow(4).font = { bold: true };
    sheet.getRow(5).font = { bold: true };

    sheet.addRow([]);

    // Headers
    const headers = ['#', 'Name', 'Email', 'Role', 'Status', 'Joined'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    headerRow.height = 25;

    sheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    // Data rows
    for (const user of users) {
      sheet.addRow([
        users.indexOf(user) + 1,
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.createdAt.toLocaleDateString(),
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    logger.error(`Generate user analytics report error: ${error}`);
    throw error;
  }
};