import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import SearchBar from './SearchBar'

export default function Navbar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const { isAuthenticated, user, logout } = useAuth()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        closeMobile()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileOpen])

  return (
    <nav className="border-b border-gray-200 bg-white" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NavLink to="/" className="text-xl font-bold text-gray-900" onClick={closeMobile}>
          ShopName
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <SearchBar className="w-64" />
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
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
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
          ref={buttonRef}
          type="button"
          className="flex flex-col gap-1.5 md:hidden min-h-[44px] min-w-[44px] items-center justify-center"
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
        <div ref={menuRef} id="mobile-menu" className="flex flex-col gap-1 border-t border-gray-200 px-4 py-4 md:hidden">
          <SearchBar className="mb-3" />
          <NavLink to="/" end className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobile}>
            Home
          </NavLink>
          <NavLink to="/cart" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobile}>
            Cart
            {itemCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobile}>
              My Orders
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobile}>
              Admin
            </NavLink>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobile}>
              Login
            </NavLink>
          )}
        </div>
      )}
    </nav>
  )
}
