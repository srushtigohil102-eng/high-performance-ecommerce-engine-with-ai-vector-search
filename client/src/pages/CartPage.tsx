import { memo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatCurrency } from '../utils/formatCurrency'
import Button from '../components/Button'
import ProductImage from '../components/ProductImage'
import LoadingSpinner from '../components/LoadingSpinner'
import CheckoutSteps from '../components/CheckoutSteps'

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
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const handleRemove = useCallback(
    (id: string) => () => {
      setRemovingIds((prev) => new Set(prev).add(id))
      window.setTimeout(() => {
        removeFromCart(id)
        setRemovingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 200)
    },
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
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
        <LoadingSpinner size="md" message="Loading your cart..." />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
        <CheckoutSteps current="cart" />
        <div className="rounded-lg border border-gray-200 py-16 text-center dark:border-gray-800">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</p>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Looks like you haven&rsquo;t added anything yet.
          </p>
          <Link to="/">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
      <CheckoutSteps current="cart" />

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Line items */}
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const isUpdating = updatingItems.has(item.product.id)
              const isRemoving = removingIds.has(item.product.id)
              const isOutOfStock = item.product.stock === 0
              const exceedsStock =
                item.product.stock != null && item.quantity > item.product.stock

              return (
                <div
                  key={item.product.id}
                  className={`relative rounded-lg border border-gray-200 p-4 transition-all duration-200 dark:border-gray-800 ${
                    isRemoving ? '-translate-y-2 opacity-0' : 'animate-slide-in'
                  }`}
                >
                  {isUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60 dark:bg-gray-900/60">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20 dark:bg-gray-800">
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.product.price)} each
                      </p>

                      {isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          This item is no longer available. Remove it to proceed.
                        </p>
                      )}
                      {exceedsStock && !isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Only {item.product.stock} left in stock. Quantity adjusted.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRemove(item.product.id)}
                      className="flex-shrink-0 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-800 min-h-[44px] min-w-[44px] dark:hover:bg-red-950 dark:hover:text-red-400"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecrease(item.product.id, item.quantity)}
                        disabled={item.quantity <= 1 || isUpdating}
                        aria-label="Decrease quantity"
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        &minus;
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white" aria-live="polite">
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
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-24 rounded-lg border border-gray-200 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(cartSummary.subtotal)}
                </span>
              </div>

              {discount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    Discount ({discount.code})
                    {discount.description && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">&mdash; {discount.description}</span>
                    )}
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    &minus;{formatCurrency(discount.discountAmount)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(cartSummary.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount code */}
            {!discount ? (
              <form onSubmit={handleApplyDiscount} className="mt-6">
                <label htmlFor="discount-code" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
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
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{discountError}</p>
                )}
              </form>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/40">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Code <span className="font-bold">{discount.code}</span> applied
                </span>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  disabled={discountLoading}
                  className="text-xs font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Checkout block warning */}
            {isCheckoutBlocked && checkoutBlockReason && (
              <p className="mt-4 text-xs font-medium text-red-600 dark:text-red-400">
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
