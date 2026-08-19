import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import { useWishlist } from '../hooks/useWishlist'
import type { Product } from '../types'
import { getProductById, getProducts } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductImage from '../components/ProductImage'
import ProductCard from '../components/ProductCard'
import ReviewSection from '../components/ReviewSection'
import StarRating from '../components/StarRating'
import StockBadge from '../components/StockBadge'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { isInWishlist, toggleWishlist } = useWishlist()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)

  const fetchProduct = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const found = await getProductById(id)
      setProduct(found)
      if (found) {
        const sameCategory = await getProducts({ category: found.category, limit: 5 })
        setRelated(sameCategory.products.filter((p) => p.id !== found.id).slice(0, 4))
      } else {
        setRelated([])
      }
    } catch {
      setError('Failed to load product. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setQuantity(1)
    fetchProduct()
  }, [fetchProduct])

  // Silently re-fetch the product after a review write so the rating summary
  // stays in sync without flashing the full-page spinner.
  const refreshProduct = useCallback(async () => {
    if (!id) return
    try {
      const found = await getProductById(id)
      setProduct(found)
    } catch {
      // Keep the current product on failure
    }
  }, [id])

  const outOfStock = useMemo(
    () => (product?.stock ?? 0) === 0,
    [product?.stock],
  )

  const handleAddToCart = useCallback(() => {
    if (!product) return
    addToCart(product, quantity)
    showToast(`${product.name} added to cart!`)
  }, [product, quantity, addToCart, showToast])

  const handleToggleWishlist = useCallback(() => {
    if (!product) return
    void toggleWishlist(product)
  }, [product, toggleWishlist])

  const saved = product ? isInWishlist(product.id) : false

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ErrorMessage message={error}>
          <Button onClick={fetchProduct}>Retry</Button>
        </ErrorMessage>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <h2 className="mb-2 font-display text-lg font-bold text-text-primary">Product Not Found</h2>
          <p className="mb-4 text-sm text-text-secondary">
            The product you're looking for doesn't exist or may have been removed.
          </p>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/?category=${encodeURIComponent(product.category)}`}
          className="transition hover:text-primary"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-text-primary">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{product.name}</h1>
            <StockBadge stock={product.stock} />
          </div>
          <p className="text-2xl font-bold text-accent">
            {formatCurrency(product.price)}
          </p>
          {(product.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating
                value={product.rating ?? 0}
                size={16}
                aria-label={`Rated ${product.rating} out of 5`}
              />
              <span className="text-xs font-medium text-text-secondary">
                {product.rating} ({product.numReviews ?? 0} review{product.numReviews === 1 ? '' : 's'})
              </span>
            </div>
          )}
          <p className="text-sm text-text-secondary sm:text-base leading-relaxed">{product.description}</p>
          <p className="text-sm text-text-secondary">
            Category: <span className="font-semibold text-text-primary">{product.category}</span>
          </p>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-secondary">Qty:</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock}
              aria-label="Decrease quantity"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg text-text-secondary hover:bg-surface-elevated transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              &minus;
            </button>
            <span className="w-8 text-center text-sm font-medium text-text-primary" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              disabled={outOfStock || quantity >= (product.stock ?? Infinity)}
              aria-label="Increase quantity"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg text-text-secondary hover:bg-surface-elevated transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-full sm:w-fit"
            >
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={saved}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                saved
                  ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
                  : 'border-border bg-surface text-text-primary hover:bg-surface-elevated'
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
              {saved ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} onReviewsChanged={refreshProduct} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl font-bold text-text-primary">You may also like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
