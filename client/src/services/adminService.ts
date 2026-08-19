import { apiClient } from './apiClient'
import type {
  AdminOrder,
  AdminDashboardStats,
  AdminOrderQueryParams,
  OrderStatus,
  AdminUser,
  AdminUsersQueryParams,
  AdminUsersResponse,
  AdminUserDetail,
  AuditLogEntry,
  AdminAuditLogQueryParams,
  AdminAuditLogsResponse,
} from '../types'
import {
  normalizeOrderItem,
  normalizeShippingAddress,
  type RawShippingAddress,
} from './orderService'

interface RawAdminOrder {
  id?: string
  _id?: string
  order_id?: string
  items?: unknown[]
  shippingAddress?: RawShippingAddress | Record<string, unknown>
  shipping_address?: RawShippingAddress | Record<string, unknown>
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
  statusHistory?: {
    status?: string
    at?: string
    note?: string
  }[]
  trackingNumber?: string
  tracking_number?: string
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

  const statusHistory = (raw.statusHistory ?? [])
    .filter((entry) => entry && entry.status)
    .map((entry) => ({
      status: entry.status as OrderStatus,
      at: entry.at ?? new Date().toISOString(),
      note: entry.note,
    }))

  return {
    id: raw.id ?? raw._id ?? raw.order_id ?? '',
    items: (raw.items ?? []).map((item) => normalizeOrderItem(item as Parameters<typeof normalizeOrderItem>[0])),
    shippingAddress: normalizeShippingAddress(
      (raw.shippingAddress ?? raw.shipping_address) as RawShippingAddress | undefined,
    ),
    paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? 'cod') as AdminOrder['paymentMethod'],
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    discountAmount,
    total: typeof raw.total === 'number' ? raw.total : 0,
    discountCode: raw.discountCode ?? raw.discount_code ?? null,
    status: (raw.status ?? 'pending') as OrderStatus,
    statusHistory,
    trackingNumber: raw.trackingNumber ?? raw.tracking_number ?? null,
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

export async function updateOrderTracking(
  orderId: string,
  trackingNumber: string,
): Promise<AdminOrder> {
  const { data } = await apiClient.patch(`/admin/orders/${orderId}/tracking`, {
    trackingNumber,
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
    recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
    topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
    lowStockList: Array.isArray(data.lowStockList) ? data.lowStockList : [],
  }
}

function normalizeAdminUser(raw: Record<string, unknown>): AdminUser {
  return {
    id: (raw.id ?? raw._id ?? '') as string,
    name: (raw.name ?? 'Unknown') as string,
    email: (raw.email ?? '') as string,
    role: (raw.role ?? 'customer') as AdminUser['role'],
    emailVerified: Boolean(raw.emailVerified ?? raw.email_verified),
    createdAt: (raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
    orderCount: Number(raw.orderCount ?? raw.order_count ?? 0),
    totalSpent: Number(raw.totalSpent ?? raw.total_spent ?? 0),
  }
}

export async function getAdminUsers(
  params: AdminUsersQueryParams = {},
): Promise<AdminUsersResponse> {
  const { data } = await apiClient.get('/admin/users', { params })
  const users = Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : []
  return {
    users: users.map((raw: Record<string, unknown>) => normalizeAdminUser(raw)),
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? 20),
    total: Number(data.total ?? users.length),
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? users.length) / (data.limit ?? 20)))),
  }
}

export async function getAdminUserById(userId: string): Promise<AdminUserDetail> {
  const { data } = await apiClient.get(`/admin/users/${userId}`)
  const orders = Array.isArray(data.orders) ? data.orders : []
  return {
    user: normalizeAdminUser((data.user ?? data) as Record<string, unknown>),
    orders: orders.map((raw: RawAdminOrder) => normalizeAdminOrder(raw)),
    orderCount: Number(data.orderCount ?? data.order_count ?? orders.length),
    totalSpent: Number(data.totalSpent ?? data.total_spent ?? 0),
  }
}

function normalizeAuditLog(raw: Record<string, unknown>): AuditLogEntry {
  const actor = raw.actor as Record<string, unknown> | null | undefined
  return {
    id: (raw.id ?? raw._id ?? '') as string,
    actor: actor
      ? {
          id: actor.id as string | undefined,
          _id: actor._id as string | undefined,
          name: actor.name as string | undefined,
          email: actor.email as string | undefined,
        }
      : null,
    action: (raw.action ?? '') as string,
    resource: (raw.resource ?? '') as string,
    resourceId: raw.resourceId as string | undefined,
    details: (raw.details ?? {}) as Record<string, unknown>,
    ip: raw.ip as string | undefined,
    userAgent: raw.userAgent as string | undefined,
    createdAt: (raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
  }
}

export async function getAdminAuditLogs(
  params: AdminAuditLogQueryParams = {},
): Promise<AdminAuditLogsResponse> {
  const { data } = await apiClient.get('/admin/audit', { params })
  const logs = Array.isArray(data.logs) ? data.logs : Array.isArray(data) ? data : []
  return {
    logs: logs.map((raw: Record<string, unknown>) => normalizeAuditLog(raw)),
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? 20),
    total: Number(data.total ?? logs.length),
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? logs.length) / (data.limit ?? 20)))),
  }
}
