import { memo, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import Button from '../components/Button'
import ProductImage from '../components/ProductImage'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Order } from '../types'

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  mock_card: 'Card Payment (Mock)',
}

function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    getOrderById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data)
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load order details. Please check your email for confirmation.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [orderId])

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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error ?? 'Order not found.'}</p>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-gray-900 underline hover:text-gray-600">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const shipping = order.shippingAddress

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you for your purchase. Your order number is:
        </p>
        <p className="mt-1 text-lg font-mono font-bold text-gray-900">#{order.id}</p>
      </div>

      {/* Order details */}
      <div className="space-y-6">
        {/* Items */}
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Items Ordered</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
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

        {/* Shipping & Payment info */}
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
              Payment & Status
            </h2>
            <div className="text-sm text-gray-900">
              <p>
                <span className="text-gray-600">Method: </span>
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <p className="mt-1">
                <span className="text-gray-600">Status: </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  {order.status}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Continue shopping */}
        <div className="text-center">
          <Link to="/">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default memo(OrderConfirmationPage)
