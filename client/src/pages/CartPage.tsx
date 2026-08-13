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
        <h1 className="mb-6 font-display text-2xl font-bold text-text-primary sm:text-section">Shopping Cart</h1>
        <LoadingSpinner size="md" message="Loading your cart..." />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold text-text-primary sm:text-section">Shopping Cart</h1>
        <CheckoutSteps current="cart" />
        <div className="rounded-xl border border-border bg-surface py-16 text-center shadow-sm">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-text-secondary/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <p className="mb-2 text-lg font-medium text-text-primary">Your cart is empty</p>
          <p className="mb-6 text-sm text-text-secondary">
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
      <h1 className="mb-8 font-display text-2xl font-bold text-text-primary sm:text-section">Shopping Cart</h1>
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
                  className={`relative rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 ${
                    isRemoving ? 'translate-x-8 opacity-0 scale-95 pointer-events-none' : 'animate-slide-in'
                  }`}
                >
                  {isUpdating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/60 backdrop-blur-xs">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-elevated sm:h-20 sm:w-20">
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-sm font-semibold text-text-primary">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {formatCurrency(item.product.price)} each
                      </p>

                      {isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-error">
                          This item is no longer available. Remove it to proceed.
                        </p>
                      )}
                      {exceedsStock && !isOutOfStock && (
                        <p className="mt-1 text-xs font-medium text-warning">
                          Only {item.product.stock} left in stock. Quantity adjusted.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRemove(item.product.id)}
                      className="flex-shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-error hover:bg-error/10 transition-colors"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecrease(item.product.id, item.quantity)}
                        disabled={item.quantity <= 1 || isUpdating}
                        aria-label="Decrease quantity"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg text-text-secondary hover:bg-surface-elevated transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        &minus;
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-text-primary" aria-live="polite">
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
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg text-text-secondary hover:bg-surface-elevated transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-bold text-accent">
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
          <div className="sticky top-24 rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(cartSummary.subtotal)}
                </span>
              </div>

              {discount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success">
                    Discount ({discount.code})
                    {discount.description && (
                      <span className="ml-1 text-xs text-text-secondary">&mdash; {discount.description}</span>
                    )}
                  </span>
                  <span className="font-semibold text-success">
                    &minus;{formatCurrency(discount.discountAmount)}
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-text-primary">Total</span>
                  <span className="text-xl font-bold text-accent">
                    {formatCurrency(cartSummary.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount code */}
            {!discount ? (
              <form onSubmit={handleApplyDiscount} className="mt-6">
                <label htmlFor="discount-code" className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={discountLoading || !discountInput.trim()}
                    className="px-4 py-2"
                  >
                    {discountLoading ? '...' : 'Apply'}
                  </Button>
                </div>
                {discountError && (
                  <p className="mt-1 text-xs text-error font-medium">{discountError}</p>
                )}
              </form>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-success/15 px-3 py-2">
                <span className="text-sm font-medium text-success">
                  Code <span className="font-bold">{discount.code}</span> applied
                </span>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  disabled={discountLoading}
                  className="text-xs font-semibold text-error hover:underline transition disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Checkout block warning */}
            {isCheckoutBlocked && checkoutBlockReason && (
              <p className="mt-4 text-xs font-medium text-error">
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
