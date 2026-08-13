import { memo, useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import type { Product, SearchMethod } from '../types'
import { searchProducts, getProducts } from '../services/productService'

const RESULTS_PER_PAGE = 12

const METHOD_BADGES: Partial<Record<SearchMethod, { label: string; classes: string }>> = {
  text: {
    label: 'Full-text match',
    classes: 'bg-primary/10 text-primary',
  },
  fuzzy: {
    label: 'Fuzzy match',
    classes: 'bg-warning/10 text-warning',
  },
  regex: {
    label: 'Partial match',
    classes: 'bg-accent/10 text-accent',
  },
  vector: {
    label: 'Semantic match',
    classes: 'bg-success/10 text-success',
  },
}

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchMethod, setSearchMethod] = useState<SearchMethod | undefined>(undefined)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([])
      setSearchMethod(undefined)
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
      setSearchMethod(result.searchMethod)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, page])

  // Fetch a few real products for the "Popular" fallback section
  useEffect(() => {
    if (popularProducts.length === 0) {
      getProducts({ limit: 4 }).then((res) => setPopularProducts(res.products)).catch(() => {})
    }
  }, [popularProducts.length])

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const methodBadge = searchMethod ? METHOD_BADGES[searchMethod] : undefined

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-section">
            {query.trim() ? (
              <>Showing results for &lsquo;{query.trim()}&rsquo;</>
            ) : (
              'Search Products'
            )}
          </h1>
          <p className="mt-1.5 flex items-center flex-wrap gap-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI-driven search with typo tolerance
            </span>
            {methodBadge && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${methodBadge.classes}`}>
                {methodBadge.label}
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <ProductGridSkeleton count={RESULTS_PER_PAGE} />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchResults}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : !query.trim() ? (
        <div className="py-12 text-center bg-surface border border-border rounded-xl">
          <p className="mb-2 text-lg font-medium text-text-primary">Enter a search term</p>
          <p className="mb-4 text-sm text-text-secondary">
            Try describing what you&rsquo;re looking for, e.g. &ldquo;warm winter jacket&rdquo;
          </p>
          <Link
            to="/"
            className="text-sm font-medium text-primary underline hover:text-primary-hover"
          >
            Browse all products
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12">
          <div className="mb-8 text-center bg-surface border border-border rounded-xl p-8">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-text-secondary/40"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="mb-2 text-lg font-medium text-text-primary">
              No products found for &lsquo;{query.trim()}&rsquo;
            </p>
            <p className="mb-6 text-sm text-text-secondary">
              Try rephrasing your search or check out some suggestions below.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">Browse All Products</Button>
              </Link>
              <Link to="/?category=Electronics" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Electronics</Button>
              </Link>
              <Link to="/?category=Clothing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Clothing</Button>
              </Link>
              <Link to="/?category=Books" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Books</Button>
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Popular Products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-secondary">
            {total} {total === 1 ? 'result' : 'results'} found
          </p>
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

export default memo(SearchResultsPage)
