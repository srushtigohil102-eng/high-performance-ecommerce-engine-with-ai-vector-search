/**
 * Cart service — frontend-only (no backend cart API).
 *
 * The backend was designed without a persistent cart: checkout accepts
 * the full item list directly from the frontend. All cart state lives
 * in React context + localStorage. These functions are no-ops that
 * exist to satisfy the CartContext imports without breaking the app.
 *
 * The discount validation uses the real backend endpoint: POST /api/discount/validate
 */

import type { DiscountCode } from '../types'
import { apiClient } from './apiClient'

// ─── Cart sync stubs (no backend cart API) ──────────────────────────────────
// Cart is managed entirely in frontend state (CartContext + localStorage).

export async function fetchCartFromBackend(): Promise<never[]> {
  // No backend cart — return empty so CartContext merges with local state
  return []
}

export async function syncCartToBackend(_items: unknown[]): Promise<void> {
  // No-op — cart lives in frontend only
}

export async function updateCartItemBackend(_productId: string, _quantity: number): Promise<void> {
  // No-op
}

export async function removeCartItemBackend(_productId: string): Promise<void> {
  // No-op
}

export async function removeDiscountBackend(): Promise<void> {
  // No-op — discount is tracked in frontend state only
}

// ─── Discount validation (hits real backend) ─────────────────────────────────
// Backend endpoint: POST /api/discount/validate
// Returns: { code, percentage, message }

export async function applyDiscountBackend(code: string): Promise<DiscountCode> {
  const { data } = await apiClient.post<{ code: string; percentage: number; message: string }>('/discount/validate', { code })

  // Backend returns { code, percentage, message } — map to frontend DiscountCode shape
  return {
    code: data.code ?? code,
    discountAmount: 0, // we don't know the subtotal here; CartContext computes it
    percentage: data.percentage ?? 0,
    description: data.message ?? '',
  }
}

// ─── Cart summary (computed client-side) ─────────────────────────────────────

export async function getCartSummaryBackend(): Promise<never> {
  // Summary is computed client-side in CartContext
  throw new Error('Cart summary is computed client-side')
}
