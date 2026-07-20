import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug?: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  tags: string[];
  images: string[];
  stock: number;
  sku: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  ratings: number;
  reviews: Array<{
    user: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  embedding?: number[];
  embeddingVersion?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // AI Vector Embedding for semantic search
    embedding: {
      type: [Number],
      // MongoDB Atlas Vector Search index will be created separately
    },
    embeddingVersion: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isActive: 1 });

// Text index for full-text search
ProductSchema.index({
  name: "text",
  description: "text",
  category: "text",
  tags: "text",
});

// Compound index for price filtering
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ isActive: 1, stock: 1 });

// ===== VIRTUALS =====

// Virtual for discounted price
ProductSchema.virtual("discountedPrice").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return this.price;
  }
  return this.price;
});

// Virtual for inStock status
ProductSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// ===== PRE-SAVE MIDDLEWARE =====

// Generate slug from name
ProductSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// ===== POST-SAVE MIDDLEWARE (For Stock Alerts) =====
ProductSchema.post("save", async function (doc) {
  // If stock is low (less than 10), trigger stock alert
  if (doc.stock < 10 && doc.isActive) {
    try {
      // Import dynamically to avoid circular dependency
      const { sendStockAlert } = await import("../services/socket.service");
      await sendStockAlert(doc._id.toString());
    } catch (error) {
      // Silently fail if socket service is not available
      console.log("Stock alert not sent (socket service not available)");
    }
  }
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);