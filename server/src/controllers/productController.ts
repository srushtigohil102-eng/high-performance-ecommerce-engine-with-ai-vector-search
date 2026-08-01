import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Product } from "../models/Product";
import { getRedisClient } from "../config/redis";

const CACHE_TTL = 300; // 5 minutes

const buildProductCacheKey = (prefix: string, query: Record<string, string | undefined>): string => {
  const sorted = Object.keys(query)
    .sort()
    .filter((k) => query[k] !== undefined)
    .map((k) => `${k}=${query[k]}`)
    .join("&");
  return `products:${prefix}:${sorted || "all"}`;
};

const invalidateProductCache = async (patterns: string[]): Promise<void> => {
  try {
    const redis = getRedisClient();
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch {
    // Redis might be down; don't crash the app
  }
};

// GET /api/products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
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

    await invalidateProductCache(["products:list:*", "search:*"]);

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
      invalidateProductCache(["products:list:*", "search:*", `products:item:${id}`]),
    ]);

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
      invalidateProductCache(["products:list:*", "search:*", `products:item:${id}`]),
    ]);

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
