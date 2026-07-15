import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import type { Product } from '../types'
import Button from './Button'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const outOfStock = (product.stock ?? 0) === 0

  const handleNavigate = useCallback(() => {
    navigate(`/product/${product.id}`)
  }, [navigate, product.id])

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      addToCart(product)
    },
    [addToCart, product],
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
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
      onClick={handleNavigate}
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={handleKeyDown}
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
            {product.category}
          </p>
          <StockBadge stock={product.stock} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h2>
        <p className="text-lg font-bold text-gray-900">
          ${product.price.toFixed(2)}
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
