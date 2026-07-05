import { useParams } from 'react-router-dom'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Product Detail</h1>
      <p className="text-gray-600">Viewing product: {id}</p>
    </div>
  )
}
