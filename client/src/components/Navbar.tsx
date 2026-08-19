import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import SearchBar from './SearchBar'
import Avatar from './Avatar'

export default function Navbar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistItems.length
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [badgeBouncing, setBadgeBouncing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function linkClass({ isActive }: { isActive: boolean }) {
    return `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'font-semibold text-primary'
        : 'text-text-secondary hover:text-primary'
    }`
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  // Handle logout
  function handleLogout() {
    logout()
    closeMobile()
    navigate('/')
  }

  // Scroll listener to update background opacity + shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cart badge bounce animator
  useEffect(() => {
    if (itemCount === 0) return
    setBadgeBouncing(true)
    const timer = setTimeout(() => setBadgeBouncing(false), 300)
    return () => clearTimeout(timer)
  }, [itemCount])

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

  // Morph theme toggle button
  const renderThemeToggle = () => (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors duration-300 hover:bg-surface-elevated hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/45"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative h-5 w-5">
        {/* Sun Icon */}
        <svg
          className={`absolute inset-0 h-5 w-5 transform transition-all duration-500 ease-out ${
            theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
        {/* Moon Icon */}
        <svg
          className={`absolute inset-0 h-5 w-5 transform transition-all duration-500 ease-out ${
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      </div>
    </button>
  )

  return (
    <nav
      className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'border-border/80 bg-surface/85 shadow-sm backdrop-blur-md'
          : 'border-border/40 bg-surface'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-bold text-text-primary" onClick={closeMobile}>
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" aria-hidden="true">
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
              <span
                className={`ml-1.5 inline-flex items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-white ${
                  badgeBouncing ? 'animate-badge-bounce' : ''
                }`}
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}
          <NavLink to="/wishlist" className={`${linkClass} flex items-center gap-1.5`}>
            Wishlist
            {wishlistCount > 0 && (
              <span
                className={`inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white ${
                  badgeBouncing ? 'animate-badge-bounce' : ''
                }`}
                aria-label={`${wishlistCount} items in wishlist`}
              >
                {wishlistCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/account" className={`${linkClass} flex items-center gap-2`}>
              <Avatar name={user?.name ?? 'Me'} size="sm" />
              My Account
            </NavLink>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            </div>
          )}
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          {renderThemeToggle()}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {renderThemeToggle()}
          <button
            ref={buttonRef}
            type="button"
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <span className={`block h-0.5 w-6 bg-text-primary transition-transform duration-350 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-text-primary transition-opacity duration-350 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-text-primary transition-transform duration-350 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div ref={menuRef} id="mobile-menu" className="flex flex-col gap-1 border-t border-border/80 bg-surface px-4 py-4 md:hidden">
          <SearchBar className="mb-3" />
          <NavLink to="/" end className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
            Home
          </NavLink>
          <NavLink to="/cart" className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
            <span>Cart</span>
            {itemCount > 0 && (
              <span className={`inline-flex items-center justify-center rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white ${badgeBouncing ? 'animate-badge-bounce' : ''}`}>
                {itemCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
              My Orders
            </NavLink>
          )}
          <NavLink to="/wishlist" className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className={`inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white ${badgeBouncing ? 'animate-badge-bounce' : ''}`}>
                {wishlistCount}
              </span>
            )}
          </NavLink>
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
              Admin
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink
              to="/account"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              onClick={closeMobile}
            >
              <Avatar name={user?.name ?? 'Me'} size="sm" />
              My Account
            </NavLink>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/register" className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
                Register
              </NavLink>
              <NavLink to="/login" className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary" onClick={closeMobile}>
                Login
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
