import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import type { Product } from '../types'
import Button from './Button'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'
import { formatCurrency } from '../utils/formatCurrency'

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const outOfStock = (product.stock ?? 0) === 0

  const handleNavigate = useCallback(() => {
    navigate(`/product/${product.id}`)
  }, [navigate, product.id])

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      addToCart(product)
      showToast(`${product.name} added to cart!`)
    },
    [addToCart, product, showToast],
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
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={handleKeyDown}
    >
      <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            {product.category}
          </p>
          <StockBadge stock={product.stock} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 dark:text-gray-100">
          {product.name}
        </h2>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(product.price)}
        </p>
        <Button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-1 w-full"
        >
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  )
}

export default memo(ProductCard)
