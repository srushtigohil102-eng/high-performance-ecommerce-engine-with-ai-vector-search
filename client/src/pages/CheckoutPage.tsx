import { memo, useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { placeOrder } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import Input from '../components/Input'
import ProductImage from '../components/ProductImage'
import CheckoutSteps from '../components/CheckoutSteps'
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

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

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
    errors.postalCode = 'PIN code is required'
  } else if (!/^\d{6}$/.test(s.postalCode.trim())) {
    errors.postalCode = 'Enter a valid 6-digit Indian PIN code'
  }
  if (!s.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!/^(\+?91[\s-]?)?0?[6-9]\d{9}$/.test(s.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number'
  }
  return errors
}

function CheckoutPage() {
  const { items, cartSummary, discount, clearCart, isCheckoutBlocked, checkoutBlockReason } = useCart()
  const { isAuthenticated } = useAuth()
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

  // Require authentication to checkout
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Checkout</h1>
        <CheckoutSteps current="checkout" />
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Sign in to complete your order</p>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            You need an account to place an order. Your cart items will be preserved.
          </p>
          <Link to="/login?returnTo=/checkout">
            <Button>Sign In</Button>
          </Link>
          <Link
            to="/cart"
            className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  // Redirect to cart if empty
  if (items.length === 0 && !isSubmitting) {
    return <Navigate to="/cart" replace />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Checkout</h1>
      <CheckoutSteps current="checkout" />

      {submitError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{submitError}</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Your cart items have been preserved. You can fix the issue and retry.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Order summary - visible on mobile above the form, on desktop in right column */}
        <div className="rounded-lg border border-gray-200 p-6 lg:hidden dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Your Order</h2>

          <div className="mb-4 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                  <ProductImage
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium">{formatCurrency(cartSummary.subtotal)}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Discount ({discount.code})
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  &minus;{formatCurrency(discount.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(cartSummary.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left column — forms */}
          <div className="flex-1 space-y-6">
            {/* Shipping address */}
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Shipping Address</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Full Name"
                    value={shipping.fullName}
                    onChange={(e) => updateShipping('fullName', e.target.value)}
                    error={shippingErrors.fullName}
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address Line 1"
                    value={shipping.addressLine1}
                    onChange={(e) => updateShipping('addressLine1', e.target.value)}
                    error={shippingErrors.addressLine1}
                    placeholder="Flat 12, Sunshine Apartments, Linking Road"
                    autoComplete="address-line1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address Line 2 (Optional)"
                    value={shipping.addressLine2}
                    onChange={(e) => updateShipping('addressLine2', e.target.value)}
                    placeholder="Near Andheri Station, Phase 2"
                    autoComplete="address-line2"
                  />
                </div>
                <Input
                  label="City"
                  value={shipping.city}
                  onChange={(e) => updateShipping('city', e.target.value)}
                  error={shippingErrors.city}
                  placeholder="Mumbai"
                  autoComplete="address-level2"
                />
                <div className="flex flex-col gap-1">
                  <label htmlFor="shipping-state" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    State
                  </label>
                  <select
                    id="shipping-state"
                    value={shipping.state}
                    onChange={(e) => updateShipping('state', e.target.value)}
                    className={`rounded-lg border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-1 min-h-[44px] dark:bg-gray-800 dark:text-gray-100 ${
                      shippingErrors.state
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:focus:border-primary dark:focus:ring-primary'
                    }`}
                    aria-label="State"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {shippingErrors.state && (
                    <p className="text-xs text-red-600 dark:text-red-400">{shippingErrors.state}</p>
                  )}
                </div>
                <Input
                  label="PIN Code"
                  value={shipping.postalCode}
                  onChange={(e) => updateShipping('postalCode', e.target.value)}
                  error={shippingErrors.postalCode}
                  placeholder="400001"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => updateShipping('phone', e.target.value)}
                  error={shippingErrors.phone}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:border-gray-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Cash on Delivery</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pay when your order arrives</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    value="mock_card"
                    checked={paymentMethod === 'mock_card'}
                    onChange={() => setPaymentMethod('mock_card')}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:border-gray-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Card Payment (Mock)</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Simulated card payment for testing</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right column — order summary (desktop only) */}
          <div className="hidden w-full lg:block lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-24 rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Your Order</h2>

              <div className="mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="mb-3 flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatCurrency(cartSummary.subtotal)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Discount ({discount.code})
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      &minus;{formatCurrency(discount.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(cartSummary.total)}</span>
                </div>
              </div>

              {isCheckoutBlocked && checkoutBlockReason && (
                <p className="mt-4 text-xs font-medium text-red-600 dark:text-red-400">
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
                  `Place Order — ${formatCurrency(cartSummary.total)}`
                )}
              </Button>

              <Link
                to="/cart"
                className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                &larr; Back to Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile sticky place order bar */}
        <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white p-4 lg:hidden dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(cartSummary.total)}</span>
          </div>
          {isCheckoutBlocked && checkoutBlockReason && (
            <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
              {checkoutBlockReason}
            </p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isCheckoutBlocked}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Placing Order...
              </span>
            ) : (
              `Place Order — ${formatCurrency(cartSummary.total)}`
            )}
          </Button>
          <Link
            to="/cart"
            className="mt-2 block text-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Cart
          </Link>
        </div>
      </form>
    </div>
  )
}

export default memo(CheckoutPage)
