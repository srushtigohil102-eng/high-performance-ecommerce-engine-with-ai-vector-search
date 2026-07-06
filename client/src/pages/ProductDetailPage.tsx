import { useParams } from 'react-router-dom'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
          <span className="text-gray-400">Product Image</span>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Product Title</h1>
          <p className="text-2xl font-semibold text-gray-900">$0.00</p>
          <p className="text-gray-600">
            Product description goes here. This is placeholder content until the
            backend API is connected.
          </p>
          <p className="text-sm text-gray-500">Category: N/A</p>
          <button
            type="button"
            className="mt-4 w-fit rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            onClick={() => console.log('Add to cart:', id)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
