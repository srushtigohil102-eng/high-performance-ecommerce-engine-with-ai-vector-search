import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import type { Product } from '../types'
import { getProductById, getProducts } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductImage from '../components/ProductImage'
import ProductCard from '../components/ProductCard'
import StockBadge from '../components/StockBadge'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const { showToast } = useToast()

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

  const outOfStock = useMemo(
    () => (product?.stock ?? 0) === 0,
    [product?.stock],
  )

  const handleAddToCart = useCallback(() => {
    if (!product) return
    addToCart(product, quantity)
    showToast(`${product.name} added to cart!`)
  }, [product, quantity, addToCart, showToast])

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
        <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Product Not Found</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
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
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-gray-900 dark:hover:text-white">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/?category=${encodeURIComponent(product.category)}`}
          className="transition hover:text-gray-900 dark:hover:text-white"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-gray-900 dark:text-white">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{product.name}</h1>
            <StockBadge stock={product.stock} />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(product.price)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Category: {product.category}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Qty:</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock}
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              &minus;
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              disabled={outOfStock || quantity >= (product.stock ?? Infinity)}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="mt-2 w-full sm:w-fit"
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">You may also like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
