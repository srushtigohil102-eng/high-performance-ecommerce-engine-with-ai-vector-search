import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import type { Product } from '../types'
import { getProducts } from '../services/productService'

const PRODUCTS_PER_PAGE = 12

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const category = searchParams.get('category') ?? ''

  const [heroQuery, setHeroQuery] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [categories, setCategories] = useState<string[]>([])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getProducts({
        page,
        limit: PRODUCTS_PER_PAGE,
        category: category || undefined,
      })
      setProducts(result.products)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch {
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, category])

  // Fetch unique categories once on mount
  useEffect(() => {
    getProducts({ limit: 200 })
      .then((result) => {
        const cats = [...new Set(result.products.map((p) => p.category))].sort()
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset to page 1 whenever the category filter changes
  useEffect(() => {
    setPage(1)
  }, [category])

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      setSearchParams(value ? { category: value } : {}, { replace: true })
    },
    [setSearchParams],
  )

  const handleHeroSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = heroQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero banner */}
      <section className="relative mb-12 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-surface to-surface-elevated px-6 py-12 sm:px-12 sm:py-16 shadow-md">
        {/* Floating background mesh blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-70 dark:opacity-40" aria-hidden="true">
          <div className="absolute -top-12 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative">
          <h1 className="mb-4 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-text-primary sm:text-hero leading-tight">
            Everything you need, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">delivered fast</span>
          </h1>
          <p className="mb-8 max-w-xl text-sm text-text-secondary sm:text-base leading-relaxed">
            Browse thousands of products with instant full-text search, typo-tolerant
            matching, and real-time stock updates.
          </p>
          <form
            role="search"
            onSubmit={handleHeroSearch}
            className="mb-8 flex w-full max-w-xl flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="search"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder="Search for anything..."
              aria-label="Search products"
              className="min-h-[44px] w-full flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary shadow-sm transition-all duration-300 placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/25 sm:text-base"
            />
            <Button
              type="submit"
              className="w-full sm:w-auto"
            >
              Search
            </Button>
          </form>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/?category=Electronics" className="sm:w-auto">
              <Button className="w-full sm:w-auto">
                Shop Electronics
              </Button>
            </Link>
            <Link to="/search" className="sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
              >
                Try Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-bold text-text-primary sm:text-section">Products</h2>

        {/* Category filter */}
        <div className="w-full sm:w-auto">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] sm:w-auto"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-text-secondary">
          {total} {total === 1 ? 'product' : 'products'} found
        </p>
      )}

      {loading ? (
        <ProductGridSkeleton count={PRODUCTS_PER_PAGE} />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchProducts}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center bg-surface border border-border rounded-xl">
          <p className="mb-2 text-lg font-medium text-text-primary">No products found</p>
          <p className="mb-4 text-sm text-text-secondary">
            {category
              ? 'Try adjusting your filter or browse all products.'
              : 'No products are available right now. Check back soon!'}
          </p>
          {category && (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-sm font-medium text-primary underline hover:text-primary-hover"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
