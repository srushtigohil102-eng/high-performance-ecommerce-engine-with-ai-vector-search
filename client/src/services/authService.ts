import { apiClient } from './apiClient'

interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'customer'
  }
}

interface RegisterPayload {
  name: string
  email: string
  password: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
  return data
}
