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

interface RawAuthResponse {
  token?: string
  access_token?: string
  jwt?: string
  user?: {
    id?: string
    _id?: string
    name?: string
    email?: string
    role?: string
  }
}

interface RegisterPayload {
  name: string
  email: string
  password: string
}

function normalizeAuthResponse(data: RawAuthResponse): AuthResponse {
  const token = data.token ?? data.access_token ?? data.jwt ?? ''
  const rawUser = data.user ?? {}

  if (import.meta.env.DEV && !token) {
    console.warn('[authService] Auth response missing token, response shape may have changed:', data)
  }

  return {
    token,
    user: {
      id: rawUser.id ?? rawUser._id ?? '',
      name: rawUser.name ?? '',
      email: rawUser.email ?? '',
      role: (rawUser.role as 'admin' | 'customer') ?? 'customer',
    },
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<RawAuthResponse>('/auth/login', { email, password })
  return normalizeAuthResponse(data)
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<RawAuthResponse>('/auth/register', payload)
  return normalizeAuthResponse(data)
}
