import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/database";
import { generateAllProductEmbeddings } from "../services/embedding.service";

dotenv.config();

async function generateEmbeddings() {
  console.log("\n🚀 Starting Embedding Generation...\n");
  console.log("=".repeat(60));

  try {
    await connectDB();

    await generateAllProductEmbeddings();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Embedding Generation Complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Embedding generation failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

generateEmbeddings();