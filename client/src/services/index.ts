export { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from './productService'
export { syncCartToBackend, fetchCartFromBackend, updateCartItemBackend, removeCartItemBackend } from './cartService'
export { apiClient, setAuthToken, clearAuthToken } from './apiClient'
export * as authService from './authService'
