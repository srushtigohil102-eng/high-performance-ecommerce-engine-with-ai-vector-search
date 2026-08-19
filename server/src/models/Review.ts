import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
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

// A user can review a given product once; upserts / double-submits must not
// create duplicates.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Reviews for a product are the common read path (newest first).
reviewSchema.index({ product: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
