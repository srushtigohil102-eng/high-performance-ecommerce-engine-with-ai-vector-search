import { memo, useCallback, useState } from 'react'
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
  index?: number
}

function ProductCard({ product, index = 0 }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [isAdded, setIsAdded] = useState(false)
  const outOfStock = (product.stock ?? 0) === 0

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
      <div className="aspect-square overflow-hidden bg-surface-elevated">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-106"
        />
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
