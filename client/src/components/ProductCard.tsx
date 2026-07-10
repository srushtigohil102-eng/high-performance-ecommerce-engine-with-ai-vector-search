import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
      onClick={() => navigate(`/product/${product.id}`)}
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/product/${product.id}`)
        }
      }}
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
          {product.category}
        </p>
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h2>
        <p className="text-lg font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            addToCart(product)
          }}
          className="mt-1 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
