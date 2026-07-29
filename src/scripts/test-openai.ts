import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.substring(0, 20) + "...");

async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "test",
      encoding_format: "float",
    });

    console.log("✅ OpenAI is working!");
    console.log("Embedding length:", response.data[0].embedding.length);
  } catch (error) {
    console.error("❌ OpenAI error:", error);
  }
}

testOpenAI();