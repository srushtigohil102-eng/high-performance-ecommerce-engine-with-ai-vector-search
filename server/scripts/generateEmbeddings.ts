/**
 * generateEmbeddings.ts — Populate Product.embedding fields with OpenAI vectors.
 *
 * WHAT IT DOES:
 *   1. Fetches all products that don't already have an embedding.
 *   2. Batches them (20 per API call to stay under OpenAI's token limits).
 *   3. Calls OpenAI's text-embedding-3-small model (1536 dimensions).
 *   4. Writes the vectors back to MongoDB.
 *
 * REQUIREMENTS:
 *   - OPENAI_API_KEY in .env (get one at platform.openai.com)
 *   - MongoDB running and seeded (run `npm run seed` first)
 *
 * TO RUN:
 *   cd server
 *   npm run generate-embeddings
 *
 * NOTE ON ATLAS VECTOR SEARCH:
 *   After running this script, you MUST create a vector search index in
 *   MongoDB Atlas before $vectorSearch queries will work:
 *
 *   1. Go to Atlas Dashboard > your cluster > Database > Search Indexes
 *   2. Click "Create Search Index"
 *   3. Select "Atlas Vector Search" (not Full Text Search)
 *   4. Choose "JSON Editor" and paste:
 *      {
 *        "fields": [{
 *          "type": "vector",
 *          "path": "embedding",
 *          "numDimensions": 1536,
 *          "similarity": "cosine"
 *        }]
 *      }
 *   5. Select the "products" collection, name the index "vector_index"
 *   6. Click "Create Search Index" and wait for it to build (~1-2 min)
 *
 *   Without this index, the search endpoint will automatically fall back
 *   to MongoDB text search, which still works well for most demo scenarios.
 *
 * COST:
 *   text-embedding-3-small is ~$0.02 per 1M tokens. With 75 products
 *   averaging ~50 tokens each, total cost is effectively $0.00.
 */

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import mongoose from "mongoose";
import { Product } from "../src/models/Product";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 20; // products per API call

// ─── OpenAI embedding call ──────────────────────────────────────────────────

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };

  // OpenAI returns embeddings in the same order as the input.
  // Sort by index just in case, though this shouldn't be necessary.
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// ─── Main script ────────────────────────────────────────────────────────────

async function main() {
  if (!OPENAI_API_KEY) {
    console.error(
      "OPENAI_API_KEY is not set in .env. Cannot generate embeddings.\n" +
        "Get a key at https://platform.openai.com/api-keys"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to MongoDB");

  // Find products without embeddings
  const products = await Product.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $size: 0 } },
    ],
  }).select("name description category");

  if (products.length === 0) {
    console.log("All products already have embeddings. Nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${products.length} products without embeddings`);

  let processed = 0;
  const total = products.length;

  // Process in batches
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    // Combine name + description + category into a single text for embedding.
    // This gives the embedding model the most signal for semantic matching.
    // A more sophisticated approach would weight these fields differently
    // or use a custom prompt template, but this works well enough for MVP.
    const texts = batch.map(
      (p) => `${p.name}. ${p.description}. Category: ${p.category}`
    );

    try {
      const embeddings = await getEmbeddings(texts);

      // Write embeddings back to each product
      const bulkOps = batch.map((product, idx) => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { embedding: embeddings[idx] } },
        },
      }));

      await Product.bulkWrite(bulkOps);

      processed += batch.length;
      const pct = Math.round((processed / total) * 100);
      console.log(`  [${pct}%] Processed ${processed}/${total} products`);

      // Small delay between batches to be polite to the API.
      // At 20 products/batch with ~75 total, this is only 4 batches,
      // so total runtime is about 2-3 seconds.
      if (i + BATCH_SIZE < products.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(
        `  Error processing batch starting at index ${i}:`,
        (err as Error).message
      );
      // Continue with next batch rather than aborting — partial embeddings
      // are better than none, and the search endpoint handles missing
      // embeddings gracefully by falling back to text search.
    }
  }

  console.log(
    `\nDone! ${processed}/${total} products now have embeddings.`
  );
  console.log(
    "Remember: you still need to create a Vector Search index in Atlas"
  );
  console.log(
    'before the /api/search endpoint will use vector search. See the');
  console.log(
    "comments at the top of this file for step-by-step instructions.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
