import { memo } from 'react'

interface StockBadgeProps {
  stock?: number
}

function StockBadge({ stock }: StockBadgeProps) {
  if (stock === undefined || stock === null) return null

  if (stock === 0) {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Out of Stock
      </span>
    )
  }

  if (stock < 5) {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Low Stock
      </span>
    )
  }

  return (
    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      In Stock
    </span>
  )
}

export default memo(StockBadge)
