import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Smartphone,
  Shirt,
  Home,
  BookOpen,
  Sparkles,
  Dumbbell,
  ShoppingBasket,
  Gamepad2,
  Car,
  HeartPulse,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { getCategories } from '../services/productService'
import type { CategoryCount } from '../types'

// Icons are keyed by the exact category names returned by GET /api/products/categories,
// with a generic fallback for any category added later — the list is never hardcoded.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electronics: Smartphone,
  Clothing: Shirt,
  'Home & Kitchen': Home,
  Books: BookOpen,
  Beauty: Sparkles,
  'Sports & Outdoors': Dumbbell,
  Grocery: ShoppingBasket,
  Toys: Gamepad2,
  Automotive: Car,
  Health: HeartPulse,
}

const DEFAULT_ICON: LucideIcon = Package

export default function CategoryShowcase() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const active = searchParams.get('category') ?? ''
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Navigate to Home filtered by category; clicking the already-active category
  // clears the filter (same toggle behaviour as the old category pills).
  function handleSelect(name: string) {
    navigate(name === active ? '/' : `/?category=${encodeURIComponent(name)}`)
  }

  if (loading) {
    return (
      <section aria-label="Shop by category" className="mb-12">
        <h2 className="mb-4 font-display text-2xl font-bold text-text-primary sm:text-section">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-3 py-4"
            >
              <span className="h-12 w-12 animate-pulse rounded-full bg-surface-elevated" />
              <span className="h-3 w-16 animate-pulse rounded bg-surface-elevated" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section aria-label="Shop by category" className="mb-12">
      <h2 className="mb-4 font-display text-2xl font-bold text-text-primary sm:text-section">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
        {categories.map((category, index) => {
          const Icon = CATEGORY_ICONS[category.name] ?? DEFAULT_ICON
          const isActive = active === category.name
          return (
            <button
              key={category.name}
              type="button"
              onClick={() => handleSelect(category.name)}
              aria-pressed={isActive}
              className={`group flex flex-col items-center gap-3 rounded-xl border bg-surface px-3 py-4 shadow-sm transition-all duration-300 animate-card-in hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl ${
                isActive ? 'border-accent' : 'border-border hover:border-accent'
              }`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ${
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'bg-accent/10 text-accent group-hover:bg-accent/20'
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="text-center text-xs font-medium leading-tight text-text-primary">
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
