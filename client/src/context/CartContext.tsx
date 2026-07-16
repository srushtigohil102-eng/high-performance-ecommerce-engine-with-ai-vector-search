import { createContext, useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { useAuth } from '../hooks/useAuth'
import {
  syncCartToBackend,
  fetchCartFromBackend,
  updateCartItemBackend,
  removeCartItemBackend,
} from '../services/cartService'

export interface CartContextValue {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
}

export const CartContext = createContext<CartContextValue | null>(null)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const { isAuthenticated } = useAuth()
  const didSyncRef = useRef(false)

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  )

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    const prev = items
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id)
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...prevItems, { product, quantity }]
    })

    try {
      const next = prev.find((i) => i.product.id === product.id)
        ? prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { product, quantity }]
      await syncCartToBackend(next)
    } catch {
      setItems(prev)
    }
  }, [items])

  const removeFromCart = useCallback(async (productId: string) => {
    const prev = items
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    try {
      await removeCartItemBackend(productId)
    } catch {
      setItems(prev)
    }
  }, [items])

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const prev = items
    setItems((prevItems) =>
      quantity <= 0
        ? prevItems.filter((item) => item.product.id !== productId)
        : prevItems.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    )

    try {
      if (quantity <= 0) {
        await removeCartItemBackend(productId)
      } else {
        await updateCartItemBackend(productId, quantity)
      }
    } catch {
      setItems(prev)
    }
  }, [items])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  useEffect(() => {
    if (!isAuthenticated || didSyncRef.current) return

    fetchCartFromBackend()
      .then((remoteItems) => {
        if (remoteItems.length === 0) {
          didSyncRef.current = true
          return
        }
        setItems((localItems) => {
          const merged = [...localItems]
          for (const remote of remoteItems) {
            const existing = merged.find((i) => i.product.id === remote.product.id)
            if (existing) {
              existing.quantity = Math.max(existing.quantity, remote.quantity)
            } else {
              merged.push(remote)
            }
          }
          syncCartToBackend(merged).catch(() => {})
          return merged
        })
        didSyncRef.current = true
      })
      .catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      didSyncRef.current = false
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }),
    [items, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
