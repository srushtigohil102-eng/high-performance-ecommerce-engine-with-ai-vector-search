import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { DiscountCode } from "../src/models/DiscountCode";
import { Order } from "../src/models/Order";
import { seedUsers, productData, discountCodes } from "../src/data/seedData";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB connected for seeding");

    // Build schema indexes (incl. $text search index) even if NODE_ENV=production.
    await Product.init();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      DiscountCode.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create test users
    await User.create(seedUsers);
    console.log(`Created users: ${seedUsers.map((u) => `${u.email} / ${u.password}`).join(", ")}`);

    // Create products
    const products = await Product.insertMany(productData);
    console.log(`Created ${products.length} products`);

    // Create discount codes
    await DiscountCode.insertMany(discountCodes);
    console.log(`Created ${discountCodes.length} discount codes: ${discountCodes.map((d) => d.code).join(", ")}`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
