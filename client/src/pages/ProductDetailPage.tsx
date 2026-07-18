import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import type { Product } from '../types'
import { getProductById } from '../services/productService'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductImage from '../components/ProductImage'
import StockBadge from '../components/StockBadge'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
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
        <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Product Not Found</h2>
          <p className="mb-4 text-sm text-gray-600">
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
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <StockBadge stock={product.stock} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-sm text-gray-600">
            Category: {product.category}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              &minus;
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              disabled={outOfStock || quantity >= (product.stock ?? Infinity)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="mt-2 w-fit"
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
