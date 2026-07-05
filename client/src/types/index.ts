export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  images: string[]
  category: string
  tags: string[]
  stock: number
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface User {
  _id: string
  email: string
  name: string
  role: 'admin' | 'customer'
}

export interface ApiError {
  message: string
  status: number
}
