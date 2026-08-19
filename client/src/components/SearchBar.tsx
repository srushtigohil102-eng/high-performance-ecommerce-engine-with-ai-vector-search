import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { SearchSuggestionsResponse, TrendingSearch } from '../types'
import { getSearchSuggestions, getTrendingSearches } from '../services/productService'
import ProductImage from './ProductImage'
import { formatCurrency } from '../utils/formatCurrency'

interface SearchBarProps {
  loading?: boolean
  className?: string
}

type SuggestionItem =
  | { kind: 'product'; id: string; name: string; category: string; price: number; imageUrl: string }
  | { kind: 'category'; name: string; count: number }

export default function SearchBar({ loading = false, className = '' }: SearchBarProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(currentQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)
  const trendingFetchedRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [trending, setTrending] = useState<TrendingSearch[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setInputValue(currentQuery)
  }, [currentQuery])

  // Close the dropdown whenever a click lands outside the search bar.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Clear any pending debounce on unmount.
  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
  }, [])

  const loadTrending = useCallback(() => {
    if (trendingFetchedRef.current) return
    trendingFetchedRef.current = true
    getTrendingSearches()
      .then(setTrending)
      .catch(() => setTrending([]))
  }, [])

  const fetchSuggestions = useCallback((q: string) => {
    setLoadingSuggestions(true)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      getSearchSuggestions(q)
        .then(setSuggestions)
        .catch(() => setSuggestions(null))
        .finally(() => setLoadingSuggestions(false))
    }, 250)
  }, [])

  const goToQuery = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      setOpen(false)
    },
    [navigate],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      goToQuery(inputValue)
    },
    [inputValue, goToQuery],
  )

  const items = useMemo<SuggestionItem[]>(() => {
    const list: SuggestionItem[] = []
    for (const p of suggestions?.products ?? []) {
      list.push({ kind: 'product', ...p })
    }
    for (const c of suggestions?.categories ?? []) {
      list.push({ kind: 'category', name: c.name, count: c.count })
    }
    return list
  }, [suggestions])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      setActiveIndex(-1)
      const trimmed = value.trim()
      if (trimmed.length >= 2) {
        setOpen(true)
        fetchSuggestions(trimmed)
      } else {
        setOpen(false)
        setSuggestions(null)
      }
    },
    [fetchSuggestions],
  )

  const handleFocus = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed.length >= 2) {
      setOpen(true)
      return
    }
    loadTrending()
    if (trending.length > 0) setOpen(true)
  }, [inputValue, loadTrending, trending.length])

  const handleItemClick = useCallback(
    (item: SuggestionItem) => {
      setOpen(false)
      if (item.kind === 'product') {
        navigate(`/products/${item.id}`)
      } else {
        navigate(`/?category=${encodeURIComponent(item.name)}`)
      }
    },
    [navigate],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          return
        }
        setActiveIndex((i) => Math.min(i + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
      } else if (e.key === 'Escape') {
        setOpen(false)
        setActiveIndex(-1)
      } else if (e.key === 'Enter') {
        const trimmed = inputValue.trim()
        if (!trimmed) return
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault()
          handleItemClick(items[activeIndex])
        }
        // Otherwise fall through to the form's submit handler.
      }
    },
    [open, items, activeIndex, inputValue, handleItemClick],
  )

  const showTrendingView = inputValue.trim().length === 0 && trending.length > 0

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          className="w-full rounded-lg border border-border bg-surface-elevated py-3 pl-10 pr-10 text-sm text-text-primary transition-all duration-300 placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/25 min-h-[44px]"
          aria-label="Search products"
          aria-expanded={open}
          role="combobox"
          aria-autocomplete="list"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('')
              setSuggestions(null)
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 min-w-[44px] justify-center"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-card-in">
          {showTrendingView ? (
            <div className="p-3">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Trending searches
              </p>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t.term}
                    type="button"
                    onClick={() => goToQuery(t.term)}
                    className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-primary transition hover:border-primary hover:text-primary"
                  >
                    {t.term}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingSuggestions ? (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary">
              <svg
                className="h-4 w-4 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching&hellip;
            </div>
          ) : items.length > 0 ? (
            <div>
              {items.some((i) => i.kind === 'product') && (
                <ul role="listbox">
                  {items.map((item, index) =>
                    item.kind === 'product' ? (
                      <li key={`product-${item.id}`} role="option" aria-selected={activeIndex === index}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                            activeIndex === index ? 'bg-surface-elevated' : 'hover:bg-surface-elevated'
                          }`}
                        >
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded border border-border">
                            <ProductImage src={item.imageUrl} alt={item.name} className="h-9 w-9" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                            <p className="truncate text-xs text-text-secondary">
                              {item.category} &middot; {formatCurrency(item.price)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}

              {items.some((i) => i.kind === 'category') && (
                <div className="border-t border-border p-3">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(
                      (item, index) =>
                        item.kind === 'category' && (
                          <button
                            key={`category-${item.name}`}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              activeIndex === index
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-surface-elevated text-text-primary hover:border-primary hover:text-primary'
                            }`}
                          >
                            {item.name} &middot; {item.count}
                          </button>
                        ),
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => goToQuery(inputValue)}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-surface-elevated"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for &lsquo;{inputValue.trim()}&rsquo;
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => goToQuery(inputValue)}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-primary transition hover:bg-surface-elevated"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search for &lsquo;{inputValue.trim()}&rsquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
