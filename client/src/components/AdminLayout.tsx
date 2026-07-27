import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
]

export default function AdminLayout() {
  const { user } = useAuth()

  function linkClass({ isActive }: { isActive: boolean }) {
    return `rounded-lg px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
      isActive
        ? 'bg-gray-900 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-8">
      {/* Mobile: header + horizontal scrollable nav */}
      <div className="mb-4 lg:mb-6">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Admin</h2>
          {user && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {user.name} &middot; {user.role}
            </p>
          )}
        </div>
        <nav className="-mx-4 flex overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex gap-2 lg:flex-col lg:gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="flex gap-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
