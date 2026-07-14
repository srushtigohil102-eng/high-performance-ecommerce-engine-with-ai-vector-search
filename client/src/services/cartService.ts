import type { CartItem } from '../types'
import { apiClient } from './apiClient'

/**
 * Stub functions for Week 3 cart/checkout API integration.
 * CartContext currently uses local state only — these will wire up
 * the real backend endpoints once confirmed by the backend dev.
 */

export async function syncCartToBackend(items: CartItem[]): Promise<void> {
  // TODO: Implement when backend cart API is live
  // POST /cart with full cart state
  await apiClient.post('/cart', { items })
}

export async function fetchCartFromBackend(): Promise<CartItem[]> {
  // TODO: Implement when backend cart API is live
  // GET /cart — returns the user's persisted cart
  const { data } = await apiClient.get<CartItem[]>('/cart')
  return data
}
