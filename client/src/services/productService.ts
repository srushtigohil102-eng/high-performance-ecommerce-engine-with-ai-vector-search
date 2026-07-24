import type { Product, ProductPayload, PaginatedResponse, ProductQueryParams } from '../types'
import { apiClient } from './apiClient'
import { mockProducts } from '../data/mockProducts'

export async function searchProducts(
  query: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse> {
  if (!query.trim()) {
    return getProducts(params)
  }

  try {
    const { data } = await apiClient.get<PaginatedResponse>('/search', {
      params: { q: query, ...params },
    })

    if (import.meta.env.DEV && !data.products && !Array.isArray(data)) {
      console.warn('[searchProducts] Unexpected search response shape:', data)
    }

    const products = Array.isArray(data) ? data : data.products ?? []
    return {
      products: products.map(normalizeProduct),
      total: data.total ?? 0,
      page: data.page ?? params.page ?? 1,
      limit: data.limit ?? params.limit ?? 12,
      totalPages: data.totalPages ?? 1,
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[searchProducts] API unavailable, falling back to mock filter', err)
      return filterMockProducts(mockProducts, { search: query, ...params })
    }
    throw new Error('Search failed. Please try again later.')
  }
}

interface ProductResponse {
  id?: string
  _id?: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
}

function normalizeProduct(raw: ProductResponse): Product {
  const id = raw.id ?? raw._id ?? ''
  if (import.meta.env.DEV && !id) {
    console.warn('[productService] Product missing id field, response shape may have changed:', raw)
  }
  return {
    id,
    name: raw.name ?? 'Unknown Product',
    price: typeof raw.price === 'number' ? raw.price : 0,
    description: raw.description ?? '',
    imageUrl: raw.imageUrl ?? 'https://placehold.co/200x200?text=Product',
    category: raw.category ?? '',
    stock: raw.stock,
  }
}

function filterMockProducts(
  allProducts: Product[],
  params: ProductQueryParams,
): PaginatedResponse {
  let filtered = [...allProducts]

  if (params.category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === params.category!.toLowerCase(),
    )
  }

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }

  const page = params.page ?? 1
  const limit = params.limit ?? 12
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const paged = filtered.slice(start, start + limit)

  return { products: paged, total, page, limit, totalPages }
}

export async function getProducts(
  params: ProductQueryParams = {},
): Promise<PaginatedResponse> {
  try {
    const { data } = await apiClient.get<ProductResponse[] | PaginatedResponse>(
      '/products',
      { params },
    )

    if (Array.isArray(data)) {
      return filterMockProducts(data.map(normalizeProduct), params)
    }

    if (import.meta.env.DEV && !data.products && typeof data === 'object') {
      console.warn('[getProducts] Unexpected products response shape:', data)
    }

    return {
      products: (data.products ?? []).map(normalizeProduct),
      total: data.total ?? 0,
      page: data.page ?? params.page ?? 1,
      limit: data.limit ?? params.limit ?? 12,
      totalPages: data.totalPages ?? 1,
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[productService] API unavailable, falling back to mock data', err)
      return filterMockProducts(mockProducts, params)
    }
    throw new Error('Failed to load products. Please try again later.')
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data } = await apiClient.get<ProductResponse | { product: ProductResponse }>(`/products/${id}`)
    const raw = (data && typeof data === 'object' && 'product' in data) ? (data as { product: ProductResponse }).product : data
    return normalizeProduct(raw)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[productService] API unavailable, falling back to mock data', err)
      return mockProducts.find((p) => p.id === id) ?? null
    }
    throw new Error('Failed to load product. Please try again later.')
  }
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.post<ProductResponse | { product: ProductResponse }>('/products', payload)
  const raw = (data && typeof data === 'object' && 'product' in data) ? (data as { product: ProductResponse }).product : data
  return normalizeProduct(raw)
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.put<ProductResponse | { product: ProductResponse }>(`/products/${id}`, payload)
  const raw = (data && typeof data === 'object' && 'product' in data) ? (data as { product: ProductResponse }).product : data
  return normalizeProduct(raw)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}
