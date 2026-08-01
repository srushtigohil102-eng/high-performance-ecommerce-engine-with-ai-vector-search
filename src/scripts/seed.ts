import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { generateProductEmbedding } from "../services/embedding.service";

// ===== SEED DATA =====

const categories = [
  { name: "Electronics", slug: "electronics", description: "Electronic products and gadgets" },
  { name: "Clothing", slug: "clothing", description: "Fashion and apparel" },
  { name: "Books", slug: "books", description: "Books and publications" },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Home and kitchen products" },
  { name: "Sports", slug: "sports", description: "Sports and fitness equipment" },
  { name: "Toys", slug: "toys", description: "Toys and games for all ages" },
  { name: "Beauty", slug: "beauty", description: "Beauty and personal care products" },
  { name: "Automotive", slug: "automotive", description: "Automotive parts and accessories" },
];

const products = [
  {
    name: "Smartphone X Pro",
    description: "Latest smartphone with AI features, 6.8-inch display, 256GB storage, 5G ready",
    price: 899.99,
    comparePrice: 999.99,
    category: "Electronics",
    tags: ["smartphone", "5G", "AI", "android"],
    sku: "PHONE001",
    stock: 50,
  },
  {
    name: "Wireless Headphones Pro",
    description: "Noise-cancelling headphones with 50-hour battery life, Bluetooth 5.3",
    price: 249.99,
    comparePrice: 299.99,
    category: "Electronics",
    tags: ["headphones", "wireless", "noise-cancelling"],
    sku: "AUDIO001",
    stock: 100,
  },
  {
    name: "Smart Watch Series 5",
    description: "Fitness tracker with heart rate monitor, GPS, and sleep tracking",
    price: 349.99,
    comparePrice: 399.99,
    category: "Electronics",
    tags: ["watch", "fitness", "wearable"],
    sku: "WATCH001",
    stock: 75,
  },
  {
    name: "Men's Classic Denim Jacket",
    description: "Classic denim jacket, 100% cotton, vintage wash",
    price: 79.99,
    comparePrice: 99.99,
    category: "Clothing",
    tags: ["jacket", "denim", "men", "fashion"],
    sku: "CLOTH001",
    stock: 30,
  },
  {
    name: "Women's Yoga Pants",
    description: "High-waist yoga pants with 4-way stretch, moisture-wicking fabric",
    price: 49.99,
    comparePrice: 59.99,
    category: "Clothing",
    tags: ["yoga", "pants", "women", "fitness"],
    sku: "CLOTH002",
    stock: 45,
  },
  {
    name: "The AI Revolution Book",
    description: "A comprehensive guide to artificial intelligence and its impact on society",
    price: 29.99,
    comparePrice: 39.99,
    category: "Books",
    tags: ["book", "AI", "technology"],
    sku: "BOOK001",
    stock: 100,
  },
  {
    name: "Coffee Maker Deluxe",
    description: "Programmable coffee maker with built-in grinder, 12-cup capacity",
    price: 199.99,
    comparePrice: 249.99,
    category: "Home & Kitchen",
    tags: ["coffee", "kitchen", "appliance"],
    sku: "HOME001",
    stock: 40,
  },
  {
    name: "Air Fryer Pro",
    description: "5.8-quart air fryer with 8 cooking presets, digital display",
    price: 129.99,
    comparePrice: 159.99,
    category: "Home & Kitchen",
    tags: ["air fryer", "kitchen", "cooking"],
    sku: "HOME002",
    stock: 35,
  },
  {
    name: "Yoga Mat Premium",
    description: "Non-slip yoga mat, 6mm thick, eco-friendly material",
    price: 39.99,
    comparePrice: 49.99,
    category: "Sports",
    tags: ["yoga", "fitness", "exercise"],
    sku: "SPORT001",
    stock: 60,
  },
  {
    name: "LEGO Builder Set",
    description: "Creative building set with 500+ pieces, ages 8+",
    price: 59.99,
    comparePrice: 69.99,
    category: "Toys",
    tags: ["lego", "toys", "kids", "building"],
    sku: "TOY001",
    stock: 80,
  },
  {
    name: "Facial Cleanser Set",
    description: "Organic facial cleanser with vitamin C and hyaluronic acid",
    price: 34.99,
    comparePrice: 44.99,
    category: "Beauty",
    tags: ["skincare", "beauty", "organic"],
    sku: "BEAUTY001",
    stock: 70,
  },
  {
    name: "Car Phone Mount",
    description: "Universal car phone mount with 360-degree rotation",
    price: 19.99,
    comparePrice: 29.99,
    category: "Automotive",
    tags: ["car", "phone", "mount"],
    sku: "AUTO001",
    stock: 120,
  },
];

const users = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "Password123",
    role: "admin",
    isActive: true,
  },
  {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "Password123",
    role: "user",
    isActive: true,
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "Password123",
    role: "user",
    isActive: true,
  },
  {
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob@example.com",
    password: "Password123",
    role: "user",
    isActive: true,
  },
  {
    firstName: "Alice",
    lastName: "Williams",
    email: "alice@example.com",
    password: "Password123",
    role: "user",
    isActive: true,
  },
  {
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie@example.com",
    password: "Password123",
    role: "user",
    isActive: true,
  },
];

// ===== HELPER FUNCTIONS =====

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// ===== MAIN SEED FUNCTION =====

async function seedDatabase() {
  console.log("\n🚀 Starting Database Seeding...\n");
  console.log("=".repeat(60));

  try {
    await connectDB();

    // ===== CLEAR EXISTING DATA =====
    console.log("\n🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    console.log("✅ All existing data cleared");

    // ===== CREATE CATEGORIES =====
    console.log("\n📁 Creating categories...");
    const categoryDocs = [];
    for (const cat of categories) {
      const category = await Category.create(cat);
      categoryDocs.push(category);
      console.log(`  ✅ ${cat.name}`);
    }
    console.log(`  Total: ${categoryDocs.length} categories created`);

    // ===== CREATE USERS =====
    console.log("\n👥 Creating users...");
    const userDocs = [];
    for (const user of users) {
      const userDoc = await User.create(user);
      userDocs.push(userDoc);
      console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.email})`);
    }
    console.log(`  Total: ${userDocs.length} users created`);

    // ===== CREATE PRODUCTS =====
    console.log("\n📦 Creating products...");
    const productDocs = [];
    let embeddingCount = 0;

    for (const product of products) {
      const category = randomItem(categoryDocs);
      const productDoc = await Product.create({
        ...product,
        category: category.name,
      });

      // Generate embedding for product
      try {
        await generateProductEmbedding(productDoc);
        embeddingCount++;
        console.log(`  ✅ ${product.name} (with embedding)`);
      } catch (error) {
        console.log(`  ⚠️ ${product.name} (without embedding)`);
      }

      productDocs.push(productDoc);
    }
    console.log(`  Total: ${productDocs.length} products created (${embeddingCount} with embeddings)`);

    // ===== CREATE CARTS =====
    console.log("\n🛒 Creating carts...");
    let cartCount = 0;
    for (const user of userDocs.slice(0, 3)) {
      const cartItems = [];
      const numItems = randomInt(1, 3);
      const shuffledProducts = [...productDocs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numItems && i < shuffledProducts.length; i++) {
        cartItems.push({
          product: shuffledProducts[i]._id,
          quantity: randomInt(1, 3),
        });
      }

      await Cart.create({
        user: user._id,
        items: cartItems,
      });
      cartCount++;
      console.log(`  ✅ Cart for ${user.firstName} ${user.lastName} (${cartItems.length} items)`);
    }
    console.log(`  Total: ${cartCount} carts created`);

    // ===== CREATE ORDERS =====
    console.log("\n📦 Creating orders...");
    let orderCount = 0;
    const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    for (const user of userDocs) {
      const numOrders = randomInt(1, 3);

      for (let i = 0; i < numOrders; i++) {
        const orderItems = [];
        const numItems = randomInt(1, 3);
        const shuffledProducts = [...productDocs].sort(() => Math.random() - 0.5);

        let totalAmount = 0;
        for (let j = 0; j < numItems && j < shuffledProducts.length; j++) {
          const product = shuffledProducts[j];
          const quantity = randomInt(1, 2);
          const price = product.price;
          orderItems.push({
            product: product._id,
            quantity,
            price,
          });
          totalAmount += price * quantity;
        }

        const status = randomItem(statuses);
        const isPaid = status !== "pending" && status !== "cancelled";

        await Order.create({
          user: user._id,
          items: orderItems,
          totalAmount,
          status,
          paymentStatus: isPaid ? "paid" : "pending",
          paymentId: isPaid ? `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
          shippingAddress: {
            fullName: `${user.firstName} ${user.lastName}`,
            address: `${randomInt(100, 999)} Main St, Apt ${randomInt(1, 20)}`,
            city: randomItem(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune"]),
            state: randomItem(["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Telangana"]),
            pincode: `${randomInt(100000, 999999)}`,
            country: "India",
            phone: `98${randomInt(10000000, 99999999)}`,
          },
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        });
        orderCount++;
      }
    }
    console.log(`  Total: ${orderCount} orders created`);

    // ===== FINAL SUMMARY =====
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DATABASE SEEDING COMPLETED!");
    console.log("=".repeat(60));
    console.log("\n📊 FINAL SUMMARY:");
    console.log(`  👥 Users: ${userDocs.length}`);
    console.log(`  📁 Categories: ${categoryDocs.length}`);
    console.log(`  📦 Products: ${productDocs.length} (${embeddingCount} with AI embeddings)`);
    console.log(`  🛒 Carts: ${cartCount}`);
    console.log(`  📦 Orders: ${orderCount}`);
    console.log("\n🔑 DEFAULT LOGIN:");
    console.log(`  Email: admin@example.com`);
    console.log(`  Password: Password123`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Seeding completed successfully!");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

seedDatabase();