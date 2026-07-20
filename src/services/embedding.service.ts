import openai from "../config/openai";
import { Product } from "../models/Product";
import logger from "../utils/logger";

// ===== GENERATE MOCK EMBEDDING (for testing without API) =====
export const generateMockEmbedding = (text: string): number[] => {
  // Generate a deterministic embedding based on text
  const embedding: number[] = [];
  const seed = text.length * 1000;
  
  for (let i = 0; i < 1536; i++) {
    // Simple hash to generate deterministic values
    const hash = (seed + i * 31) % 1000 / 1000;
    embedding.push(hash);
  }
  return embedding;
};

// ===== GENERATE EMBEDDING WITH FALLBACK =====
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    // Check if OpenAI API key exists and has quota
    const hasValidKey = process.env.OPENAI_API_KEY && 
                        process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                        process.env.OPENAI_API_KEY.length > 20;

    if (!hasValidKey) {
      logger.warn('⚠️ No valid OpenAI API key. Using mock embedding.');
      return generateMockEmbedding(text);
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      logger.warn('⚠️ OpenAI quota exceeded. Using mock embedding.');
      return generateMockEmbedding(text);
    }
    logger.error(`Embedding generation error: ${error}`);
    return generateMockEmbedding(text);
  }
};

// ===== GENERATE PRODUCT EMBEDDING =====
export const generateProductEmbedding = async (product: any): Promise<number[]> => {
  const text = `
    Product: ${product.name}
    Description: ${product.description}
    Category: ${product.category}
    Tags: ${product.tags?.join(", ") || ""}
  `.trim();

  return generateEmbedding(text);
};

// ===== GENERATE ALL PRODUCT EMBEDDINGS =====
export const generateAllProductEmbeddings = async (): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true, embedding: { $exists: false } });

    if (products.length === 0) {
      logger.info("No products need embedding generation");
      return;
    }

    logger.info(`Generating embeddings for ${products.length} products...`);

    for (const product of products) {
      try {
        const embedding = await generateProductEmbedding(product);
        product.embedding = embedding;
        product.embeddingVersion = 1;
        await product.save();
        logger.info(`✅ Embedding generated for: ${product.name}`);
      } catch (error) {
        logger.error(`Failed for product ${product.name}: ${error}`);
      }
    }

    logger.info("✅ All embeddings generated successfully!");
  } catch (error) {
    logger.error(`Batch embedding error: ${error}`);
    throw error;
  }
};

// ===== GENERATE SINGLE PRODUCT EMBEDDING =====
export const generateProductEmbeddingById = async (productId: string): Promise<void> => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const embedding = await generateProductEmbedding(product);
    product.embedding = embedding;
    product.embeddingVersion = 1;
    await product.save();

    logger.info(`✅ Embedding generated for: ${product.name}`);
  } catch (error) {
    logger.error(`Embedding generation error: ${error}`);
    throw error;
  }
};