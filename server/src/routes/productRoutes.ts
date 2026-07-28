import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

// GET /api/products — public, with pagination + filtering + Redis cache
router.get("/", getProducts);

// GET /api/products/:id — public, cached
router.get("/:id", getProductById);

// POST /api/products — admin only
router.post("/", authMiddleware, adminMiddleware, createProduct);

// PUT /api/products/:id — admin only
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);

// DELETE /api/products/:id — admin only
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;
