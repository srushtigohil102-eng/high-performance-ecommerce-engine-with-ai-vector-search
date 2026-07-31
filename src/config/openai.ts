import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
console.log("OpenAI API Key length:", process.env.OPENAI_API_KEY?.length);

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;