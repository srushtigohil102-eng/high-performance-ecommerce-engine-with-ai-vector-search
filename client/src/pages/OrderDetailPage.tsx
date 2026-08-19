import { memo, useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getOrderById, cancelOrder, reorder } from '../services/orderService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import ProductImage from '../components/ProductImage'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Order, OrderStatus } from '../types'

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  mock_card: 'Card Payment (Mock)',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

function capitalize(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError('')
      const data = await getOrderById(orderId)
      setOrder(data)
    } catch {
      setError('Unable to load order details.')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/orders/${orderId ?? ''}`)}`)
      return
    }

    fetchOrder()
  }, [isAuthenticated, navigate, fetchOrder, orderId])

  const isCancellable = order?.status === 'pending' || order?.status === 'confirmed'

  const handleCancel = useCallback(async () => {
    if (!order) return
    if (!window.confirm('Cancel this order? Reserved stock will be returned to the store.')) return
    setActionLoading(true)
    try {
      const updated = await cancelOrder(order.id)
      setOrder(updated)
      showToast('Order cancelled.')
    } catch (err) {
      showToast((err instanceof Error && err.message) || 'Could not cancel the order.', 'error')
    } finally {
      setActionLoading(false)
    }
  }, [order, showToast])

  const handleReorder = useCallback(async () => {
    if (!order) return
    setActionLoading(true)
    try {
      const created = await reorder(order.id)
      navigate(`/orders/${created.id}`, { replace: true })
      showToast('New order placed!')
    } catch (err) {
      showToast((err instanceof Error && err.message) || 'Could not reorder.', 'error')
    } finally {
      setActionLoading(false)
    }
  }, [order, navigate, showToast])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <LoadingSpinner size="md" message="Loading order details..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <ErrorMessage message={error ?? 'Order not found.'}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={fetchOrder}>Retry</Button>
            <Link to="/orders">
              <Button variant="secondary">Back to Orders</Button>
            </Link>
          </div>
        </ErrorMessage>
      </div>
    )
  }

  const shipping = order.shippingAddress

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          to="/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Orders
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
              {order.status}
            </span>
            {isCancellable && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 text-xs text-error hover:text-error"
              >
                Cancel Order
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleReorder}
              disabled={actionLoading || order.status === 'cancelled'}
              className="px-4 py-2 text-xs"
            >
              Buy Again
            </Button>
          </div>
        </div>
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
        {order.trackingNumber && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <span className="text-gray-500 dark:text-gray-400">Tracking:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">{order.trackingNumber}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
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
              <span className="font-semibold">Total Paid</span>
              <span className="text-lg font-bold">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Order Timeline</h2>
          <ol className="space-y-0">
            {(order.statusHistory && order.statusHistory.length > 0
              ? order.statusHistory
              : [{ status: order.status, at: order.createdAt, note: undefined }]
            )
              .slice()
              .reverse()
              .map((entry, index, entries) => {
                const isLast = index === entries.length - 1
                return (
                  <li key={`${entry.status}-${entry.at}`} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast && (
                      <span
                        className="absolute left-[9px] top-6 h-full w-px bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`relative mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        entry.status === 'cancelled'
                          ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'
                          : 'border-primary bg-primary/10'
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.status === 'cancelled' ? 'bg-gray-400 dark:bg-gray-500' : 'bg-primary'
                        }`}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {capitalize(entry.status)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {entry.note && (
                        <p className="mt-0.5 text-xs italic text-gray-500 dark:text-gray-400">{entry.note}</p>
                      )}
                    </div>
                  </li>
                )
              })}
          </ol>
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

        <div className="text-center">
          <Link to="/">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default memo(OrderDetailPage)
