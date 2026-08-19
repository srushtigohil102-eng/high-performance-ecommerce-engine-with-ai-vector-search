export interface Product {
  id: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
  rating?: number
  numReviews?: number
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
  emailVerified?: boolean
}

export interface UserAddress {
  id: string
  label: string
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  phone: string
  isDefault: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface WishlistItem {
  id: string
  product: Product
  createdAt: string
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

export type SearchMethod = 'text' | 'fuzzy' | 'regex' | 'vector' | 'none'

export type SearchSort = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'name'

export interface SearchResponse extends PaginatedResponse {
  searchMethod?: SearchMethod
}

export interface ProductQueryParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: SearchSort
}

export interface SearchSuggestion {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
}

export interface SearchSuggestionsResponse {
  queries: string[]
  products: SearchSuggestion[]
  categories: { name: string; count: number }[]
}

export interface TrendingSearch {
  term: string
  count: number
}

export interface CategoryCount {
  name: string
  count: number
}

export interface DiscountCode {
  code: string
  discountAmount: number
  description: string
  percentage?: number
}

export interface Review {
  id: string
  user: { id: string; name: string }
  rating: number
  title?: string
  comment: string
  createdAt: string
}

export interface ReviewSummary {
  averageRating: number
  ratingCount: number
}

export interface ReviewsResponse {
  reviews: Review[]
  page: number
  limit: number
  total: number
  totalPages: number
  averageRating: number
  ratingCount: number
}

export interface ReviewPayload {
  rating: number
  title?: string
  comment: string
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

// Backend shipping address shape (what the API actually stores/returns)
export interface BackendShippingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export type PaymentMethod = 'cod' | 'mock_card'

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  at: string
  note?: string
}

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
  statusHistory?: OrderStatusHistoryEntry[]
  trackingNumber?: string | null
  createdAt: string
}

export interface PlaceOrderPayload {
  items: { productId: string; quantity: number }[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  discountCode?: string
}

export interface AdminOrder extends Order {
  customerName: string
  customerEmail: string
}

export interface RecentAdminOrder {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: OrderStatus
  createdAt: string
}

export interface TopAdminProduct {
  name: string
  quantitySold: number
  revenue: number
}

export interface LowStockAdminProduct {
  id: string
  name: string
  stock: number
  price: number
  imageUrl?: string
}

export interface AdminDashboardStats {
  totalProducts: number
  totalOrders: number
  lowStockProducts: number
  totalRevenue: number
  recentOrders: RecentAdminOrder[]
  topProducts: TopAdminProduct[]
  lowStockList: LowStockAdminProduct[]
}

export interface AdminOrderQueryParams {
  status?: OrderStatus | ''
  page?: number
  limit?: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin'
  emailVerified: boolean
  createdAt: string
  orderCount: number
  totalSpent: number
}

export interface AdminUsersQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export interface AdminUsersResponse {
  users: AdminUser[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminUserDetail {
  user: AdminUser
  orders: AdminOrder[]
  orderCount: number
  totalSpent: number
}

export interface AuditLogActor {
  id?: string
  _id?: string
  name?: string
  email?: string
}

export interface AuditLogEntry {
  id: string
  actor: AuditLogActor | null
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface AdminAuditLogQueryParams {
  page?: number
  limit?: number
  action?: string
}

export interface AdminAuditLogsResponse {
  logs: AuditLogEntry[]
  page: number
  limit: number
  total: number
  totalPages: number
}
