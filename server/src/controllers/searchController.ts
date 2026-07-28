/**
 * Product search controller — two-layer approach:
 *
 * LAYER 1 (always available): MongoDB full-text search using $text + $meta.textScore.
 *   - Works on any MongoDB instance with zero external setup.
 *   - Uses the weighted text index on name (10x), description (5x), category (3x).
 *   - Results sorted by relevance score.
 *
 * LAYER 2 (requires Atlas Vector Search index + embeddings): $vectorSearch aggregation.
 *   - Uses cosine similarity on the Product.embedding field.
 *   - Only activates if products actually have embeddings populated AND the Atlas
 *     vector search index exists. If the index is missing, MongoDB will throw an
 *     error which we catch and fall back to text search.
 *   - To set up: run `npm run generate-embeddings` after adding OPENAI_API_KEY to .env,
 *     then create a vector search index on the 'embedding' field in Atlas UI:
 *     Atlas Dashboard > Database > Search Indexes > Create Index >
 *     Collection: products, Field: embedding, Dimensions: 1536, Similarity: cosine.
 *
 * This is a pragmatic split: text search is production-ready today, vector search
 * is scaffolded so switching over is a one-line config change once Atlas is ready.
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Product } from "../models/Product";
import { getRedisClient } from "../config/redis";

const CACHE_TTL = 300; // 5 min — same as product list cache

// Shared response shape matching GET /api/products so the frontend needs no changes.
interface SearchResponse {
  products: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  searchMethod: "text" | "vector";
}

// ─── helpers ────────────────────────────────────────────────────────────────

const buildSearchCacheKey = (q: string, page: number, limit: number): string =>
  `search:q=${q}:p=${page}:l=${limit}`;

const tryGetCache = async (key: string): Promise<string | null> => {
  try {
    return await getRedisClient().get(key);
  } catch {
    return null;
  }
};

const trySetCache = async (key: string, value: string): Promise<void> => {
  try {
    await getRedisClient().setEx(key, CACHE_TTL, value);
  } catch {
    // Redis down — not critical
  }
};

// Quick check: do ANY products have embeddings? We cache this for 10 min since
// embeddings don't change often. This is a shortcut — with more time you'd track
// a flag in a settings collection or check the vector search index existence
// via Atlas admin API.
let embeddingsExistCache: boolean | null = null;
let embeddingsCheckTs = 0;
const EMBEDDINGS_CHECK_TTL = 600_000; // 10 min

async function embeddingsExist(): Promise<boolean> {
  const now = Date.now();
  if (embeddingsExistCache !== null && now - embeddingsCheckTs < EMBEDDINGS_CHECK_TTL) {
    return embeddingsExistCache;
  }

  try {
    const count = await Product.countDocuments({
      embedding: { $exists: true, $ne: [], $type: "array" },
    }).limit(1);

    embeddingsExistCache = count > 0;
  } catch {
    embeddingsExistCache = false;
  }
  embeddingsCheckTs = now;
  return embeddingsExistCache;
}

// ─── LAYER 2: Vector search pipeline ────────────────────────────────────────
// Builds a MongoDB aggregation pipeline using $vectorSearch (Atlas-only).
// Returns null if the aggregation fails (e.g. no vector index) so the caller
// can fall through to text search.
async function vectorSearch(
  query: string,
  page: number,
  limit: number
): Promise<SearchResponse | null> {
  try {
    // Generate an embedding for the query on-the-fly.
    // With more time, we'd cache query embeddings in Redis too.
    const queryEmbedding = await generateQueryEmbedding(query);
    if (!queryEmbedding) return null;

    // $vectorSearch is an Atlas-only stage not in Mongoose's PipelineStage type,
    // so we use Record<string, unknown>[] for the pipeline.
    const pipeline: Record<string, unknown>[] = [
      {
        $vectorSearch: {
          index: "vector_index", // name of the Atlas Vector Search index
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10, // overfetch for better recall
          limit: limit * 5, // fetch more than needed for pagination
          similarity: "cosine",
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $project: {
          embedding: 0, // don't send vectors to the client
        },
      },
    ];

    // We need a total count for pagination. With more time, you'd use
    // $facet to run the count + paginated query in one round trip.
    // For now we do two queries — acceptable at MVP scale.
    const countPipeline: Record<string, unknown>[] = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: 1000, // hard cap for count — fine for <10k products
          similarity: "cosine",
        },
      },
      { $count: "total" },
    ];

    const [products, countResult] = await Promise.all([
      Product.aggregate([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ] as any[]),
      Product.aggregate(countPipeline as any[]),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      searchMethod: "vector",
    };
  } catch (err) {
    // $vectorSearch will fail if the Atlas vector index doesn't exist yet.
    // This is expected during setup — we just fall through to text search.
    console.warn("Vector search unavailable, falling back to text search:", (err as Error).message);
    return null;
  }
}

// ─── Query embedding via OpenAI ─────────────────────────────────────────────
// Returns null if OPENAI_API_KEY is not set or the call fails.
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set — cannot generate query embedding for vector search");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI embedding API error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  } catch (err) {
    console.error("Failed to generate query embedding:", (err as Error).message);
    return null;
  }
}

// ─── LAYER 1: Text search (always works) ────────────────────────────────────
async function textSearch(
  query: string,
  page: number,
  limit: number
): Promise<SearchResponse> {
  const skip = (page - 1) * limit;

  // $text search returns results sorted by relevance via $meta: "textScore".
  // We use a thin $match + $addFields + $sort pipeline so we get both
  // the score and proper pagination in one query.
  const pipeline: Record<string, unknown>[] = [
    { $match: { $text: { $search: query } } },
    {
      $addFields: {
        score: { $meta: "textScore" },
      },
    },
    { $sort: { score: -1 } },
    {
      $project: {
        score: 0, // clean up the meta field from the response
      },
    },
  ];

  // Run count + paginated fetch in parallel
  const [countResult, products] = await Promise.all([
    Product.aggregate([...pipeline, { $count: "total" }] as any[]),
    Product.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ] as any[]),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    products,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    searchMethod: "text",
  };
}

// ─── Main handler: GET /api/search ──────────────────────────────────────────
export const searchProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const q = (req.query.q as string || "").trim();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));

    if (!q) {
      res.status(400).json({ message: "Search query 'q' is required" });
      return;
    }

    // Check Redis cache first
    const cacheKey = buildSearchCacheKey(q, page, limit);
    const cached = await tryGetCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    let result: SearchResponse;

    // Try vector search first (only if embeddings exist in the database).
    // This is the "premium" path — falls back gracefully if Atlas vector
    // search index isn't set up yet.
    if (await embeddingsExist()) {
      const vectorResult = await vectorSearch(q, page, limit);
      if (vectorResult) {
        result = vectorResult;
      } else {
        // Vector search failed (likely no index) — use text search
        result = await textSearch(q, page, limit);
      }
    } else {
      // No embeddings populated yet — use text search
      result = await textSearch(q, page, limit);
    }

    await trySetCache(cacheKey, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed", error: (error as Error).message });
  }
};
