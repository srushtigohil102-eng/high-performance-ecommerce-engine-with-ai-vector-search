import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

const TITLE_SUFFIX = ' | ShopNest'
const DEFAULT_TITLE = 'ShopNest — High-Performance E-Commerce Engine'

const PAGE_TITLES: Record<string, string> = {
  '/': 'ShopNest — High-Performance E-Commerce Engine',
  '/cart': 'Shopping Cart',
  '/checkout': 'Checkout',
  '/orders': 'My Orders',
  '/login': 'Sign In',
  '/register': 'Create Account',
  '/admin': 'Admin Dashboard',
  '/admin/products': 'Admin — Products',
  '/admin/orders': 'Admin — Orders',
}

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    const base = PAGE_TITLES[location.pathname]
    const searchTitle =
      location.pathname === '/search' ? 'Search Products' : undefined
    document.title = (base ?? searchTitle ?? DEFAULT_TITLE) + TITLE_SUFFIX
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Navbar />
      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
