import { Link } from 'react-router-dom'

const CATEGORY_LINKS = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Beauty',
  'Sports & Outdoors',
]

const SHOP_LINKS = [
  { label: 'Browse Products', to: '/' },
  { label: 'Search', to: '/search' },
  { label: 'Shopping Cart', to: '/cart' },
  { label: 'My Orders', to: '/orders' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-text-primary">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              ShopNest
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
              High-performance e-commerce engine with full-text search, typo-tolerant
              matching, real-time inventory, and lightning-fast Redis caching.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text-primary">
              Shop
            </h3>
            <ul className="space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-secondary transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text-primary">
              Categories
            </h3>
            <ul className="space-y-2">
              {CATEGORY_LINKS.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-text-secondary transition hover:text-primary"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text-primary">
              About ShopNest
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              A full-stack demo store built with React, Express, MongoDB and Redis.
              Every order is validated server-side with atomic inventory updates and
              per-order discount codes.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-secondary">
          &copy; {new Date().getFullYear()} ShopNest. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
