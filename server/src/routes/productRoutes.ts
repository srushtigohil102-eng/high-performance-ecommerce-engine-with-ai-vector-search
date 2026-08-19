import { Router } from "express";
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { getProductReviews, createReview } from "../controllers/reviewController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createProductValidation, updateProductValidation, idParamValidation, createReviewValidation } from "../middleware/validate";

const router = Router();

// GET /api/products — public, with pagination + filtering + Redis cache
router.get("/", getProducts);

// GET /api/products/categories — public, cached category names with counts.
// Must be registered before /:id so "categories" isn't treated as an id.
router.get("/categories", getCategories);

// GET /api/products/:id — public, cached
router.get("/:id", idParamValidation, getProductById);

// GET /api/products/:id/reviews — public, paginated
router.get("/:id/reviews", idParamValidation, getProductReviews);

// POST /api/products/:id/reviews — authenticated, one review per user per product
router.post("/:id/reviews", authMiddleware, createReviewValidation, createReview);

// POST /api/products — admin only
router.post("/", authMiddleware, adminMiddleware, createProductValidation, createProduct);

// PUT /api/products/:id — admin only
router.put("/:id", authMiddleware, adminMiddleware, updateProductValidation, updateProduct);

// DELETE /api/products/:id — admin only
router.delete("/:id", authMiddleware, adminMiddleware, idParamValidation, deleteProduct);

export default router;
