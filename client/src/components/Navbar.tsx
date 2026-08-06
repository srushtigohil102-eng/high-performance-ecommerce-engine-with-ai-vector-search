import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import SearchBar from './SearchBar'

export default function Navbar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function linkClass({ isActive }: { isActive: boolean }) {
    return `text-sm ${isActive ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`
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
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white" onClick={closeMobile}>
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          ShopNest
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
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-xs font-medium text-white dark:bg-gray-100 dark:text-gray-900" aria-label={`${itemCount} items in cart`}>
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
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            </>
          )}
        </div>

        {/* Right controls (mobile): theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
          <button
            ref={buttonRef}
            type="button"
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <span className={`block h-0.5 w-6 bg-gray-900 transition-transform dark:bg-gray-100 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-gray-900 transition-opacity dark:bg-gray-100 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-gray-900 transition-transform dark:bg-gray-100 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div ref={menuRef} id="mobile-menu" className="flex flex-col gap-1 border-t border-gray-200 px-4 py-4 md:hidden dark:border-gray-800">
          <SearchBar className="mb-3" />
          <NavLink to="/" end className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
            Home
          </NavLink>
          <NavLink to="/cart" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
            Cart
            {itemCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
              My Orders
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
              Admin
            </NavLink>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/register" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
                Register
              </NavLink>
              <NavLink to="/login" className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={closeMobile}>
                Login
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
