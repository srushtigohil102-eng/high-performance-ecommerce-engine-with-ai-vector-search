import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController";
import { authMiddleware } from "../middleware/authMiddleware";
import { mongoIdParam } from "../middleware/validate";

const router = Router();

// All wishlist endpoints require authentication.
router.use(authMiddleware);

// GET /api/wishlist — list the user's saved products
router.get("/", getWishlist);

// POST /api/wishlist/:productId — save a product (idempotent)
router.post("/:productId", mongoIdParam("productId"), addToWishlist);

// DELETE /api/wishlist/:productId — unsave a product (idempotent)
router.delete("/:productId", mongoIdParam("productId"), removeFromWishlist);

export default router;
