import { Request, Response } from "express";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import logger from "../utils/logger";

// ===== CREATE CATEGORY =====
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, image, parent } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
      return;
    }

    const category = await Category.create({
      name,
      description,
      image,
      parent,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    logger.error(`Create category error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: (error as Error).message,
    });
  }
};

// ===== GET ALL CATEGORIES =====
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("parent", "name")
      .sort({ name: 1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({
          category: category.name,
          isActive: true,
        });
        return {
          ...category.toObject(),
          productCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    logger.error(`Get categories error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: (error as Error).message,
    });
  }
};

// ===== GET CATEGORY BY ID =====
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate("parent", "name");
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error(`Get category error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: (error as Error).message,
    });
  }
};

// ===== UPDATE CATEGORY =====
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    logger.error(`Update category error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: (error as Error).message,
    });
  }
};

// ===== DELETE CATEGORY =====
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if products exist in this category
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const productCount = await Product.countDocuments({
      category: category.name,
      isActive: true,
    });

    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount} products are in this category.`,
      });
      return;
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete category error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: (error as Error).message,
    });
  }
};