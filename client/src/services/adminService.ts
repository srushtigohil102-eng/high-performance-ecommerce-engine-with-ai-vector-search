import { apiClient } from './apiClient'
import type {
  AdminOrder,
  AdminDashboardStats,
  AdminOrderQueryParams,
  OrderStatus,
  OrderItem,
} from '../types'
import { normalizeOrderItem, type RawOrderItem } from './orderService'

interface RawAdminOrder {
  id?: string
  _id?: string
  order_id?: string
  items?: unknown[]
  shippingAddress?: Record<string, unknown>
  shipping_address?: Record<string, unknown>
  paymentMethod?: string
  payment_method?: string
  subtotal?: number
  discountAmount?: number
  discount_amount?: number
  discount?: number
  total?: number
  discountCode?: string
  discount_code?: string
  status?: string
  createdAt?: string
  created_at?: string
  // Backend populates user as { _id, name, email }
  user?: { _id?: string; name?: string; email?: string } | string
  customerName?: string
  customer_name?: string
  userName?: string
  customerEmail?: string
  customer_email?: string
  userEmail?: string
}

function normalizeAdminOrder(raw: RawAdminOrder): AdminOrder {
  // Extract customer info from populated user field or top-level fields
  let customerName = 'Unknown'
  let customerEmail = ''

  if (raw.user && typeof raw.user === 'object') {
    customerName = raw.user.name ?? 'Unknown'
    customerEmail = raw.user.email ?? ''
  } else {
    customerName = raw.customerName ?? raw.customer_name ?? raw.userName ?? 'Unknown'
    customerEmail = raw.customerEmail ?? raw.customer_email ?? raw.userEmail ?? ''
  }

  const discountAmount = typeof raw.discountAmount === 'number' ? raw.discountAmount
    : typeof raw.discount_amount === 'number' ? raw.discount_amount
    : typeof raw.discount === 'number' ? raw.discount
    : 0

  return {
    id: raw.id ?? raw._id ?? raw.order_id ?? '',
    items: (raw.items ?? []).map((item) => normalizeOrderItem(item as Parameters<typeof normalizeOrderItem>[0])),
    shippingAddress: (raw.shippingAddress ?? raw.shipping_address ?? {}) as AdminOrder['shippingAddress'],
    paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? 'cod') as AdminOrder['paymentMethod'],
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    discountAmount,
    total: typeof raw.total === 'number' ? raw.total : 0,
    discountCode: raw.discountCode ?? raw.discount_code ?? null,
    status: (raw.status ?? 'pending') as OrderStatus,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    customerName,
    customerEmail,
  }
}

export async function getAdminOrders(
  params: AdminOrderQueryParams = {},
): Promise<AdminOrder[]> {
  const { data } = await apiClient.get('/admin/orders', { params })
  const list = Array.isArray(data) ? data : data?.orders ?? []
  return list.map((raw: RawAdminOrder) => normalizeAdminOrder(raw))
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrder> {
  const { data } = await apiClient.get(`/admin/orders/${orderId}`)
  const raw = (data?.order ?? data) as RawAdminOrder
  return normalizeAdminOrder(raw)
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  const { data } = await apiClient.patch(`/admin/orders/${orderId}/status`, {
    status,
  })
  const raw = (data?.order ?? data) as RawAdminOrder
  return normalizeAdminOrder(raw)
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data } = await apiClient.get('/admin/stats')
  return {
    totalProducts: data.totalProducts ?? data.total_products ?? 0,
    totalOrders: data.totalOrders ?? data.total_orders ?? 0,
    lowStockProducts: data.lowStockProducts ?? data.low_stock_products ?? 0,
    totalRevenue: data.totalRevenue ?? data.total_revenue ?? 0,
  }
}
