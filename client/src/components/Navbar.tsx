import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NavLink to="/" className="text-xl font-bold text-gray-900">
          ShopName
        </NavLink>
        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Cart
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-xs font-medium text-white">
              0
            </span>
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Login
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
