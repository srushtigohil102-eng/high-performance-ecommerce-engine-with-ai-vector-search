import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import Button from '../components/Button'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart()

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

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            {/* Top row: image + info + remove */}
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  {item.product.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  ${item.product.price.toFixed(2)} each
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="flex-shrink-0 text-sm text-red-600 transition hover:text-red-800"
                aria-label={`Remove ${item.product.name} from cart`}
              >
                Remove
              </button>
            </div>

            {/* Bottom row: quantity + line total */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &minus;
                </button>
                <span className="w-6 text-center text-sm font-medium text-gray-900" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 transition hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-900">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-gray-900">Subtotal</p>
          <p className="text-xl font-bold text-gray-900">
            ${cartTotal.toFixed(2)}
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Checkout coming soon — Week 3
        </p>
        <Button
          disabled
          className="mt-2 w-full opacity-50"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  )
}
