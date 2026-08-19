import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWishlistItem extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  createdAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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

// A product can appear in a user's wishlist only once.
wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true });

export const WishlistItem = mongoose.model<IWishlistItem>(
  "WishlistItem",
  wishlistItemSchema
);
