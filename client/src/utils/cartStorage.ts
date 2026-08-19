import type { CartItem } from '../types'

const STORAGE_KEY = 'shopnest_cart_v1'

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as CartItem).quantity === 'number' &&
        (item as CartItem).quantity > 0 &&
        typeof (item as CartItem).product?.id === 'string',
    )
  } catch {
    return []
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage unavailable (private mode / quota) — cart stays in memory only.
  }
}

export function clearCartStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
