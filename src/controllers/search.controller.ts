import { Request, Response } from "express";
import { Product } from "../models/Product";
import { generateEmbedding } from "../services/embedding.service";
import logger from "../utils/logger";

// ===== VECTOR SEARCH =====
export const vectorSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    const queryEmbedding = await generateEmbedding(q as string);

    const results = await Product.aggregate([
      {
        $vectorSearch: {
          index: "product_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: parseInt(limit as string),
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          images: 1,
          stock: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      searchType: "vector",
      count: results.length,
      data: results,
    });
  } catch (error) {
    logger.error(`Vector search error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Vector search failed",
      error: (error as Error).message,
    });
  }
};

// ===== HYBRID SEARCH (Text + Vector) =====
export const hybridSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    const queryEmbedding = await generateEmbedding(q as string);

    const [textResults, vectorResults] = await Promise.all([
      Product.aggregate([
        {
          $match: {
            isActive: true,
            $text: { $search: q as string },
          },
        },
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        {
          $sort: { score: -1 },
        },
        {
          $limit: parseInt(limit as string),
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            images: 1,
            score: 1,
            searchType: { $literal: "text" },
          },
        },
      ]),
      Product.aggregate([
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: parseInt(limit as string),
          },
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            images: 1,
            score: 1,
            searchType: { $literal: "vector" },
          },
        },
      ]),
    ]);

    const mergedResults = mergeAndRankResults(textResults, vectorResults);

    res.status(200).json({
      success: true,
      searchType: "hybrid",
      count: mergedResults.length,
      data: mergedResults,
    });
  } catch (error) {
    logger.error(`Hybrid search error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Hybrid search failed",
      error: (error as Error).message,
    });
  }
};

// ===== MERGE AND RANK RESULTS =====
const mergeAndRankResults = (textResults: any[], vectorResults: any[]) => {
  const map = new Map();

  textResults.forEach((item, index) => {
    const weight = 0.4 * (1 - index / (textResults.length || 1));
    const id = item._id.toString();
    map.set(id, {
      ...item,
      combinedScore: weight,
    });
  });

  vectorResults.forEach((item, index) => {
    const weight = 0.6 * (1 - index / (vectorResults.length || 1));
    const id = item._id.toString();
    if (map.has(id)) {
      map.get(id).combinedScore += weight;
    } else {
      map.set(id, {
        ...item,
        combinedScore: weight,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((item) => ({
      ...item,
      combinedScore: parseFloat((item.combinedScore * 100).toFixed(2)),
    }));
};

// ===== SIMILAR PRODUCTS =====
export const getSimilarProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (!product.embedding) {
      res.status(400).json({
        success: false,
        message: "Product embedding not available",
      });
      return;
    }

    const results = await Product.aggregate([
      {
        $vectorSearch: {
          index: "product_vector_index",
          path: "embedding",
          queryVector: product.embedding,
          numCandidates: 50,
          limit: parseInt(limit as string) + 1,
        },
      },
      {
        $match: {
          _id: { $ne: product._id },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          images: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
      },
      similarProducts: results,
    });
  } catch (error) {
    logger.error(`Similar products error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to find similar products",
      error: (error as Error).message,
    });
  }
};

// ===== RECOMMENDATIONS (Personalized) =====
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 5 } = req.query;
    // const userId = req.user?.id; // from auth middleware – can be used later

    const recommendations = await Product.find({ isActive: true })
      .sort({ price: -1, ratings: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    res.status(200).json({
      success: true,
      message: "Personalized recommendations",
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error: any) {
    logger.error(`Recommendations error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
      error: error.message,
    });
  }
};

// ===== ADVANCED SEARCH with Filters =====
export const advancedSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, minPrice, maxPrice, limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (q) {
      const queryEmbedding = await generateEmbedding(q as string);

      const vectorFilter: any = { isActive: true };
      if (category) vectorFilter.category = category;

      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: limitNum * 2,
            filter: vectorFilter,
          },
        },
        {
          $addFields: { score: { $meta: "vectorSearchScore" } },
        },
      ];

      const matchConditions: any[] = [];
      if (minPrice || maxPrice) {
        const priceObj: any = {};
        if (minPrice) priceObj.$gte = parseFloat(minPrice as string);
        if (maxPrice) priceObj.$lte = parseFloat(maxPrice as string);
        matchConditions.push({ price: priceObj });
      }

      if (matchConditions.length > 0) {
        pipeline.push({
          $match: {
            $and: matchConditions,
          },
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          images: 1,
          stock: 1,
          score: 1,
        },
      });

      const results = await Product.aggregate(pipeline);

      res.status(200).json({
        success: true,
        searchType: "vector_with_filters",
        count: results.length,
        data: results,
      });
      return;
    } else {
      const filter: any = { isActive: true };
      if (category) filter.category = category;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
      }

      const results = await Product.find(filter).limit(limitNum).lean();

      res.status(200).json({
        success: true,
        searchType: "filtered",
        count: results.length,
        data: results,
      });
      return;
    }
  } catch (error) {
    logger.error(`Advanced search error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Advanced search failed",
      error: (error as Error).message,
    });
  }
};
// ===== TRENDING PRODUCTS =====
export const getTrending = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    // For trending, we can sort by highest ratings, or by a custom field like views/sales.
    // If you have a "trendingScore" field, use that. Otherwise, fallback to ratings and price.
    const trending = await Product.find({ isActive: true })
      .sort({ ratings: -1, price: -1 }) // highest ratings first, then highest price
      .limit(parseInt(limit as string, 10))
      .lean();

    res.status(200).json({
      success: true,
      message: "Trending products",
      count: trending.length,
      data: trending,
    });
  } catch (error: any) {
    logger.error(`Trending error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get trending products",
      error: error.message,
    });
  }
};