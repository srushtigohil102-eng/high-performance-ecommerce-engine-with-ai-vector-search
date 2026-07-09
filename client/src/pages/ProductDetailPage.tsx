import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import type { Product } from '../types'
import { mockProducts } from '../data/mockProducts'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    setLoading(true)
    setQuantity(1)
    setConfirmation('')

    // Simulate async fetch — swap for real API call next week
    const found = mockProducts.find((p) => p.id === id) ?? null
    setProduct(found)
    setLoading(false)
  }, [id])

  if (loading) return <LoadingSpinner />

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ErrorMessage message="Product not found." />
      </div>
    )
  }

  const currentProduct = product

  function handleAddToCart() {
    addToCart(currentProduct)
    setConfirmation(`${currentProduct.name} added to cart!`)
    setTimeout(() => setConfirmation(''), 2500)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-2xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-sm text-gray-500">
            Category: {product.category}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50"
            >
              &minus;
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-2 w-fit rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Add to Cart
          </button>

          {confirmation && (
            <p className="text-sm font-medium text-green-700">{confirmation}</p>
          )}
        </div>
      </div>
    </div>
  )
}
