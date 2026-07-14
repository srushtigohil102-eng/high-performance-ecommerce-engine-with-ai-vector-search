export { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from './productService'
export { syncCartToBackend, fetchCartFromBackend } from './cartService'
export { apiClient, setAuthToken, clearAuthToken } from './apiClient'
export * as authService from './authService'
