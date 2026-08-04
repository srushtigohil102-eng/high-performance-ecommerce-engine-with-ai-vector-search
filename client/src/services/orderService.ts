import { apiClient } from './apiClient'
import type { PlaceOrderPayload, Order, OrderItem, ShippingAddress, PaymentMethod, OrderStatus } from '../types'

interface RawOrderItem {
  productId?: string
  product_id?: string
  product?: string | { _id?: string; name?: string; imageUrl?: string; image_url?: string }
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
  street?: string
  city?: string
  state?: string
  postalCode?: string
  postal_code?: string
  zipCode?: string
  country?: string
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
  discount?: number
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

  // product may be a populated object { _id, name, imageUrl } or just a string id
  const productObj = typeof raw.product === 'object' ? raw.product : undefined
  const imageUrl = raw.imageUrl ?? raw.image_url ?? productObj?.imageUrl ?? productObj?.image_url ?? 'https://placehold.co/200x200?text=Product'
  const productId = raw.productId ?? raw.product_id ?? productObj?._id ?? (typeof raw.product === 'string' ? raw.product : '') ?? ''
  return {
    productId,
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
  // Backend shape: { street, city, state, zipCode, country }
  // Frontend shape: { fullName, addressLine1, addressLine2, city, state, postalCode, phone }
  return {
    fullName: raw.fullName ?? raw.full_name ?? '',
    addressLine1: raw.addressLine1 ?? raw.address_line1 ?? raw.street ?? '',
    addressLine2: raw.addressLine2 ?? raw.address_line2 ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.postalCode ?? raw.postal_code ?? raw.zipCode ?? '',
    phone: raw.phone ?? '',
  }
}

function normalizeOrder(raw: RawOrder): Order {
  const id = raw.id ?? raw._id ?? raw.order_id ?? ''
  const paymentMethod = (raw.paymentMethod ?? raw.payment_method ?? 'cod') as PaymentMethod
  const status = (raw.status ?? 'pending') as OrderStatus
  const createdAt = raw.createdAt ?? raw.created_at ?? raw.createdOn ?? new Date().toISOString()

  // Backend returns "discount" (amount deducted), frontend calls it "discountAmount"
  const discountAmount = typeof raw.discountAmount === 'number' ? raw.discountAmount
    : typeof raw.discount_amount === 'number' ? raw.discount_amount
    : typeof raw.discount === 'number' ? raw.discount
    : 0

  if (import.meta.env.DEV && !id) {
    console.warn('[orderService] Order missing id field, response shape may have changed:', raw)
  }

  return {
    id,
    items: (raw.items ?? []).map(normalizeOrderItem),
    shippingAddress: normalizeShippingAddress(raw.shippingAddress ?? raw.shipping_address),
    paymentMethod,
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    discountAmount,
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

// Transform frontend ShippingAddress to backend shape for the order create payload
function toBackendShippingAddress(addr: ShippingAddress) {
  // Backend expects: { street, city, state, zipCode, country }
  // Combine addressLine1 + addressLine2 into street
  const street = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')
  return {
    street,
    city: addr.city,
    state: addr.state,
    zipCode: addr.postalCode,
    country: 'IN',
  }
}

export type { RawOrderItem, RawShippingAddress }
export { normalizeOrderItem, normalizeShippingAddress }

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  // Transform payload to match backend API shape
  const backendPayload = {
    items: payload.items.map((item) => ({
      product: item.productId, // backend field is "product", not "productId"
      quantity: item.quantity,
    })),
    shippingAddress: toBackendShippingAddress(payload.shippingAddress),
    discountCode: payload.discountCode,
    // paymentMethod is not stored by backend — omitted intentionally
  }

  const { data } = await apiClient.post('/orders', backendPayload)
  return unwrapOrderResponse(data)
}

export async function getOrderById(orderId: string): Promise<Order> {
  const { data } = await apiClient.get(`/orders/${orderId}`)
  return unwrapOrderResponse(data)
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await apiClient.get('/orders')
  return unwrapOrdersResponse(data)
}
