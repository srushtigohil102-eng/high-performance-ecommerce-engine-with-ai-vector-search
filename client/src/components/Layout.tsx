import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import EmailVerificationBanner from './EmailVerificationBanner'

const TITLE_SUFFIX = ' | ShopNest'
const DEFAULT_TITLE = 'ShopNest — High-Performance E-Commerce Engine'

const PAGE_TITLES: Record<string, string> = {
  '/': 'ShopNest — High-Performance E-Commerce Engine',
  '/cart': 'Shopping Cart',
  '/checkout': 'Checkout',
  '/orders': 'My Orders',
  '/account': 'My Account',
  '/login': 'Sign In',
  '/register': 'Create Account',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/verify-email': 'Email Verification',
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
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <EmailVerificationBanner />
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
