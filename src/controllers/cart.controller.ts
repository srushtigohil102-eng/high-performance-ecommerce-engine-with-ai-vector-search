import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import logger from "../utils/logger";

// ===== ADD TO CART =====
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Check stock
    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity;
      } else {
        // Add new item
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    // Populate product details
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(`Add to cart error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: (error as Error).message,
    });
  }
};

// ===== GET CART =====
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .lean();

    if (!cart) {
      res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
      return;
    }

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    const itemsWithDetails = cart.items.map((item: any) => {
      const product = item.product as any;
      const subtotal = product.price * item.quantity;
      totalPrice += subtotal;
      totalItems += item.quantity;

      return {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        quantity: item.quantity,
        subtotal,
        stock: product.stock,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: itemsWithDetails,
        totalItems,
        totalPrice,
      },
    });
  } catch (error) {
    logger.error(`Get cart error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: (error as Error).message,
    });
  }
};

// ===== UPDATE CART ITEM =====
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
      return;
    }

    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
      return;
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(`Update cart error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: (error as Error).message,
    });
  }
};

// ===== REMOVE FROM CART =====
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
      return;
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(`Remove from cart error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: (error as Error).message,
    });
  }
};

// ===== CLEAR CART =====
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    logger.error(`Clear cart error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: (error as Error).message,
    });
  }
};