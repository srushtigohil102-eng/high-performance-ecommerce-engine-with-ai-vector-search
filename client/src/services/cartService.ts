import type { CartItem } from '../types'
import { apiClient } from './apiClient'

interface BackendCartItem {
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    description: string
    imageUrl: string
    category: string
    stock?: number
  }
}

function normalizeBackendCart(items: BackendCartItem[]): CartItem[] {
  return items.map((item) => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      description: item.product.description,
      imageUrl: item.product.imageUrl,
      category: item.product.category,
      stock: item.product.stock,
    },
    quantity: item.quantity,
  }))
}

export async function fetchCartFromBackend(): Promise<CartItem[]> {
  const { data } = await apiClient.get<BackendCartItem[] | { items: BackendCartItem[] }>('/cart')
  const raw = Array.isArray(data) ? data : data.items ?? []
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
