import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getAdminUserById } from '../../services/adminService'
import type { AdminUserDetail } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDateTime'

export default function AdminCustomerDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUser = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const result = await getAdminUserById(userId)
      setData(result)
    } catch {
      setError('Failed to load customer.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (loading) return <LoadingSpinner size="md" message="Loading customer..." />
  if (error) return <ErrorMessage message={error}><Button onClick={fetchUser}>Retry</Button></ErrorMessage>
  if (!data) return null

  const { user, orders } = data

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/customers" className="text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          &larr; Back to Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
          <p className="mt-1 text-lg font-bold capitalize text-gray-900 dark:text-white">{user.role}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
          <p className="mt-1 text-lg font-bold capitalize text-gray-900 dark:text-white">
            {user.emailVerified ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{data.orderCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalSpent)}</p>
        </div>
      </div>

      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Joined {formatDateTime(user.createdAt)}</p>

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => navigate(`/admin/orders/${order.id}`)}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-900 dark:text-white">#{order.id}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(order.createdAt)} &middot; {order.items.length} item{order.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
