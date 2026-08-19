import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/audit', label: 'Audit Log' },
]

export default function AdminLayout() {
  const { user } = useAuth()

  function linkClass({ isActive }: { isActive: boolean }) {
    return `rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
      isActive
        ? 'bg-primary text-white shadow-sm'
        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
    }`
  }

  function renderNavLinks() {
    return NAV_ITEMS.map((item) => (
      <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
        {item.label}
      </NavLink>
    ))
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-8">
      {/* Mobile: header + horizontal scrollable nav */}
      <div className="mb-4 lg:mb-6">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-text-primary">Admin</h2>
            <NavLink
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
              View Store
            </NavLink>
          </div>
          {user && (
            <p className="mt-1 truncate text-xs text-text-secondary">
              {user.name} &middot; {user.role}
            </p>
          )}
        </div>
        <nav className="-mx-4 flex overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0 thin-scrollbar">
          <div className="flex gap-2 lg:flex-col lg:gap-1">
            {renderNavLinks()}
          </div>
        </nav>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="flex gap-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="flex flex-col gap-1">
            {renderNavLinks()}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
