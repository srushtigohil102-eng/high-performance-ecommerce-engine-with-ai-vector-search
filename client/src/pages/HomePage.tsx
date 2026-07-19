import { useState, useEffect, useCallback } from 'react'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import type { Product } from '../types'
import { getProducts } from '../services/productService'

const PRODUCTS_PER_PAGE = 12

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [category, setCategory] = useState('')
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

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Products</h1>

      {/* Category filter */}
      <div className="mb-6">
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
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-gray-500">
          {total} {total === 1 ? 'product' : 'products'} found
        </p>
      )}

      {loading ? (
        <LoadingSpinner size="lg" message="Loading products..." />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchProducts}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-2 text-lg font-medium text-gray-900">No products found</p>
          <p className="mb-4 text-sm text-gray-500">
            {category
              ? 'Try adjusting your filter or browse all products.'
              : 'No products are available right now. Check back soon!'}
          </p>
          {category && (
            <button
              type="button"
              onClick={() => setCategory('')}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-600"
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
