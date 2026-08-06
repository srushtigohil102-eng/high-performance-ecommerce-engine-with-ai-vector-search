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
      <section className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-accent px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <h1 className="mb-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
            Everything you need, delivered fast
          </h1>
          <p className="mb-6 max-w-lg text-sm text-white/85 sm:text-base">
            Browse thousands of products with instant full-text search, typo-tolerant
            matching, and real-time stock updates.
          </p>
          <form
            role="search"
            onSubmit={handleHeroSearch}
            className="mb-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              type="search"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder="Search for anything..."
              aria-label="Search products"
              className="min-h-[44px] w-full flex-1 rounded-lg border border-white/40 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/70 sm:text-base"
            />
            <Button
              type="submit"
              className="w-full bg-white text-primary! hover:bg-indigo-50 hover:shadow-md hover:-translate-y-0.5 sm:w-auto"
            >
              Search
            </Button>
          </form>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/?category=Electronics" className="sm:w-auto">
              <Button className="w-full bg-white text-primary! hover:bg-indigo-50 hover:shadow-md hover:-translate-y-0.5 sm:w-auto">
                Shop Electronics
              </Button>
            </Link>
            <Link to="/search" className="sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-white/60 text-white hover:bg-white/10 focus:ring-white sm:w-auto"
              >
                Try Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Products</h2>

        {/* Category filter */}
        <div className="w-full sm:w-auto">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-primary dark:focus:ring-primary"
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
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="py-12 text-center">
          <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No products found</p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {category
              ? 'Try adjusting your filter or browse all products.'
              : 'No products are available right now. Check back soon!'}
          </p>
          {category && (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
