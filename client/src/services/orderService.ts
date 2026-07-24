import { apiClient } from './apiClient'
import { mockOrders } from '../data/mockOrders'
import type { PlaceOrderPayload, Order, OrderItem, ShippingAddress, PaymentMethod, OrderStatus } from '../types'

interface RawOrderItem {
  productId?: string
  product_id?: string
  product?: string
  name?: string
  price?: number
  quantity?: number
  imageUrl?: string
  image_url?: string
}

interface RawShippingAddress {
  fullName?: string
  full_name?: string
  addressLine1?: string
  address_line1?: string
  addressLine2?: string
  address_line2?: string
  city?: string
  state?: string
  postalCode?: string
  postal_code?: string
  phone?: string
}

interface RawOrder {
  id?: string
  _id?: string
  order_id?: string
  items?: RawOrderItem[]
  shippingAddress?: RawShippingAddress
  shipping_address?: RawShippingAddress
  paymentMethod?: string
  payment_method?: string
  subtotal?: number
  discountAmount?: number
  discount_amount?: number
  total?: number
  discountCode?: string
  discount_code?: string
  status?: string
  createdAt?: string
  created_at?: string
  createdOn?: string
}

function normalizeOrderItem(raw: RawOrderItem): OrderItem {
  const name = raw.name ?? 'Unknown Product'
  const price = typeof raw.price === 'number' ? raw.price : 0
  const quantity = typeof raw.quantity === 'number' ? raw.quantity : 1
  const imageUrl = raw.imageUrl ?? raw.image_url ?? 'https://placehold.co/200x200?text=Product'
  return {
    productId: raw.productId ?? raw.product_id ?? raw.product ?? '',
    name,
    price,
    quantity,
    imageUrl,
  }
}

function normalizeShippingAddress(raw: RawShippingAddress | undefined): ShippingAddress {
  if (!raw) {
    return { fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', phone: '' }
  }
  return {
    fullName: raw.fullName ?? raw.full_name ?? '',
    addressLine1: raw.addressLine1 ?? raw.address_line1 ?? '',
    addressLine2: raw.addressLine2 ?? raw.address_line2 ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.postalCode ?? raw.postal_code ?? '',
    phone: raw.phone ?? '',
  }
}

function normalizeOrder(raw: RawOrder): Order {
  const id = raw.id ?? raw._id ?? raw.order_id ?? ''
  const paymentMethod = (raw.paymentMethod ?? raw.payment_method ?? 'cod') as PaymentMethod
  const status = (raw.status ?? 'pending') as OrderStatus
  const createdAt = raw.createdAt ?? raw.created_at ?? raw.createdOn ?? new Date().toISOString()

  if (import.meta.env.DEV && !id) {
    console.warn('[orderService] Order missing id field, response shape may have changed:', raw)
  }

  return {
    id,
    items: (raw.items ?? []).map(normalizeOrderItem),
    shippingAddress: normalizeShippingAddress(raw.shippingAddress ?? raw.shipping_address),
    paymentMethod,
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    discountAmount: typeof raw.discountAmount === 'number' ? raw.discountAmount : (typeof raw.discount_amount === 'number' ? raw.discount_amount : 0),
    total: typeof raw.total === 'number' ? raw.total : 0,
    discountCode: raw.discountCode ?? raw.discount_code ?? null,
    status,
    createdAt,
  }
}

function unwrapOrderResponse(data: unknown): Order {
  const obj = data as Record<string, unknown>
  if (obj && typeof obj === 'object' && 'order' in obj) {
    return normalizeOrder(obj.order as RawOrder)
  }
  return normalizeOrder(data as RawOrder)
}

function unwrapOrdersResponse(data: unknown): Order[] {
  const obj = data as Record<string, unknown>
  if (Array.isArray(data)) {
    return (data as RawOrder[]).map(normalizeOrder)
  }
  if (obj && typeof obj === 'object' && 'orders' in obj) {
    return (obj.orders as RawOrder[]).map(normalizeOrder)
  }
  if (import.meta.env.DEV) {
    console.warn('[orderService] Unexpected orders response shape:', data)
  }
  return []
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const { data } = await apiClient.post('/orders', payload)
  return unwrapOrderResponse(data)
}

export async function getOrderById(orderId: string): Promise<Order> {
  try {
    const { data } = await apiClient.get(`/orders/${orderId}`)
    return unwrapOrderResponse(data)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[orderService] API unavailable, falling back to mock data', err)
      return mockOrders.find((o) => o.id === orderId) ?? mockOrders[0]
    }
    throw new Error('Failed to load order. Please try again later.')
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const { data } = await apiClient.get('/orders')
    return unwrapOrdersResponse(data)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[orderService] API unavailable, falling back to mock data', err)
      return mockOrders
    }
    throw new Error('Failed to load orders. Please try again later.')
  }
}
