export interface Product {
  id: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
}

export interface ProductPayload {
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface ApiError {
  message: string
  status: number
}

export interface PaginatedResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductQueryParams {
  page?: number
  limit?: number
  category?: string
  search?: string
}

export interface DiscountCode {
  code: string
  discountAmount: number
  description: string
}

export interface CartSummary {
  subtotal: number
  discountAmount: number
  total: number
  discount: DiscountCode | null
}
