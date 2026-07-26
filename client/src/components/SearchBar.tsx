import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface SearchBarProps {
  loading?: boolean
  className?: string
}

export default function SearchBar({ loading = false, className = '' }: SearchBarProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(currentQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(currentQuery)
  }, [currentQuery])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (!trimmed) return
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [inputValue, navigate],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const trimmed = inputValue.trim()
        if (!trimmed) return
        navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      }
    },
    [inputValue, navigate],
  )

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
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
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search products..."
        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-10 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
        aria-label="Search products"
      />
      {inputValue && (
        <button
          type="button"
          onClick={() => {
            setInputValue('')
            inputRef.current?.focus()
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
