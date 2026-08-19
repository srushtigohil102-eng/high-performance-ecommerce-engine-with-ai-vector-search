import { body, param, query, validationResult } from "express-validator";
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

export const idParamValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Generic MongoId check for a named route param (e.g. productId).
export const mongoIdParam = (name: string) => [
  param(name).isMongoId().withMessage(`Invalid ${name} format`),
  handleValidationErrors,
];

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

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  handleValidationErrors,
];

export const resetPasswordValidation = [
  body("token")
    .trim()
    .notEmpty().withMessage("Reset token is required"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  handleValidationErrors,
];

export const verifyEmailValidation = [
  query("token")
    .exists().withMessage("Verification token is required"),
  handleValidationErrors,
];

export const resendVerificationValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
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
  param("id").isMongoId().withMessage("Invalid ID format"),
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
    .notEmpty().withMessage("Product ID is required for each item")
    .isMongoId().withMessage("Invalid product ID format"),
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
  param("id").isMongoId().withMessage("Invalid ID format"),
  body("status")
    .trim()
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "shipped", "delivered", "cancelled"])
    .withMessage("Status must be one of: pending, confirmed, shipped, delivered, cancelled"),
  handleValidationErrors,
];

export const updateTrackingValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  body("trackingNumber")
    .optional()
    .isString().withMessage("Tracking number must be a string")
    .isLength({ max: 100 }).withMessage("Tracking number must be at most 100 characters"),
  handleValidationErrors,
];

export const validateDiscountValidation = [
  body("code")
    .isString().withMessage("Discount code must be a string")
    .trim()
    .notEmpty().withMessage("Discount code is required"),
  handleValidationErrors,
];

export const createReviewValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment")
    .trim()
    .notEmpty().withMessage("Comment is required")
    .isLength({ max: 2000 }).withMessage("Comment must be at most 2000 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Title must be at most 200 characters"),
  handleValidationErrors,
];

export const updateReviewValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Comment must be at most 2000 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Title must be at most 200 characters"),
  handleValidationErrors,
];

export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Name cannot be empty")
    .isLength({ max: 100 }).withMessage("Name must be at most 100 characters"),
  body("email")
    .optional()
    .trim()
    .notEmpty().withMessage("Email cannot be empty")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  handleValidationErrors,
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  handleValidationErrors,
];

export const addressValidation = [
  body("label")
    .trim()
    .notEmpty().withMessage("Label is required")
    .isLength({ max: 50 }).withMessage("Label must be at most 50 characters"),
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ max: 100 }).withMessage("Full name must be at most 100 characters"),
  body("addressLine1")
    .trim()
    .notEmpty().withMessage("Address line 1 is required")
    .isLength({ max: 200 }).withMessage("Address line 1 must be at most 200 characters"),
  body("addressLine2")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address line 2 must be at most 200 characters"),
  body("city")
    .trim()
    .notEmpty().withMessage("City is required")
    .isLength({ max: 100 }).withMessage("City must be at most 100 characters"),
  body("state")
    .trim()
    .notEmpty().withMessage("State is required")
    .isLength({ max: 100 }).withMessage("State must be at most 100 characters"),
  body("postalCode")
    .trim()
    .notEmpty().withMessage("Postal code is required")
    .isLength({ max: 20 }).withMessage("Postal code must be at most 20 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage("Phone must be at most 20 characters"),
  body("isDefault")
    .optional()
    .isBoolean().withMessage("isDefault must be a boolean"),
  handleValidationErrors,
];

export const addressIdParamValidation = [
  param("addressId").isMongoId().withMessage("Invalid address ID format"),
  handleValidationErrors,
];
