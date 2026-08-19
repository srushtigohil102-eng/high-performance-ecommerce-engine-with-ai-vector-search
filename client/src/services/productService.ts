import type {
  Product,
  ProductPayload,
  PaginatedResponse,
  SearchResponse,
  SearchSuggestionsResponse,
  TrendingSearch,
  CategoryCount,
  SearchSort,
  ProductQueryParams,
} from '../types'
import { apiClient } from './apiClient'

export async function searchProducts(
  query: string,
  params: {
    page?: number
    limit?: number
    category?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    sort?: SearchSort
  } = {},
): Promise<SearchResponse> {
  if (!query.trim()) {
    return getProducts(params)
  }

  const { data } = await apiClient.get('/search', {
    params: { q: query, ...params },
  })

  // Backend returns { products, total, page, limit, totalPages, searchMethod }
  const products = Array.isArray(data) ? data : data.products ?? []
  return {
    products: products.map(normalizeProduct),
    total: data.total ?? 0,
    page: data.page ?? params.page ?? 1,
    limit: data.limit ?? params.limit ?? 12,
    totalPages: data.totalPages ?? 1,
    searchMethod: (data.searchMethod as SearchResponse['searchMethod']) ?? undefined,
  }
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
  const { data } = await apiClient.get<SearchSuggestionsResponse>('/search/suggest', {
    params: { q: query },
  })
  return {
    queries: data.queries ?? [],
    products: data.products ?? [],
    categories: data.categories ?? [],
  }
}

export async function getTrendingSearches(): Promise<TrendingSearch[]> {
  const { data } = await apiClient.get<{ terms?: TrendingSearch[] }>('/search/trending')
  return data.terms ?? []
}

export async function getCategories(): Promise<CategoryCount[]> {
  const { data } = await apiClient.get<{ categories?: CategoryCount[] }>('/products/categories')
  return data.categories ?? []
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
  rating?: number
  numReviews?: number
}

export function normalizeProduct(raw: ProductResponse): Product {
  const id = raw.id ?? raw._id ?? ''
  return {
    id,
    name: raw.name ?? 'Unknown Product',
    price: typeof raw.price === 'number' ? raw.price : 0,
    description: raw.description ?? '',
    imageUrl: raw.imageUrl ?? 'https://placehold.co/200x200?text=Product',
    category: raw.category ?? '',
    stock: raw.stock,
    rating: raw.rating,
    numReviews: raw.numReviews,
  }
}

export async function getProducts(
  params: ProductQueryParams = {},
): Promise<PaginatedResponse> {
  const { data } = await apiClient.get<ProductResponse[] | PaginatedResponse>(
    '/products',
    { params },
  )

  // Backend returns { products, total, page, limit, totalPages }
  if (Array.isArray(data)) {
    return {
      products: data.map(normalizeProduct),
      total: data.length,
      page: params.page ?? 1,
      limit: params.limit ?? 12,
      totalPages: 1,
    }
  }

  return {
    products: (data.products ?? []).map(normalizeProduct),
    total: data.total ?? 0,
    page: data.page ?? params.page ?? 1,
    limit: data.limit ?? params.limit ?? 12,
    totalPages: data.totalPages ?? 1,
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data } = await apiClient.get<ProductResponse | { product: ProductResponse }>(`/products/${id}`)
  const raw = (data && typeof data === 'object' && 'product' in data) ? (data as { product: ProductResponse }).product : data
  return normalizeProduct(raw)
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
