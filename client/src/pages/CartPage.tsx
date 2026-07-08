import { useCart } from '../hooks/useCart'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600">Your cart is empty.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
          >
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
              <p className="mt-1 text-sm text-gray-500">
                ${item.product.price.toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 transition hover:bg-gray-50"
              >
                &minus;
              </button>
              <span className="w-6 text-center text-sm font-medium text-gray-900">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 transition hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right text-sm font-semibold text-gray-900">
              ${(item.product.price * item.quantity).toFixed(2)}
            </p>

            <button
              type="button"
              onClick={() => removeFromCart(item.product.id)}
              className="text-sm text-red-600 transition hover:text-red-800"
            >
              Remove
            </button>
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
        <button
          type="button"
          disabled
          className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white opacity-50"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
