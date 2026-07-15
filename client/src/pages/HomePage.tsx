import { useState, useEffect, useCallback, useRef, memo } from 'react'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import type { Product } from '../types'
import { getProducts } from '../services/productService'
import { useDebounce } from '../hooks/useDebounce'

const PRODUCTS_PER_PAGE = 12

function HomePageInner() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // --- Search (placeholder for AI semantic search in Week 3) ---
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getProducts({
        page,
        limit: PRODUCTS_PER_PAGE,
        category: category || undefined,
        search: debouncedSearch || undefined,
      })
      setProducts(result.products)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch {
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, category, debouncedSearch])

  // Fetch unique categories once on mount
  useEffect(() => {
    getProducts({ limit: 200 })
      .then((result) => {
        const cats = [...new Set(result.products.map((p) => p.category))].sort()
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Detect filter changes and reset page before fetching, avoiding redundant API calls
  const prevFiltersRef = useRef({ category: '', search: '' })

  useEffect(() => {
    const prev = prevFiltersRef.current
    const filtersChanged = prev.category !== category || prev.search !== debouncedSearch

    if (filtersChanged) {
      prevFiltersRef.current = { category, search: debouncedSearch }
      setPage(1)
      return
    }

    prevFiltersRef.current = { category, search: debouncedSearch }
    fetchProducts()
  }, [page, category, debouncedSearch, fetchProducts])

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Products</h1>

      {/* Filters & Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Category filter */}
        <select
          value={category}
          onChange={handleCategoryChange}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Search input */}
        {/* Placeholder for AI semantic search — real semantic search UI coming in Week 3
            once the AI dev's vector search endpoint is ready. For now this is a simple
            text filter by product name/description via query param or client-side fallback. */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 sm:w-72"
          aria-label="Search products"
        />
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-gray-500">
          {total} {total === 1 ? 'product' : 'products'} found
        </p>
      )}

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchProducts}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No products found.</p>
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

const HomePage = memo(HomePageInner)
export default HomePage
