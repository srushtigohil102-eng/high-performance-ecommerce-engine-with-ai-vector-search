import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-gray-900">
            ShopName
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link to="/cart" className="text-sm text-gray-600 hover:text-gray-900">
              Cart
            </Link>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Login
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
