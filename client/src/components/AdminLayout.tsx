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
    return `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-gray-900 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <aside className="w-56 flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Admin</h2>
          {user && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {user.name} &middot; {user.role}
            </p>
          )}
        </div>
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
  )
}
