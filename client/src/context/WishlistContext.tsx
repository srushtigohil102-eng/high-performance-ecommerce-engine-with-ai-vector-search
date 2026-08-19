import {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { WishlistItem, Product } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/wishlistService'

export interface WishlistContextValue {
  items: WishlistItem[]
  loading: boolean
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (product: Product) => Promise<void>
  removeItem: (productId: string) => Promise<void>
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)

interface WishlistProviderProps {
  children: ReactNode
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const isInWishlist = useCallback(
    (productId: string) => itemsRef.current.some((item) => item.product.id === productId),
    [],
  )

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true)
      const remote = await getWishlist()
      setItems(remote)
    } catch {
      showToast('Could not load your wishlist.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Load when the user logs in; clear when they log out.
  useEffect(() => {
    if (isAuthenticated) {
      void loadWishlist()
    } else {
      setItems([])
      setLoading(false)
    }
  }, [isAuthenticated, loadWishlist])

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!isAuthenticated) {
        showToast('Please log in to save items to your wishlist', 'info')
        navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      const inList = itemsRef.current.some((item) => item.product.id === product.id)

      if (inList) {
        const prevSnapshot = itemsRef.current
        setItems((prev) => prev.filter((item) => item.product.id !== product.id))
        try {
          await removeFromWishlist(product.id)
          showToast('Removed from wishlist')
        } catch {
          setItems(prevSnapshot)
          showToast('Failed to remove from wishlist', 'error')
        }
        return
      }

      const optimistic: WishlistItem = {
        id: `pending-${product.id}`,
        product,
        createdAt: new Date().toISOString(),
      }
      setItems((prev) => [...prev, optimistic])
      try {
        const saved = await addToWishlist(product.id)
        setItems((prev) => prev.map((item) => (item.id === optimistic.id ? saved : item)))
        showToast('Added to wishlist')
      } catch {
        setItems((prev) => prev.filter((item) => item.id !== optimistic.id))
        showToast('Failed to add to wishlist', 'error')
      }
    },
    [isAuthenticated, navigate, showToast],
  )

  const removeItem = useCallback(
    async (productId: string) => {
      const prevSnapshot = itemsRef.current
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
      try {
        await removeFromWishlist(productId)
      } catch {
        setItems(prevSnapshot)
        showToast('Failed to remove from wishlist', 'error')
      }
    },
    [showToast],
  )

  const value = useMemo(
    () => ({ items, loading, isInWishlist, toggleWishlist, removeItem }),
    [items, loading, isInWishlist, toggleWishlist, removeItem],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
