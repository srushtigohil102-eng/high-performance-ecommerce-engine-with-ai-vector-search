import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ user: 1 });

// Virtual for total items
CartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
});

// Method to calculate total price
CartSchema.methods.calculateTotalPrice = async function () {
  let total = 0;
  for (const item of this.items) {
    const product = await mongoose.model("Product").findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return total;
};

export const Cart = mongoose.model<ICart>("Cart", CartSchema);