import { memo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import Button from '../components/Button'
import ProductImage from '../components/ProductImage'
import LoadingSpinner from '../components/LoadingSpinner'

function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartSummary,
    isLoading,
    updatingItems,
    discount,
    discountError,
    discountLoading,
    applyDiscountCode,
    removeDiscountCode,
    isCheckoutBlocked,
    checkoutBlockReason,
  } = useCart()

  const navigate = useNavigate()
  const [discountInput, setDiscountInput] = useState('')

  const handleRemove = useCallback(
    (id: string) => () => removeFromCart(id),
    [removeFromCart],
  )

  const handleDecrease = useCallback(
    (id: string, qty: number) => () => updateQuantity(id, qty - 1),
    [updateQuantity],
  )

  const handleIncrease = useCallback(
    (id: string, qty: number, stock?: number) => () => {
      const maxQty = stock ?? Infinity
      updateQuantity(id, Math.min(qty + 1, maxQty))
    },
    [updateQuantity],
  )

  const handleApplyDiscount = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const code = discountInput.trim()
      if (code) {
        applyDiscountCode(code)
      }
    },
    [discountInput, applyDiscountCode],
  )

  const handleRemoveDiscount = useCallback(() => {
    removeDiscountCode()
    setDiscountInput('')
  }, [removeDiscountCode])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <LoadingSpinner size="md" message="Loading your cart..." />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mb-4 text-gray-600">Your cart is empty.</p>
        <Link to="/" className="text-sm font-medium text-gray-900 underline hover:text-gray-600">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Line items */}
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const isUpdating = updatingItems.has(item.product.id)
              const isOutOfStock = item.product.stock === 0
              const exceedsStock =
                item.product.stock != null && item.quantity > item.product.stock

              return (
                <div
                  key={item.product.id}
                  className="relative rounded-lg border border-gray-200 p-4"
                >
                  {isUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        ${item.product.price.toFixed(2)} each
                      </p>

                      {isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          This item is no longer available. Remove it to proceed.
                        </p>
                      )}
                      {exceedsStock && !isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          Only {item.product.stock} left in stock. Quantity adjusted.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRemove(item.product.id)}
                      className="flex-shrink-0 text-sm text-red-600 transition hover:text-red-800"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecrease(item.product.id, item.quantity)}
                        disabled={item.quantity <= 1 || isUpdating}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        &minus;
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrease(item.product.id, item.quantity, item.product.stock)}
                        disabled={
                          isOutOfStock ||
                          (item.product.stock != null && item.quantity >= item.product.stock) ||
                          isUpdating
                        }
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-24 rounded-lg border border-gray-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-medium text-gray-900">
                  ${cartSummary.subtotal.toFixed(2)}
                </span>
              </div>

              {discount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">
                    Discount ({discount.code})
                    {discount.description && (
                      <span className="ml-1 text-xs text-gray-500">&mdash; {discount.description}</span>
                    )}
                  </span>
                  <span className="font-medium text-green-600">
                    &minus;${discount.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${cartSummary.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount code */}
            {!discount ? (
              <form onSubmit={handleApplyDiscount} className="mt-6">
                <label htmlFor="discount-code" className="mb-1 block text-sm font-medium text-gray-700">
                  Have a discount code?
                </label>
                <div className="flex gap-2">
                  <input
                    id="discount-code"
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Enter code"
                    disabled={discountLoading}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={discountLoading || !discountInput.trim()}
                    className="px-4"
                  >
                    {discountLoading ? '...' : 'Apply'}
                  </Button>
                </div>
                {discountError && (
                  <p className="mt-1 text-xs text-red-600">{discountError}</p>
                )}
              </form>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                <span className="text-sm font-medium text-green-700">
                  Code <span className="font-bold">{discount.code}</span> applied
                </span>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  disabled={discountLoading}
                  className="text-xs font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Checkout block warning */}
            {isCheckoutBlocked && checkoutBlockReason && (
              <p className="mt-4 text-xs font-medium text-red-600">
                {checkoutBlockReason}
              </p>
            )}

            <Button
              disabled={isCheckoutBlocked}
              className="mt-6 w-full"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CartPage)
