import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { Product, ProductPayload } from '../types'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const emptyForm: ProductPayload = {
  name: '',
  price: 0,
  description: '',
  imageUrl: '',
  category: '',
  stock: 0,
}

interface FormErrors {
  name?: string
  price?: string
  category?: string
}

function validateForm(form: ProductPayload): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }
  if (form.price <= 0) {
    errors.price = 'Price must be a positive number'
  }
  if (!form.category.trim()) {
    errors.category = 'Category is required'
  }
  return errors
}

export default function AdminPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductPayload>(emptyForm)
  const [formTouched, setFormTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const formErrors = useMemo(() => {
    if (!formTouched) return {}
    return validateForm(form)
  }, [form, formTouched])

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [refreshing, setRefreshing] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getProducts({ limit: 200 })
      setProducts(result.products)
    } catch {
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await getProducts({ limit: 200 })
      setProducts(result.products)
      showToast('Product list refreshed')
    } catch {
      showToast('Failed to refresh products', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const formValid = useMemo(() => {
    return form.name.trim() !== '' && form.price > 0 && form.category.trim() !== ''
  }, [form.name, form.price, form.category])

  function openAddForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormTouched(false)
    setShowForm(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock ?? 0,
    })
    setFormTouched(false)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
    setForm(emptyForm)
    setFormTouched(false)
  }

  function updateFormField(field: keyof ProductPayload, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFormBlur() {
    setFormTouched(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormTouched(true)
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form)
        showToast('Product updated successfully')
      } else {
        await createProduct(form)
        showToast('Product added successfully')
      }
      closeForm()
      fetchProducts()
    } catch {
      showToast(editingProduct ? 'Failed to update product' : 'Failed to add product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDelete(product: Product) {
    setDeletingProduct(product)
  }

  async function handleDelete() {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      await deleteProduct(deletingProduct.id)
      showToast('Product deleted successfully')
      setDeletingProduct(null)
      fetchProducts()
    } catch {
      showToast('Failed to delete product', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ErrorMessage message={error}>
          <Button onClick={fetchProducts}>Retry</Button>
        </ErrorMessage>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {user && <p className="mt-1 text-sm text-gray-500">Logged in as {user.name} ({user.role})</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={openAddForm}>+ Add Product</Button>
        </div>
      </div>

      <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-800">
        <strong>SECURITY BLOCKER:</strong> Backend RBAC enforcement is NOT implemented.
        Any authenticated user can hit admin API endpoints directly. Frontend route guard alone is NOT real security.
        This must be enforced server-side before production.
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found. Add your first product above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-700">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-700">{product.category}</td>
                  <td className="px-4 py-3 text-gray-700">{product.stock ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(product)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input
                label="Name"
                required
                value={form.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                onBlur={handleFormBlur}
                error={formErrors.name}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateFormField('price', parseFloat(e.target.value) || 0)}
                  onBlur={handleFormBlur}
                  error={formErrors.price}
                />
                <Input
                  label="Stock"
                  type="number"
                  min="0"
                  value={form.stock ?? 0}
                  onChange={(e) => updateFormField('stock', parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <Input
                label="Category"
                required
                value={form.category}
                onChange={(e) => updateFormField('category', e.target.value)}
                onBlur={handleFormBlur}
                error={formErrors.category}
              />
              <Input
                label="Image URL"
                value={form.imageUrl}
                onChange={(e) => updateFormField('imageUrl', e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor="admin-desc" className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="admin-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={closeForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formValid}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-gray-900">Delete Product</h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
