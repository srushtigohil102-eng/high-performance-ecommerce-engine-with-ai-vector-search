import { memo, useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { placeOrder } from '../services/orderService'
import Button from '../components/Button'
import Input from '../components/Input'
import ProductImage from '../components/ProductImage'
import type { ShippingAddress, PaymentMethod } from '../types'

const INITIAL_SHIPPING: ShippingAddress = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
}

interface ShippingErrors {
  fullName?: string
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
  phone?: string
}

function validateShipping(s: ShippingAddress): ShippingErrors {
  const errors: ShippingErrors = {}
  if (!s.fullName.trim()) errors.fullName = 'Full name is required'
  if (!s.addressLine1.trim()) errors.addressLine1 = 'Address is required'
  if (!s.city.trim()) errors.city = 'City is required'
  if (!s.state.trim()) errors.state = 'State is required'
  if (!s.postalCode.trim()) {
    errors.postalCode = 'Postal code is required'
  } else if (!/^\d{5}(-\d{4})?$/.test(s.postalCode.trim())) {
    errors.postalCode = 'Enter a valid US postal code (e.g. 12345 or 12345-6789)'
  }
  if (!s.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!/^\+?[\d\s\-()]{7,15}$/.test(s.phone.trim())) {
    errors.phone = 'Enter a valid phone number'
  }
  return errors
}

function CheckoutPage() {
  const { items, cartSummary, discount, clearCart, isCheckoutBlocked, checkoutBlockReason } = useCart()
  const navigate = useNavigate()

  const [shipping, setShipping] = useState<ShippingAddress>(INITIAL_SHIPPING)
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({})
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateShipping = useCallback((field: keyof ShippingAddress, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }))
    setShippingErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const errors = validateShipping(shipping)
    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const order = await placeOrder({
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        shippingAddress: {
          fullName: shipping.fullName.trim(),
          addressLine1: shipping.addressLine1.trim(),
          addressLine2: shipping.addressLine2.trim(),
          city: shipping.city.trim(),
          state: shipping.state.trim(),
          postalCode: shipping.postalCode.trim(),
          phone: shipping.phone.trim(),
        },
        paymentMethod,
        discountCode: discount?.code,
      })
      clearCart()
      navigate(`/order-confirmation/${order.id}`, { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to place order. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [shipping, paymentMethod, items, discount, clearCart, navigate])

  // Redirect to cart if empty
  if (items.length === 0 && !isSubmitting) {
    return <Navigate to="/cart" replace />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

      {submitError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{submitError}</p>
          <p className="mt-1 text-xs text-red-600">Your cart items have been preserved. You can fix the issue and retry.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:flex-row">
        {/* Left column — forms */}
        <div className="flex-1 space-y-6">
          {/* Shipping address */}
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping Address</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  value={shipping.fullName}
                  onChange={(e) => updateShipping('fullName', e.target.value)}
                  error={shippingErrors.fullName}
                  placeholder="John Doe"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address Line 1"
                  value={shipping.addressLine1}
                  onChange={(e) => updateShipping('addressLine1', e.target.value)}
                  error={shippingErrors.addressLine1}
                  placeholder="123 Main St"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address Line 2 (Optional)"
                  value={shipping.addressLine2}
                  onChange={(e) => updateShipping('addressLine2', e.target.value)}
                  placeholder="Apt, Suite, Unit, etc."
                />
              </div>
              <Input
                label="City"
                value={shipping.city}
                onChange={(e) => updateShipping('city', e.target.value)}
                error={shippingErrors.city}
                placeholder="New York"
              />
              <Input
                label="State"
                value={shipping.state}
                onChange={(e) => updateShipping('state', e.target.value)}
                error={shippingErrors.state}
                placeholder="NY"
              />
              <Input
                label="Postal Code"
                value={shipping.postalCode}
                onChange={(e) => updateShipping('postalCode', e.target.value)}
                error={shippingErrors.postalCode}
                placeholder="10001"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={shipping.phone}
                onChange={(e) => updateShipping('phone', e.target.value)}
                error={shippingErrors.phone}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                  <p className="text-xs text-gray-500">Pay when your order arrives</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="mock_card"
                  checked={paymentMethod === 'mock_card'}
                  onChange={() => setPaymentMethod('mock_card')}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Card Payment (Mock)</span>
                  <p className="text-xs text-gray-500">Simulated card payment for testing</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right column — order summary */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-24 rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Order</h2>

            <div className="mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    <ProductImage
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-full w-full"
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
              {discount && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">
                    Discount ({discount.code})
                  </span>
                  <span className="font-medium text-green-600">
                    &minus;${discount.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">${cartSummary.total.toFixed(2)}</span>
              </div>
            </div>

            {isCheckoutBlocked && checkoutBlockReason && (
              <p className="mt-4 text-xs font-medium text-red-600">
                {checkoutBlockReason}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || isCheckoutBlocked}
              className="mt-6 w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Placing Order...
                </span>
              ) : (
                `Place Order — $${cartSummary.total.toFixed(2)}`
              )}
            </Button>

            <Link
              to="/cart"
              className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              &larr; Back to Cart
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default memo(CheckoutPage)
