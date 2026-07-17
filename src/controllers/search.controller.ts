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

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(q as string);

    // Perform vector search
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

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(q as string);

    // Run both searches in parallel
    const [textResults, vectorResults] = await Promise.all([
      // Text search
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

      // Vector search
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

    // Merge and rank results
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

  // Weight text results
  textResults.forEach((item, index) => {
    const weight = 0.4 * (1 - index / (textResults.length || 1));
    const id = item._id.toString();
    map.set(id, {
      ...item,
      combinedScore: weight,
    });
  });

  // Weight vector results
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

  // Sort by combined score
  return Array.from(map.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((item) => ({
      ...item,
      combinedScore: parseFloat((item.combinedScore * 100).toFixed(2)),
    }));
};

// ===== SIMILAR PRODUCTS (Recommendations) =====
export const getSimilarProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, limit = 5 } = req.params;

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