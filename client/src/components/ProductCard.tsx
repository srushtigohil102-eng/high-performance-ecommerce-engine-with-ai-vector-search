import { memo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import { useWishlist } from '../hooks/useWishlist'
import type { Product } from '../types'
import Button from './Button'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'
import StarRating from './StarRating'
import { formatCurrency } from '../utils/formatCurrency'

interface ProductCardProps {
  product: Product
  index?: number
}

function ProductCard({ product, index = 0 }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [isAdded, setIsAdded] = useState(false)
  const outOfStock = (product.stock ?? 0) === 0
  const saved = isInWishlist(product.id)

  const handleNavigate = useCallback(() => {
    navigate(`/product/${product.id}`)
  }, [navigate, product.id])

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      addToCart(product)
      showToast(`${product.name} added to cart!`)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 1500)
    },
    [addToCart, product, showToast],
  )

  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      void toggleWishlist(product)
    },
    [toggleWishlist, product],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate(`/product/${product.id}`)
      }
    },
    [navigate, product.id],
  )

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.02] animate-card-in"
      style={{
        animationDelay: `${index * 40}ms`,
      }}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={handleKeyDown}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-106"
        />
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={saved}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 active:scale-90 ${
            saved
              ? 'border-red-200 bg-white/95 text-red-500 shadow-sm dark:border-red-500/30 dark:bg-red-500/15'
              : 'border-white/60 bg-white/80 text-text-secondary shadow-sm hover:text-red-500 dark:border-white/10 dark:bg-black/40 dark:text-text-secondary dark:hover:text-red-400'
          }`}
        >
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${saved ? 'scale-110 animate-scale-in' : ''}`}
            fill={saved ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            {product.category}
          </span>
          <StockBadge stock={product.stock} />
        </div>
        <h2 className="font-display text-sm font-semibold text-text-primary line-clamp-2 transition-colors duration-200 group-hover:text-primary">
          {product.name}
        </h2>
        <p className="text-lg font-bold text-accent">
          {formatCurrency(product.price)}
        </p>
        {(product.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating
              value={product.rating ?? 0}
              size={14}
              aria-label={`Rated ${product.rating} out of 5`}
            />
            <span className="text-xs font-medium text-text-secondary">
              {product.rating} ({product.numReviews ?? 0})
            </span>
          </div>
        )}
        <Button
          onClick={handleAddToCart}
          disabled={outOfStock || isAdded}
          className={`mt-1 w-full transition-all duration-300 ${
            isAdded
              ? 'bg-success bg-none text-white shadow-md shadow-success/15'
              : ''
          }`}
        >
          {outOfStock ? (
            'Out of Stock'
          ) : isAdded ? (
            <span className="flex items-center justify-center gap-1.5 animate-scale-in">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Added!
            </span>
          ) : (
            'Add to Cart'
          )}
        </Button>
      </div>
    </div>
  )
}

export default memo(ProductCard)
