import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import Button from '../components/Button'

function CheckoutPage() {
  const { items, cartSummary } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mb-4 text-gray-600">Your cart is empty. Add some items before checking out.</p>
        <Link to="/" className="text-sm font-medium text-gray-900 underline hover:text-gray-600">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Checkout form — placeholder */}
        <div className="flex-1">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping Information</h2>
            <p className="text-sm text-gray-500">
              Full checkout form coming soon. This page will collect shipping details,
              payment information, and order confirmation.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment</h2>
            <p className="text-sm text-gray-500">
              Payment integration will be added in a later sprint.
            </p>
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-24 rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Order</h2>

            <div className="mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${cartSummary.subtotal.toFixed(2)}</span>
              </div>
              {cartSummary.discount && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="font-medium text-green-600">
                    &minus;${cartSummary.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">${cartSummary.total.toFixed(2)}</span>
              </div>
            </div>

            <Button disabled className="mt-6 w-full opacity-50">
              Place Order (Coming Soon)
            </Button>

            <Link
              to="/cart"
              className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              &larr; Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CheckoutPage)
