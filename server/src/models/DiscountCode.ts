import mongoose, { Document, Schema } from "mongoose";

export interface IDiscountCode extends Document {
  code: string;
  percentage: number;
  active: boolean;
  createdAt: Date;
}

const discountCodeSchema = new Schema<IDiscountCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentage: { type: Number, required: true, min: 1, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DiscountCode = mongoose.model<IDiscountCode>(
  "DiscountCode",
  discountCodeSchema
);
