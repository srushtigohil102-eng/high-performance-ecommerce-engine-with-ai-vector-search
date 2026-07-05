const API_URL = import.meta.env.VITE_API_URL

export async function fetchProducts(): Promise<Response> {
  return fetch(`${API_URL}/products`)
}

export async function fetchProduct(id: string): Promise<Response> {
  return fetch(`${API_URL}/products/${id}`)
}
