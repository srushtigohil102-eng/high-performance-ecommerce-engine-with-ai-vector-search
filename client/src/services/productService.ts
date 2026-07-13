import type { Product, ProductPayload } from '../types'
import { apiClient } from './apiClient'
import { mockProducts } from '../data/mockProducts'

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

export async function getProducts(): Promise<Product[]> {
  try {
    const { data } = await apiClient.get<ProductResponse[]>('/products')
    return Array.isArray(data) ? data.map(normalizeProduct) : []
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[productService] API unavailable, falling back to mock data', err)
      return [...mockProducts]
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
