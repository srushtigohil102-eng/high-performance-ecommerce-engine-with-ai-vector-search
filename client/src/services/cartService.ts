import type { CartItem, DiscountCode, CartSummary } from '../types'
import { apiClient } from './apiClient'

interface BackendCartItem {
  productId?: string
  product_id?: string
  product?: string
  quantity?: number
  productData?: {
    id?: string
    _id?: string
    name?: string
    price?: number
    description?: string
    imageUrl?: string
    image_url?: string
    category?: string
    stock?: number
  }
}

function normalizeBackendCart(items: BackendCartItem[]): CartItem[] {
  return items.map((item) => {
    const p = item.productData ?? {}
    const id = (item.productId ?? item.product_id ?? item.product ?? p.id ?? p._id ?? '') as string
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1

    if (import.meta.env.DEV && !id) {
      console.warn('[cartService] Cart item missing product id, response shape may have changed:', item)
    }

    return {
      product: {
        id,
        name: p.name ?? 'Unknown Product',
        price: typeof p.price === 'number' ? p.price : 0,
        description: p.description ?? '',
        imageUrl: p.imageUrl ?? p.image_url ?? 'https://placehold.co/200x200?text=Product',
        category: p.category ?? '',
        stock: p.stock,
      },
      quantity,
    }
  })
}

export async function fetchCartFromBackend(): Promise<CartItem[]> {
  const { data } = await apiClient.get<BackendCartItem[] | { items: BackendCartItem[] } | { cart: BackendCartItem[] }>('/cart')
  let raw: BackendCartItem[]
  if (Array.isArray(data)) {
    raw = data
  } else if (data && typeof data === 'object' && 'items' in data) {
    raw = data.items ?? []
  } else if (data && typeof data === 'object' && 'cart' in data) {
    raw = (data as { cart: BackendCartItem[] }).cart ?? []
  } else {
    if (import.meta.env.DEV) {
      console.warn('[cartService] Unexpected cart response shape:', data)
    }
    raw = []
  }
  return normalizeBackendCart(raw)
}

export async function syncCartToBackend(items: CartItem[]): Promise<void> {
  await apiClient.post('/cart', {
    items: items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  })
}

export async function updateCartItemBackend(productId: string, quantity: number): Promise<void> {
  await apiClient.put(`/cart/${productId}`, { quantity })
}

export async function removeCartItemBackend(productId: string): Promise<void> {
  await apiClient.delete(`/cart/${productId}`)
}

export async function applyDiscountBackend(code: string): Promise<DiscountCode> {
  const { data } = await apiClient.post<{ discount: DiscountCode } | DiscountCode>('/cart/discount', { code })
  const discount = (data && typeof data === 'object' && 'discount' in data)
    ? (data as { discount: DiscountCode }).discount
    : data as DiscountCode
  if (import.meta.env.DEV && (!discount || !discount.code)) {
    console.warn('[applyDiscountBackend] Unexpected discount response shape:', data)
  }
  return discount ?? { code, discountAmount: 0, description: '' }
}

export async function removeDiscountBackend(): Promise<void> {
  await apiClient.delete('/cart/discount')
}

export async function getCartSummaryBackend(): Promise<CartSummary> {
  const { data } = await apiClient.get<CartSummary>('/cart/summary')
  return {
    subtotal: typeof data?.subtotal === 'number' ? data.subtotal : 0,
    discountAmount: typeof data?.discountAmount === 'number' ? data.discountAmount : 0,
    total: typeof data?.total === 'number' ? data.total : 0,
    discount: data?.discount ?? null,
  }
}
