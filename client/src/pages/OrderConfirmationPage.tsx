import { memo, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import ProductImage from '../components/ProductImage'
import LoadingSpinner from '../components/LoadingSpinner'
import CheckoutSteps from '../components/CheckoutSteps'
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

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await getOrderById(orderId)
      setOrder(data)
    } catch {
      setError('Unable to load order details. Please check your email for confirmation.')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

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
        <ErrorMessage message={error ?? 'Order not found.'}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={fetchOrder}>Retry</Button>
            <Link to="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </ErrorMessage>
      </div>
    )
  }

  const shipping = order.shippingAddress

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <CheckoutSteps current="confirmation" />

      {/* Success header */}
      <div className="mb-8 text-center animate-slide-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Order Confirmed!</h1>
        <p className="mt-2 text-text-secondary">
          Thank you for your purchase. Your order number is:
        </p>
        <p className="mt-1 text-lg font-mono font-bold text-accent">#{order.id}</p>
      </div>

      {/* Order details */}
      <div className="space-y-6 animate-slide-in" style={{ animationDelay: '100ms' }}>
        {/* Items */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Items Ordered</h2>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-surface-elevated">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-text-primary">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-semibold text-text-primary">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success font-semibold">Discount ({order.discountCode})</span>
                <span className="font-semibold text-success">
                  &minus;{formatCurrency(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-text-primary">Total Paid</span>
              <span className="text-lg font-bold text-accent">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment info */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Shipping Address
            </h2>
            <div className="text-sm text-text-primary">
              <p className="font-semibold">{shipping.fullName}</p>
              <p>{shipping.addressLine1}</p>
              {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
              <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
              <p className="mt-1 text-text-secondary">{shipping.phone}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Payment & Status
            </h2>
            <div className="text-sm text-text-primary">
              <p>
                <span className="text-text-secondary">Method: </span>
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <p className="mt-1">
                <span className="text-text-secondary">Status: </span>
                <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                  {order.status}
                </span>
              </p>
              <p className="mt-1.5 text-xs text-text-secondary">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Continue shopping */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center pt-4">
          <Link to="/orders">
            <Button>View My Orders</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default memo(OrderConfirmationPage)
