export { getProducts, searchProducts, getProductById, createProduct, updateProduct, deleteProduct } from './productService'
export { syncCartToBackend, fetchCartFromBackend, updateCartItemBackend, removeCartItemBackend, applyDiscountBackend, removeDiscountBackend, getCartSummaryBackend } from './cartService'
export { apiClient, setAuthToken, clearAuthToken } from './apiClient'
export * as authService from './authService'
