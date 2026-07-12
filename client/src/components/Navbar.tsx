import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const { isAuthenticated, logout } = useAuth()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [mobileOpen, setMobileOpen] = useState(false)

  function linkClass({ isActive }: { isActive: boolean }) {
    return `text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  function handleLogout() {
    logout()
    closeMobile()
    navigate('/')
  }

  return (
    <nav className="border-b border-gray-200 bg-white" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NavLink to="/" className="text-xl font-bold text-gray-900" onClick={closeMobile}>
          ShopName
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            Cart
            {itemCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-xs font-medium text-white" aria-label={`${itemCount} items in cart`}>
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </div>

        {/* Hamburger button */}
        <button
          type="button"
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span className={`block h-0.5 w-6 bg-gray-900 transition-transform ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-900 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-900 transition-transform ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div id="mobile-menu" className="flex flex-col gap-2 border-t border-gray-200 px-4 py-4 md:hidden">
          <NavLink to="/" end className={linkClass} onClick={closeMobile}>
            Home
          </NavLink>
          <NavLink to="/cart" className={linkClass} onClick={closeMobile}>
            Cart
            {itemCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-xs font-medium text-white">
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-left text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={linkClass} onClick={closeMobile}>
              Login
            </NavLink>
          )}
        </div>
      )}
    </nav>
  )
}
