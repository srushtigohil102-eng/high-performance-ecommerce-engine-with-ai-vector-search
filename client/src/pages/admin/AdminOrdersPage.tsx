import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOrders } from '../../services/adminService'
import type { AdminOrder, OrderStatus } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import { formatCurrency } from '../../utils/formatCurrency'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminOrders({ status: statusFilter || undefined })
      setOrders(data)
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) return <LoadingSpinner size="md" message="Loading orders..." />
  if (error) return <ErrorMessage message={error}><Button onClick={fetchOrders}>Retry</Button></ErrorMessage>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 min-h-[44px] sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:shadow-sm min-h-[44px] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-gray-900 dark:text-white">#{order.id}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{order.customerName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(order.createdAt)} &middot; {order.customerEmail}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
