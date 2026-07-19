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
    return {
      products: (data.products ?? []).map(normalizeProduct),
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
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name,
    price: raw.price,
    description: raw.description,
    imageUrl: raw.imageUrl,
    category: raw.category,
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
    const { data } = await apiClient.get<ProductResponse>(`/products/${id}`)
    return normalizeProduct(data)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[productService] API unavailable, falling back to mock data', err)
      return mockProducts.find((p) => p.id === id) ?? null
    }
    throw new Error('Failed to load product. Please try again later.')
  }
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.post<ProductResponse>('/products', payload)
  return normalizeProduct(data)
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.put<ProductResponse>(`/products/${id}`, payload)
  return normalizeProduct(data)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}
