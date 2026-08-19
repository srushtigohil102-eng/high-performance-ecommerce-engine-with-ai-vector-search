import { apiClient } from './apiClient'
import { normalizeProduct } from './productService'
import type { WishlistItem, Product } from '../types'

interface RawWishlistItem {
  id?: string
  _id?: string
  product?: Product | string
  createdAt?: string
}

function normalizeWishlistItem(raw: RawWishlistItem): WishlistItem {
  const productRaw =
    raw.product && typeof raw.product === 'object' ? (raw.product as Product) : undefined
  return {
    id: raw.id ?? raw._id ?? '',
    product: productRaw
      ? normalizeProduct(productRaw)
      : {
          id: typeof raw.product === 'string' ? raw.product : '',
          name: 'Unavailable product',
          price: 0,
          description: '',
          imageUrl: 'https://placehold.co/200x200?text=Product',
          category: '',
          stock: 0,
        },
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await apiClient.get<RawWishlistItem[]>('/wishlist')
  return (data ?? []).map(normalizeWishlistItem)
}

export async function addToWishlist(productId: string): Promise<WishlistItem> {
  const { data } = await apiClient.post<RawWishlistItem>(`/wishlist/${productId}`)
  return normalizeWishlistItem(data)
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productId}`)
}
