import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  embedding?: number[];
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    imageUrl: { type: String, default: "" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    embedding: { type: [Number], default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = obj._id?.toString();
        delete obj.__v;
        return obj;
      },
    },
  }
);

// Text index covering name, description, and category for full-text search.
// Weighted so name matches rank higher than description matches.
productSchema.index(
  { name: "text", description: "text", category: "text" },
  { weights: { name: 10, description: 5, category: 3 }, name: "product_text_search" }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
