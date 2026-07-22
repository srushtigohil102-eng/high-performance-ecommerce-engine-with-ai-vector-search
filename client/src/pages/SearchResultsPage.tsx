import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import { mockProducts } from '../data/mockProducts'
import type { Product } from '../types'
import { searchProducts } from '../services/productService'

const POPULAR_PRODUCTS = mockProducts.slice(0, 4)

const RESULTS_PER_PAGE = 12

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const result = await searchProducts(query.trim(), {
        page,
        limit: RESULTS_PER_PAGE,
      })
      setProducts(result.products)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, page])

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {query.trim() ? (
              <>Showing results for &lsquo;{query.trim()}&rsquo;</>
            ) : (
              'Search Products'
            )}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="h-3.5 w-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI-powered semantic search
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Searching products..." />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchResults}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : !query.trim() ? (
        <div className="py-12 text-center">
          <p className="mb-2 text-lg font-medium text-gray-900">Enter a search term</p>
          <p className="mb-4 text-sm text-gray-500">
            Try describing what you&rsquo;re looking for, e.g. &ldquo;warm winter jacket&rdquo;
          </p>
          <Link
            to="/"
            className="text-sm font-medium text-gray-900 underline hover:text-gray-600"
          >
            Browse all products
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12">
          <div className="mb-8 text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="mb-2 text-lg font-medium text-gray-900">
              No products found for &lsquo;{query.trim()}&rsquo;
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Try rephrasing your search or check out some suggestions below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/">
                <Button variant="secondary">Browse All Products</Button>
              </Link>
              <Link to="/?category=Electronics">
                <Button variant="outline">Electronics</Button>
              </Link>
              <Link to="/?category=Clothing">
                <Button variant="outline">Clothing</Button>
              </Link>
              <Link to="/?category=Accessories">
                <Button variant="outline">Accessories</Button>
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Popular Products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {POPULAR_PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {total} {total === 1 ? 'result' : 'results'} found
          </p>
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
