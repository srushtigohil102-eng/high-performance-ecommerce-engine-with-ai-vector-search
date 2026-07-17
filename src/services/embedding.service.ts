import openai from "../config/openai";
import { Product } from "../models/Product";
import logger from "../utils/logger";

// ===== GENERATE EMBEDDING FOR TEXT =====
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error(`Embedding generation error: ${error}`);
    throw new Error("Failed to generate embedding");
  }
};

// ===== GENERATE EMBEDDING FOR PRODUCT =====
export const generateProductEmbedding = async (product: any): Promise<number[]> => {
  // Combine product information into a single text
  const text = `
    Product: ${product.name}
    Description: ${product.description}
    Category: ${product.category}
    Tags: ${product.tags?.join(", ") || ""}
  `.trim();

  return generateEmbedding(text);
};

// ===== GENERATE EMBEDDINGS FOR ALL PRODUCTS =====
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