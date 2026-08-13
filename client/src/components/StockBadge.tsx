import { memo } from 'react'

interface StockBadgeProps {
  stock?: number
}

function StockBadge({ stock }: StockBadgeProps) {
  if (stock === undefined || stock === null) return null

  if (stock === 0) {
    return (
      <span className="inline-block rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-semibold text-error">
        Out of Stock
      </span>
    )
  }

  if (stock < 5) {
    return (
      <span className="inline-block rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
        Low Stock
      </span>
    )
  }

  return (
    <span className="inline-block rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
      In Stock
    </span>
  )
}

export default memo(StockBadge)
