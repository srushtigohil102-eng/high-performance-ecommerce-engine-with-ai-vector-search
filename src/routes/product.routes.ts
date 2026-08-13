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

const router = Router();

// ===== Public Routes =====
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/category/:category", getProductsByCategory);
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

// ===== Admin Only Routes =====
router.post("/", authenticate, requireAdmin, uploadMultiple, createProduct);
router.put("/:id", authenticate, requireAdmin, uploadMultiple, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

router.post("/categories", authenticate, requireAdmin, createCategory);
router.put("/categories/:id", authenticate, requireAdmin, updateCategory);
router.delete("/categories/:id", authenticate, requireAdmin, deleteCategory);

export default router;