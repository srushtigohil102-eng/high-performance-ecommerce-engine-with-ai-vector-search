import { memo, useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { useAuth } from '../hooks/useAuth'
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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      navigate('/login')
      return
    }

    fetchOrder()
  }, [isAuthenticated, navigate, fetchOrder])

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
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Order Details</h1>
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Orders
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
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

      <div className="space-y-6">
        {/* Items */}
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Items</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount ({order.discountCode})</span>
                <span className="font-medium text-green-600">
                  &minus;${order.discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-semibold">Total Paid</span>
              <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Shipping Address
            </h2>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{shipping.fullName}</p>
              <p>{shipping.addressLine1}</p>
              {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
              <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
              <p className="mt-1 text-gray-600">{shipping.phone}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Payment Method
            </h2>
            <div className="text-sm text-gray-900">
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
