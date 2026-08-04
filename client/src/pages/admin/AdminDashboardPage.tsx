import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboardStats } from '../../services/adminService'
import type { AdminDashboardStats } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import { formatCurrency } from '../../utils/formatCurrency'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminDashboardStats()
      setStats(data)
    } catch {
      setError('Failed to load dashboard stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) return <LoadingSpinner size="md" message="Loading dashboard..." />
  if (error) return <ErrorMessage message={error}><Button onClick={fetchStats}>Retry</Button></ErrorMessage>
  if (!stats) return null

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { label: 'Total Orders', value: stats.totalOrders, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    { label: 'Low Stock Items', value: stats.lowStockProducts, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-lg border border-gray-200 p-5 dark:border-gray-800 ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Links</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/admin/products"
          className="flex items-center gap-4 rounded-lg border border-gray-200 p-5 transition hover:border-gray-900 hover:shadow-sm dark:border-gray-800 dark:hover:border-gray-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Product Management</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, and delete products</p>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="flex items-center gap-4 rounded-lg border border-gray-200 p-5 transition hover:border-gray-900 hover:shadow-sm dark:border-gray-800 dark:hover:border-gray-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Order Management</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">View and update order statuses</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
