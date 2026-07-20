/* oxlint-disable react(only-export-components) */
import {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { CartItem, Product, DiscountCode, CartSummary } from '../types'
import { useAuth } from '../hooks/useAuth'
import {
  syncCartToBackend,
  fetchCartFromBackend,
  updateCartItemBackend,
  removeCartItemBackend,
  applyDiscountBackend,
  removeDiscountBackend,
} from '../services/cartService'

export interface CartContextValue {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  isLoading: boolean
  updatingItems: Set<string>
  discount: DiscountCode | null
  discountError: string | null
  discountLoading: boolean
  cartSummary: CartSummary
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: () => Promise<void>
  isCheckoutBlocked: boolean
  checkoutBlockReason: string | null
}

export const CartContext = createContext<CartContextValue | null>(null)

interface CartProviderProps {
  children: ReactNode
}

function computeClientSummary(items: CartItem[], discount: DiscountCode | null): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const discountAmount = discount?.discountAmount ?? 0
  return {
    subtotal,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount),
    discount,
  }
}

function getCheckoutBlockReason(items: CartItem[]): string | null {
  for (const item of items) {
    if (item.product.stock === 0) {
      return `"${item.product.name}" is out of stock. Remove it to proceed.`
    }
    if (item.quantity > (item.product.stock ?? Infinity)) {
      return `"${item.product.name}" only has ${item.product.stock} in stock. Adjust quantity to proceed.`
    }
  }
  return null
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [discount, setDiscount] = useState<DiscountCode | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)

  const { isAuthenticated } = useAuth()
  const didSyncRef = useRef(false)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const clientSummary = useMemo(() => computeClientSummary(items, discount), [items, discount])

  const checkoutBlockReason = useMemo(() => getCheckoutBlockReason(items), [items])
  const isCheckoutBlocked = checkoutBlockReason !== null

  const wrapUpdating = useCallback(async (productId: string, fn: () => Promise<void>) => {
    setUpdatingItems((prev) => new Set(prev).add(productId))
    try {
      await fn()
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }, [])

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    let nextItems: CartItem[] = []
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id)
      nextItems = existing
        ? prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...prevItems, { product, quantity }]
      return nextItems
    })

    try {
      await syncCartToBackend(nextItems)
    } catch {
      setItems(itemsRef.current)
    }
  }, [])

  const removeFromCart = useCallback(async (productId: string) => {
    const prevSnapshot = itemsRef.current
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    try {
      await removeCartItemBackend(productId)
    } catch {
      setItems(prevSnapshot)
    }
  }, [])

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const prevSnapshot = itemsRef.current
    setItems((prevItems) =>
      quantity <= 0
        ? prevItems.filter((item) => item.product.id !== productId)
        : prevItems.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    )

    await wrapUpdating(productId, async () => {
      try {
        if (quantity <= 0) {
          await removeCartItemBackend(productId)
        } else {
          await updateCartItemBackend(productId, quantity)
        }
      } catch {
        setItems(prevSnapshot)
      }
    })
  }, [wrapUpdating])

  const clearCart = useCallback(() => {
    setItems([])
    setDiscount(null)
  }, [])

  const applyDiscountCode = useCallback(async (code: string) => {
    setDiscountError(null)
    setDiscountLoading(true)
    try {
      const result = await applyDiscountBackend(code)
      setDiscount(result)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired discount code.'
      setDiscountError(message)
      setDiscount(null)
    } finally {
      setDiscountLoading(false)
    }
  }, [])

  const removeDiscountCode = useCallback(async () => {
    setDiscountLoading(true)
    try {
      await removeDiscountBackend()
      setDiscount(null)
      setDiscountError(null)
    } catch {
      // Keep current state on failure
    } finally {
      setDiscountLoading(false)
    }
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
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      didSyncRef.current = false
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal: clientSummary.subtotal,
      isLoading,
      updatingItems,
      discount,
      discountError,
      discountLoading,
      cartSummary: clientSummary,
      applyDiscountCode,
      removeDiscountCode,
      isCheckoutBlocked,
      checkoutBlockReason,
    }),
    [
      items,
      clientSummary,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isLoading,
      updatingItems,
      discount,
      discountError,
      discountLoading,
      applyDiscountCode,
      removeDiscountCode,
      isCheckoutBlocked,
      checkoutBlockReason,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
