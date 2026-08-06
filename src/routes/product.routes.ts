import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from "../controllers/product.controller";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";
import { uploadMultiple } from "../middleware/upload.middleware";
import { cacheMiddleware } from "../middleware/cache.middleware"; // ✅ Added

const router = Router();

// ===== Public Routes (Cached) =====
router.get("/", cacheMiddleware(300), getAllProducts);                        // 5 min
router.get("/:id", cacheMiddleware(600), getProductById);                   // 10 min
router.get("/category/:category", cacheMiddleware(300), getProductsByCategory);
router.get("/categories", cacheMiddleware(600), getAllCategories);
router.get("/categories/:id", cacheMiddleware(600), getCategoryById);

// ===== Admin Only Routes (No Caching) =====
router.post("/", authenticate, requireAdmin, uploadMultiple, createProduct);
router.put("/:id", authenticate, requireAdmin, uploadMultiple, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

router.post("/categories", authenticate, requireAdmin, createCategory);
router.put("/categories/:id", authenticate, requireAdmin, updateCategory);
router.delete("/categories/:id", authenticate, requireAdmin, deleteCategory);

export default router;