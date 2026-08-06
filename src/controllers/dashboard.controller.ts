import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import logger from "../utils/logger";

// ===== GET DASHBOARD STATS =====
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const orderStatusDistribution = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        recentOrders,
        orderStatusDistribution: orderStatusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    logger.error(`Get dashboard stats error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: (error as Error).message,
    });
  }
};

// ===== GET SALES ANALYTICS =====
export const getSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = "monthly" } = req.query;

    let groupBy: any = {};

    switch (period) {
      case "daily":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "weekly":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "monthly":
      default:
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
    }

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalItems: { $sum: { $size: "$items" } },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      success: true,
      data: salesData,
    });
  } catch (error) {
    logger.error(`Get sales analytics error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get sales analytics",
      error: (error as Error).message,
    });
  }
};

// ===== GET TOP PRODUCTS =====
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          name: "$product.name",
          price: "$product.price",
          category: "$product.category",
          images: "$product.images",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit as string) },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    logger.error(`Get top products error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get top products",
      error: (error as Error).message,
    });
  }
};

// ===== GET USER GROWTH =====
export const getUserGrowth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = "monthly" } = req.query;

    let groupBy: any = {};
    switch (period) {
      case "daily":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "weekly":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "monthly":
      default:
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
    }

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: groupBy,
          newUsers: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      success: true,
      data: userGrowth,
    });
  } catch (error) {
    logger.error(`Get user growth error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get user growth",
      error: (error as Error).message,
    });
  }
};

// ===== GET ORDER ANALYTICS =====
export const getOrderAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orderAnalytics = await Order.aggregate([
      {
        $facet: {
          statusDistribution: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          paymentStatusDistribution: [
            { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
          ],
          averageOrderValue: [
            { $group: { _id: null, avg: { $avg: "$totalAmount" } } },
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusDistribution: orderAnalytics[0].statusDistribution,
        paymentStatusDistribution: orderAnalytics[0].paymentStatusDistribution,
        averageOrderValue: orderAnalytics[0].averageOrderValue[0]?.avg || 0,
        totalRevenue: orderAnalytics[0].totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    logger.error(`Get order analytics error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get order analytics",
      error: (error as Error).message,
    });
  }
};

// ===== GET CATEGORY ANALYTICS =====
export const getCategoryAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categoryData = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    logger.error(`Get category analytics error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get category analytics",
      error: (error as Error).message,
    });
  }
};

// ===== GET REVENUE ANALYTICS (Test 56) =====
export const getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = "week" } = req.query;
    let groupFormat: any;
    let dateRange: Date;

    const now = new Date();
    switch (period) {
      case "week":
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupFormat = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
        break;
      case "month":
        dateRange = new Date(now.setMonth(now.getMonth() - 1));
        groupFormat = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
        break;
      default:
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupFormat = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
    }

    const revenue = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange }, status: { $ne: "cancelled" } } },
      { $group: { _id: groupFormat, total: { $sum: "$totalAmount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const labels = revenue.map(item => {
      const { year, month, day } = item._id;
      return `${day}/${month}/${year}`;
    });
    const values = revenue.map(item => item.total);

    res.status(200).json({
      success: true,
      data: {
        period,
        labels,
        values,
        total: values.reduce((a, b) => a + b, 0),
      },
    });
  } catch (error: any) {
    logger.error(`Revenue analytics error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get revenue analytics",
      error: error.message,
    });
  }
};

// ===== GET RECENT ORDERS (Test 57) =====
export const getRecentOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .populate("user", "firstName lastName email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    logger.error(`Recent orders error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get recent orders",
      error: error.message,
    });
  }
};