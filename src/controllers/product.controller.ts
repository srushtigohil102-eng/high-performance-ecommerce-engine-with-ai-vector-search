import { Request, Response } from "express";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import cloudinary from "../config/cloudinary";
import logger from "../utils/logger";
import fs from "fs";
import { sendStockAlert } from "../services/socket.service";

// ===== CREATE PRODUCT =====
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      tags,
      stock,
      sku,
      weight,
      dimensions,
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findOne({ name: category });
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: "Category not found. Please create the category first.",
      });
      return;
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      res.status(400).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
      return;
    }

    // Upload images to Cloudinary
    let imageUrls: string[] = [];
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ecommerce/products",
          use_filename: true,
        });
        imageUrls.push(result.secure_url);
        // Remove local file after upload
        fs.unlinkSync(file.path);
      }
    }

    // Parse tags from string to array
    const tagsArray = tags ? (typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()) : tags) : [];

    // Create product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      category,
      tags: tagsArray,
      images: imageUrls,
      stock: parseInt(stock),
      sku: sku.toUpperCase(),
      weight: weight ? parseFloat(weight) : undefined,
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
    });

    // ✅ Send stock alert if stock is low
    if (product.stock < 10) {
      await sendStockAlert(product._id.toString());
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    logger.error(`Create product error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: (error as Error).message,
    });
  }
};

// ===== GET ALL PRODUCTS =====
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, category, minPrice, maxPrice, sort, search } = req.query;

    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: parseFloat(minPrice as string) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice as string) };

    if (search) {
      filter.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "name") sortOption = { name: 1 };
    if (sort === "rating") sortOption = { ratings: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get products error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: (error as Error).message,
    });
  }
};

// ===== GET PRODUCT BY ID =====
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error(`Get product error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: (error as Error).message,
    });
  }
};

// ===== UPDATE PRODUCT =====
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If images uploaded, process them
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      const newImages: string[] = [];
      
      // Get existing product to keep old images if needed
      const product = await Product.findById(id);
      if (product) {
        // Keep existing images (unless we want to replace)
        // For now, we'll append new images
        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "ecommerce/products",
          });
          newImages.push(result.secure_url);
          fs.unlinkSync(file.path);
        }
        updateData.images = [...product.images, ...newImages];
      }
    }

    // Parse tags
    if (updateData.tags && typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map((t: string) => t.trim());
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // ✅ Send stock alert if stock is low
    if (product.stock < 10) {
      await sendStockAlert(product._id.toString());
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    logger.error(`Update product error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: (error as Error).message,
    });
  }
};

// ===== DELETE PRODUCT =====
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete product error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: (error as Error).message,
    });
  }
};

// ===== GET PRODUCTS BY CATEGORY =====
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    const products = await Product.find({
      category,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    logger.error(`Get products by category error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: (error as Error).message,
    });
  }
};