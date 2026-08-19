import { memo, useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  className?: string
  'aria-label'?: string
}

function StarIcon({ fill, size }: { fill: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`transition-colors duration-150 ${fill ? 'text-accent' : 'text-text-secondary/30'}`}
    >
      <path
        fill="currentColor"
        d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.1l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6z"
      />
    </svg>
  )
}

function StarRating({ value, onChange, size = 16, className = '', 'aria-label': ariaLabel }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'

  if (!interactive) {
    const percent = (index: number) => Math.max(0, Math.min(1, value - index)) * 100
    return (
      <div
        className={`flex items-center gap-0.5 ${className}`}
        role="img"
        aria-label={ariaLabel ?? `Rated ${value} out of 5`}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const pct = percent(i)
          if (pct <= 0) return <StarIcon key={i} fill={false} size={size} />
          if (pct >= 100) return <StarIcon key={i} fill={true} size={size} />
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <span className="absolute inset-0">
                <StarIcon fill={false} size={size} />
              </span>
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
                <StarIcon fill={true} size={size} />
              </span>
            </span>
          )
        })}
      </div>
    )
  }

  const active = hover || value
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label={ariaLabel ?? 'Rating'}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className="rounded p-0.5 transition-transform duration-100 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
        >
          <StarIcon fill={i <= active} size={size} />
        </button>
      ))}
    </div>
  )
}

export default memo(StarRating)
