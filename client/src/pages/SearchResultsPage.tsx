import { memo, useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import type { Product, SearchMethod, SearchSort, TrendingSearch } from '../types'
import { searchProducts, getProducts, getCategories, getTrendingSearches } from '../services/productService'

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

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A\u2013Z' },
]

const VALID_SORTS = SORT_OPTIONS.map((o) => o.value)

const formatMoney = (cents: number): string =>
  `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const minPrice = parseFloat(searchParams.get('minPrice') ?? '')
  const maxPrice = parseFloat(searchParams.get('maxPrice') ?? '')
  const inStock = searchParams.get('inStock') === 'true'
  const sortParam = searchParams.get('sort') ?? 'relevance'
  const sort: SearchSort = (VALID_SORTS as string[]).includes(sortParam)
    ? (sortParam as SearchSort)
    : 'relevance'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchMethod, setSearchMethod] = useState<SearchMethod | undefined>(undefined)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [trending, setTrending] = useState<TrendingSearch[]>([])

  const updateParam = useCallback(
    (key: string, value: string | number | boolean | null | undefined) => {
      const next = new URLSearchParams(searchParams)
      if (value === undefined || value === null || value === '' || value === false) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

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
        category: category || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
        inStock: inStock || undefined,
        sort,
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
  }, [query, page, category, minPrice, maxPrice, inStock, sort])

  // Fetch a few real products for the "Popular" fallback section
  useEffect(() => {
    if (popularProducts.length === 0) {
      getProducts({ limit: 4 }).then((res) => setPopularProducts(res.products)).catch(() => {})
    }
  }, [popularProducts.length])

  // Category options and trending searches for the filter bar / empty states
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getTrendingSearches().then(setTrending).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query, category, minPrice, maxPrice, inStock, sort])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const methodBadge = searchMethod ? METHOD_BADGES[searchMethod] : undefined
  const hasQuery = query.trim().length > 0

  const hasActiveFilters =
    category.length > 0 ||
    Number.isFinite(minPrice) ||
    Number.isFinite(maxPrice) ||
    inStock ||
    sort !== 'relevance'

  const clearAllFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    next.delete('minPrice')
    next.delete('maxPrice')
    next.delete('inStock')
    next.delete('sort')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const priceMinValue = Number.isFinite(minPrice) ? String(minPrice / 100) : ''
  const priceMaxValue = Number.isFinite(maxPrice) ? String(maxPrice / 100) : ''

  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = []
  if (category) {
    activeFilterChips.push({ key: 'category', label: category, onRemove: () => updateParam('category', null) })
  }
  if (Number.isFinite(minPrice)) {
    activeFilterChips.push({
      key: 'minPrice',
      label: `From ${formatMoney(minPrice)}`,
      onRemove: () => updateParam('minPrice', null),
    })
  }
  if (Number.isFinite(maxPrice)) {
    activeFilterChips.push({
      key: 'maxPrice',
      label: `Up to ${formatMoney(maxPrice)}`,
      onRemove: () => updateParam('maxPrice', null),
    })
  }
  if (inStock) {
    activeFilterChips.push({ key: 'inStock', label: 'In stock', onRemove: () => updateParam('inStock', null) })
  }
  if (sort !== 'relevance') {
    const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label
    activeFilterChips.push({ key: 'sort', label: sortLabel ?? 'Sort', onRemove: () => updateParam('sort', null) })
  }

  const TrendingChips = () =>
    trending.length > 0 ? (
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Trending searches
        </p>
        <div className="flex flex-wrap gap-2">
          {trending.map((t) => (
            <Link
              key={t.term}
              to={`/search?q=${encodeURIComponent(t.term)}`}
              className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-primary transition hover:border-primary hover:text-primary"
            >
              {t.term}
            </Link>
          ))}
        </div>
      </div>
    ) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-section">
            {hasQuery ? (
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

      {hasQuery && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
              Category
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value || null)}
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
              Min price
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceMinValue}
                onChange={(e) => updateParam('minPrice', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                placeholder="$0"
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                aria-label="Minimum price"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
              Max price
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceMaxValue}
                onChange={(e) => updateParam('maxPrice', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                placeholder="$100"
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                aria-label="Maximum price"
              />
            </label>

            <label className="flex items-end gap-2 pb-2.5 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked || null)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                aria-label="In stock only"
              />
              In stock only
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
              Sort by
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value === 'relevance' ? null : e.target.value)}
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                aria-label="Sort results"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="rounded-full p-0.5 transition hover:bg-primary/20"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-text-secondary underline hover:text-text-primary"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton count={RESULTS_PER_PAGE} />
      ) : error ? (
        <div className="py-8">
          <ErrorMessage message={error}>
            <Button onClick={fetchResults}>Retry</Button>
          </ErrorMessage>
        </div>
      ) : !hasQuery ? (
        <div className="py-12">
          <div className="text-center bg-surface border border-border rounded-xl p-8">
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
          <div className="mt-8">
            <TrendingChips />
          </div>
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
            {hasActiveFilters && (
              <div className="mb-6">
                <Button variant="secondary" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
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

          <TrendingChips />

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
