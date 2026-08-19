import { useContext } from 'react'
import { WishlistContext } from '../context/WishlistContext'
import type { WishlistContextValue } from '../context/WishlistContext'

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
