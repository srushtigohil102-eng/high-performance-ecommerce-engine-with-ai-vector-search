import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Product } from "../models/Product";
import { WishlistItem } from "../models/WishlistItem";
import { getRedisClient } from "../config/redis";
import { invalidateProductCache, PRODUCT_CACHE_PATTERNS } from "../utils/cache";
import { logAudit } from "../utils/audit";

const CACHE_TTL = 300; // 5 minutes

const buildProductCacheKey = (prefix: string, query: Record<string, string | undefined>): string => {
  const sorted = Object.keys(query)
    .sort()
    .filter((k) => query[k] !== undefined)
    .map((k) => `${k}=${query[k]}`)
    .join("&");
  return `products:${prefix}:${sorted || "all"}`;
};

// GET /api/products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    // Only strings may become filter values. Non-string query params (e.g.
    // ?category[$ne]=x, which the NoSQL sanitizer reduces to an empty object)
    // are treated as absent rather than passed into Mongo as a query.
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const skip = (page - 1) * limit;

    const cacheKey = buildProductCacheKey("list", { page: String(page), limit: String(limit), category, search });

    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable, fall through to DB
    }

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    const result = {
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    try {
      const redis = getRedisClient();
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable
    }

    res.json(result);
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/products/categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = "products:categories";

    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable, fall through to DB
    }

    const agg = await Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);

    const result = {
      categories: agg.map((c) => ({ name: c._id, count: c.count })),
    };

    try {
      const redis = getRedisClient();
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable
    }

    res.json(result);
  } catch (error) {
    console.error("Error listing categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/products/:id
export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `products:item:${id}`;

    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    try {
      const redis = getRedisClient();
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(product));
    } catch {
      // Redis unavailable
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/products (admin only)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;

    if (!name || !description || price === undefined || !category) {
      res.status(400).json({ message: "Please provide name, description, price, and category" });
      return;
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || "",
      stock: stock || 0,
    });

    await invalidateProductCache([...PRODUCT_CACHE_PATTERNS]);

    void logAudit({
      action: "product.created",
      resource: "product",
      resourceId: product.id,
      details: { name: product.name, category: product.category },
      actor: req.user?._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/products/:id (admin only)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await Promise.all([
      invalidateProductCache([`products:item:${id}`, ...PRODUCT_CACHE_PATTERNS]),
    ]);

    void logAudit({
      action: "product.updated",
      resource: "product",
      resourceId: product.id,
      details: { name: product.name, updates: Object.keys(updates) },
      actor: req.user?._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/products/:id (admin only)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await Promise.all([
      invalidateProductCache([`products:item:${id}`, ...PRODUCT_CACHE_PATTERNS]),
      WishlistItem.deleteMany({ product: id }),
    ]);

    void logAudit({
      action: "product.deleted",
      resource: "product",
      resourceId: product.id,
      details: { name: product.name },
      actor: req.user?._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
