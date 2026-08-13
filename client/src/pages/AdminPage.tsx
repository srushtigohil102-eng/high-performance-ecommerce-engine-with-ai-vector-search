import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import { useToast } from '../hooks/useToast'
import type { Product, ProductPayload } from '../types'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency } from '../utils/formatCurrency'

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
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Products</h1>
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

      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs font-medium text-primary">
        Manage the product catalog. Changes take effect immediately for all visitors.
      </div>

      {products.length === 0 ? (
        <p className="text-text-secondary">No products found. Add your first product above.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated text-xs font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-elevated/40 transition-colors duration-150">
                    <td className="px-4 py-3.5 font-semibold text-text-primary">{product.name}</td>
                    <td className="px-4 py-3.5 text-accent font-bold">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{product.category}</td>
                    <td className="px-4 py-3.5 text-text-secondary font-medium">{product.stock ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition min-h-[44px]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(product)}
                          className="rounded-md px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition min-h-[44px]"
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

          {/* Mobile card layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">{product.name}</p>
                    <p className="mt-1 text-xs text-text-secondary font-medium">{product.category}</p>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatCurrency(product.price)}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                  <p className="text-xs text-text-secondary font-semibold">Stock: {product.stock ?? '—'}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition min-h-[44px]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(product)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition min-h-[44px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-xs sm:items-center">
          <div className="mx-0 w-full max-w-lg rounded-t-xl bg-surface p-6 border border-border shadow-2xl sm:mx-4 sm:rounded-xl">
            <h2 className="mb-4 font-display text-xl font-bold text-text-primary">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label htmlFor="admin-desc" className="text-sm font-medium text-text-secondary">Description</label>
                <textarea
                  id="admin-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-xs sm:items-center">
          <div className="mx-0 w-full max-w-sm rounded-t-xl bg-surface p-6 border border-border shadow-2xl sm:mx-4 sm:rounded-xl">
            <h2 className="mb-2 font-display text-lg font-bold text-text-primary">Delete Product</h2>
            <p className="mb-6 text-sm text-text-secondary leading-relaxed">
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
                className="bg-error bg-none! text-white hover:brightness-110 shadow-md shadow-error/15"
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
