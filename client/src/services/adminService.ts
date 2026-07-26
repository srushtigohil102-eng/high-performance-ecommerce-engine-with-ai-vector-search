import { apiClient } from './apiClient'
import { mockOrders } from '../data/mockOrders'
import { mockProducts } from '../data/mockProducts'
import type {
  AdminOrder,
  AdminDashboardStats,
  AdminOrderQueryParams,
  OrderStatus,
} from '../types'

export async function getAdminOrders(
  params: AdminOrderQueryParams = {},
): Promise<AdminOrder[]> {
  try {
    const { data } = await apiClient.get('/admin/orders', { params })
    const list = Array.isArray(data) ? data : data?.orders ?? []
    return list.map((raw: Record<string, unknown>) => ({
      id: raw.id ?? raw._id ?? raw.order_id ?? '',
      items: raw.items ?? [],
      shippingAddress: raw.shippingAddress ?? raw.shipping_address ?? {},
      paymentMethod: raw.paymentMethod ?? raw.payment_method ?? 'cod',
      subtotal: raw.subtotal ?? 0,
      discountAmount: raw.discountAmount ?? raw.discount_amount ?? 0,
      total: raw.total ?? 0,
      discountCode: raw.discountCode ?? raw.discount_code ?? null,
      status: raw.status ?? 'pending',
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      customerName:
        raw.customerName ?? raw.customer_name ?? raw.userName ?? 'Unknown',
      customerEmail:
        raw.customerEmail ?? raw.customer_email ?? raw.userEmail ?? '',
    })) as AdminOrder[]
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[adminService] API unavailable, falling back to mock data', err)
      return filterMockAdminOrders(mockAdminOrders, params)
    }
    throw new Error('Failed to load orders. Please try again later.')
  }
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrder> {
  try {
    const { data } = await apiClient.get(`/admin/orders/${orderId}`)
    const raw = data?.order ?? data
    return {
      id: raw.id ?? raw._id ?? raw.order_id ?? orderId,
      items: raw.items ?? [],
      shippingAddress: raw.shippingAddress ?? raw.shipping_address ?? {},
      paymentMethod: raw.paymentMethod ?? raw.payment_method ?? 'cod',
      subtotal: raw.subtotal ?? 0,
      discountAmount: raw.discountAmount ?? raw.discount_amount ?? 0,
      total: raw.total ?? 0,
      discountCode: raw.discountCode ?? raw.discount_code ?? null,
      status: raw.status ?? 'pending',
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      customerName:
        raw.customerName ?? raw.customer_name ?? raw.userName ?? 'Unknown',
      customerEmail:
        raw.customerEmail ?? raw.customer_email ?? raw.userEmail ?? '',
    } as AdminOrder
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[adminService] API unavailable, falling back to mock data', err)
      const found = mockAdminOrders.find((o) => o.id === orderId)
      if (found) return found
      if (mockAdminOrders.length > 0) return mockAdminOrders[0]
    }
    throw new Error('Failed to load order details.')
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  try {
    const { data } = await apiClient.patch(`/admin/orders/${orderId}/status`, {
      status,
    })
    const raw = data?.order ?? data
    return {
      id: raw.id ?? raw._id ?? raw.order_id ?? orderId,
      items: raw.items ?? [],
      shippingAddress: raw.shippingAddress ?? raw.shipping_address ?? {},
      paymentMethod: raw.paymentMethod ?? raw.payment_method ?? 'cod',
      subtotal: raw.subtotal ?? 0,
      discountAmount: raw.discountAmount ?? raw.discount_amount ?? 0,
      total: raw.total ?? 0,
      discountCode: raw.discountCode ?? raw.discount_code ?? null,
      status: raw.status ?? status,
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      customerName:
        raw.customerName ?? raw.customer_name ?? raw.userName ?? 'Unknown',
      customerEmail:
        raw.customerEmail ?? raw.customer_email ?? raw.userEmail ?? '',
    } as AdminOrder
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[adminService] API unavailable, mocking status update', err)
      const order = mockAdminOrders.find((o) => o.id === orderId)
      if (order) {
        order.status = status
        return { ...order }
      }
      if (mockAdminOrders.length > 0) {
        mockAdminOrders[0].status = status
        return { ...mockAdminOrders[0] }
      }
    }
    throw new Error('Failed to update order status.')
  }
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const { data } = await apiClient.get('/admin/stats')
    return {
      totalProducts: data.totalProducts ?? data.total_products ?? 0,
      totalOrders: data.totalOrders ?? data.total_orders ?? 0,
      lowStockProducts: data.lowStockProducts ?? data.low_stock_products ?? 0,
      totalRevenue: data.totalRevenue ?? data.total_revenue ?? 0,
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[adminService] API unavailable, falling back to mock stats', err)
      return {
        totalProducts: mockProducts.length,
        totalOrders: mockOrders.length,
        lowStockProducts: mockProducts.filter(
          (p) => typeof p.stock === 'number' && p.stock < 5,
        ).length,
        totalRevenue: mockOrders.reduce((sum, o) => sum + o.total, 0),
      }
    }
    throw new Error('Failed to load dashboard stats.')
  }
}

// --- Mock helpers ---

const mockAdminOrders: AdminOrder[] = [
  {
    ...mockOrders[0],
    customerName: 'Jane Doe',
    customerEmail: 'jane.doe@example.com',
  },
  {
    ...mockOrders[1],
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
  },
  {
    ...mockOrders[2],
    customerName: 'Alice Johnson',
    customerEmail: 'alice.j@example.com',
  },
]

function filterMockAdminOrders(
  orders: AdminOrder[],
  params: AdminOrderQueryParams,
): AdminOrder[] {
  let filtered = [...orders]
  if (params.status) {
    filtered = filtered.filter((o) => o.status === params.status)
  }
  return filtered
}
