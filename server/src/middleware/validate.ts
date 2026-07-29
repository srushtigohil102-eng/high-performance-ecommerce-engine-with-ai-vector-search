import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: (e as any).path || (e as any).param,
        message: e.msg,
      })),
    });
    return;
  }
  next();
};

export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  handleValidationErrors,
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const createProductValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 200 }).withMessage("Name must be at most 200 characters"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required"),
  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),
  body("category")
    .trim()
    .notEmpty().withMessage("Category is required"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be a string"),
  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  handleValidationErrors,
];

export const updateProductValidation = [
  param("id").notEmpty().withMessage("Product ID is required"),
  body("name")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Name must be at most 200 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  handleValidationErrors,
];

export const createOrderValidation = [
  body("items")
    .isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.product")
    .notEmpty().withMessage("Product ID is required for each item"),
  body("items.*.quantity")
    .isInt({ min: 1 }).withMessage("Quantity must be at least 1 for each item"),
  body("shippingAddress")
    .notEmpty().withMessage("Shipping address is required"),
  body("shippingAddress.street")
    .trim()
    .notEmpty().withMessage("Street is required in shipping address"),
  body("shippingAddress.city")
    .trim()
    .notEmpty().withMessage("City is required in shipping address"),
  body("shippingAddress.state")
    .trim()
    .notEmpty().withMessage("State is required in shipping address"),
  body("shippingAddress.zipCode")
    .trim()
    .notEmpty().withMessage("Zip code is required in shipping address"),
  body("shippingAddress.country")
    .trim()
    .notEmpty().withMessage("Country is required in shipping address"),
  body("discountCode")
    .optional()
    .isString().withMessage("Discount code must be a string"),
  handleValidationErrors,
];

export const updateOrderStatusValidation = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "shipped", "delivered"])
    .withMessage("Status must be one of: pending, confirmed, shipped, delivered"),
  handleValidationErrors,
];

export const validateDiscountValidation = [
  body("code")
    .trim()
    .notEmpty().withMessage("Discount code is required"),
  handleValidationErrors,
];
