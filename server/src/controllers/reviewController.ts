import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { invalidateProductCache, PRODUCT_CACHE_PATTERNS } from "../utils/cache";

// Recompute a product's rolling rating from its reviews and invalidate caches
// so list/detail responses are never stale. Ran after every review write.
const syncProductRating = async (productId: string): Promise<void> => {
  const [agg] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = agg ? Math.round(agg.average * 10) / 10 : 0;
  const numReviews = agg?.count ?? 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
  await invalidateProductCache([`products:item:${productId}`, ...PRODUCT_CACHE_PATTERNS]);
};

// GET /api/products/:id/reviews — public, paginated, newest first
export const getProductReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const [reviews, total] = await Promise.all([
      Review.find({ product: product._id })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user", "name"),
      Review.countDocuments({ product: product._id }),
    ]);

    res.json({
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      averageRating: product.rating,
      ratingCount: product.numReviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/products/:id/reviews — create a review (one per user per product)
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, title, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    try {
      const review = await Review.create({
        user: req.user!._id,
        product: product._id,
        rating,
        title,
        comment,
      });
      await syncProductRating(product.id);
      const populated = await review.populate("user", "name");
      res.status(201).json(populated);
    } catch (error) {
      // E11000 — this user already reviewed the product.
      if ((error as { code?: number }).code === 11000) {
        res.status(400).json({ message: "You have already reviewed this product" });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/reviews/:id — edit own review (or any review as admin)
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (review.user.toString() !== req.user!._id && req.user!.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const updates: { rating?: number; title?: string; comment?: string } = {};
    if (req.body.rating !== undefined) updates.rating = req.body.rating;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.comment !== undefined) updates.comment = req.body.comment;

    review.set(updates);
    await review.save();

    await syncProductRating(review.product.toString());
    const populated = await review.populate("user", "name");
    res.json(populated);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/reviews/:id — delete own review (or any review as admin)
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (review.user.toString() !== req.user!._id && req.user!.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const productId = review.product.toString();
    await review.deleteOne();
    await syncProductRating(productId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
