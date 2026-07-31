import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { config } from 'dotenv';

config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Generate a mock embedding (1536 dimensions) – normally you'd use OpenAI
    const generateMockEmbedding = (): number[] => {
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    };

    // Helper to generate a unique slug from the name
    const generateSlug = (name: string): string => {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    };

    const products = [
      {
        name: 'iPhone 15 Pro Max',
        slug: generateSlug('iPhone 15 Pro Max'), // added
        description: 'Latest Apple smartphone with A17 Pro chip, titanium body, and advanced camera system.',
        price: 1199.99,
        category: 'Electronics',
        sku: 'IPHONE15PM-001',
        stock: 25,
        isActive: true,
        embedding: generateMockEmbedding(),
        images: ['https://example.com/iphone15.jpg'],
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        slug: generateSlug('Samsung Galaxy S24 Ultra'),
        description: 'Android flagship with AI features, 200MP camera, and S Pen support.',
        price: 1299.99,
        category: 'Electronics',
        sku: 'SAMSUNGS24U-001',
        stock: 30,
        isActive: true,
        embedding: generateMockEmbedding(),
        images: ['https://example.com/galaxys24.jpg'],
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        slug: generateSlug('Sony WH-1000XM5 Headphones'),
        description: 'Premium noise-canceling headphones with exceptional sound quality and long battery life.',
        price: 399.99,
        category: 'Electronics',
        sku: 'SONYWH1000XM5-001',
        stock: 50,
        isActive: true,
        embedding: generateMockEmbedding(),
        images: ['https://example.com/sonyheadphones.jpg'],
      },
      {
        name: 'Dell XPS 16 Laptop',
        slug: generateSlug('Dell XPS 16 Laptop'),
        description: 'Powerful laptop with 16-inch OLED display, Intel Core Ultra 9, and 32GB RAM.',
        price: 2499.99,
        category: 'Electronics',
        sku: 'DELLXPS16-001',
        stock: 15,
        isActive: true,
        embedding: generateMockEmbedding(),
        images: ['https://example.com/dellxps.jpg'],
      },
      {
        name: 'Nike Air Max 270',
        slug: generateSlug('Nike Air Max 270'),
        description: 'Comfortable running shoes with visible air cushioning and stylish design.',
        price: 150.00,
        category: 'Footwear',
        sku: 'NIKEAM270-001',
        stock: 100,
        isActive: true,
        embedding: generateMockEmbedding(),
        images: ['https://example.com/nikeam270.jpg'],
      },
    ];

    const inserted = await Product.insertMany(products);
    console.log(`✅ Inserted ${inserted.length} products`);

    // **Remove the vector index creation attempt – we'll create it manually**
    // (The correct way is `createSearchIndex`, but it requires Atlas Search enabled.
    //  We'll do it manually via mongosh after seeding.)
    console.log('ℹ️  Please create the vector index manually using mongosh:');
    console.log('   db.products.createSearchIndex("product_vector_index", { mappings: { dynamic: true, fields: { embedding: { type: "vector", dimensions: 1536, similarity: "cosine" } } } })');

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedProducts();