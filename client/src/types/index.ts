export interface Product {
  id: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
}

export interface ProductPayload {
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  stock?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface ApiError {
  message: string
  status: number
}
