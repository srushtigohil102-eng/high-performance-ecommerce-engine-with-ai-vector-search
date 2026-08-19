import { memo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../hooks/useWishlist'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductCard from '../components/ProductCard'

function WishlistPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { items, loading } = useWishlist()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/wishlist')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <LoadingSpinner size="md" message="Loading your wishlist..." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
          My Wishlist
          {items.length > 0 && (
            <span className="ml-2 text-sm font-medium text-text-secondary">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center shadow-sm">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-text-secondary/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <p className="mb-2 text-lg font-medium text-text-primary">Your wishlist is empty</p>
          <p className="mb-6 text-sm text-text-secondary">
            Tap the heart on any product to save it here for later.
          </p>
          <Link to="/">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <ProductCard key={item.id} product={item.product} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(WishlistPage)
