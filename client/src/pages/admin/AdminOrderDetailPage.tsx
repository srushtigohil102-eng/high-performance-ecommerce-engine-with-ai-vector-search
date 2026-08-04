import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminOrderById, updateOrderStatus } from '../../services/adminService'
import { useToast } from '../../hooks/useToast'
import { formatCurrency } from '../../utils/formatCurrency'
import type { AdminOrder, OrderStatus } from '../../types'
import Button from '../../components/Button'
import ErrorMessage from '../../components/ErrorMessage'
import ProductImage from '../../components/ProductImage'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
]

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  mock_card: 'Card Payment (Mock)',
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError('')
      const data = await getAdminOrderById(orderId)
      setOrder(data)
    } catch {
      setError('Unable to load order details.')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order || newStatus === order.status) return
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(order.id, newStatus)
      setOrder(updated)
      showToast(`Order status updated to ${newStatus}`)
    } catch {
      showToast('Failed to update order status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <LoadingSpinner size="md" message="Loading order details..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <ErrorMessage message={error ?? 'Order not found.'}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={fetchOrder}>Retry</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/orders')}>
              Back to Orders
            </Button>
          </div>
        </ErrorMessage>
      </div>
    )
  }

  const shipping = order.shippingAddress

  return (
    <div className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={() => navigate('/admin/orders')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Orders
      </button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Status Update */}
      <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900">
        <label htmlFor="status-select" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Update Status
        </label>
        <div className="flex items-center gap-3">
          <select
            id="status-select"
            defaultValue={order.status}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            disabled={updating}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {updating && <span className="text-sm text-gray-500 dark:text-gray-400">Updating...</span>}
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Info (admin-only) */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Customer
          </h2>
          <div className="text-sm text-gray-900 dark:text-white">
            <p className="font-medium">{order.customerName}</p>
            <p>{order.customerEmail}</p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Items</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Qty: {item.quantity} &times; {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Discount ({order.discountCode})</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  &minus;{formatCurrency(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Shipping Address
            </h2>
            <div className="text-sm text-gray-900 dark:text-white">
              <p className="font-medium">{shipping.fullName}</p>
              <p>{shipping.addressLine1}</p>
              {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
              <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{shipping.phone}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Payment Method
            </h2>
            <div className="text-sm text-gray-900 dark:text-white">
              <p>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
