import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { WishlistItem } from "../models/WishlistItem";
import { Product } from "../models/Product";

// GET /api/wishlist — the authenticated user's wishlist, newest first.
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await WishlistItem.find({ user: req.user!._id })
      .populate("product")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/wishlist/:productId — add a product to the wishlist. Idempotent:
// adding an already-saved product is a no-op success, and the unique
// user+product index guards against a double-submit race producing a duplicate.
export const addToWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    try {
      const item = await WishlistItem.findOneAndUpdate(
        { user: req.user!._id, product: productId },
        { $setOnInsert: { user: req.user!._id, product: productId } },
        { upsert: true, new: true }
      );
      const populated = await item.populate("product");
      res.status(201).json(populated);
    } catch (error) {
      // E11000 — duplicate key from a concurrent add; treat as already saved.
      if ((error as { code?: number }).code === 11000) {
        const existing = await WishlistItem.findOne({
          user: req.user!._id,
          product: productId,
        }).populate("product");
        res.json(existing);
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/wishlist/:productId — remove a product. Idempotent: removing an
// entry that isn't there is still a success.
export const removeFromWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    await WishlistItem.deleteOne({ user: req.user!._id, product: productId });
    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
