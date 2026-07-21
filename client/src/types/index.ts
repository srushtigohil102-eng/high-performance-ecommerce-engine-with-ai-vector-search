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

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  phone: string
}

export type PaymentMethod = 'cod' | 'mock_card'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

export interface Order {
  id: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  subtotal: number
  discountAmount: number
  total: number
  discountCode: string | null
  status: OrderStatus
  createdAt: string
}

export interface PlaceOrderPayload {
  items: { productId: string; quantity: number }[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  discountCode?: string
}
