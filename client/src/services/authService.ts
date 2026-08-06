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
  // Backend returns flat: { _id, name, email, role, token }
  // Also handle nested: { user: { id, name, ... }, token }
  _id?: string
  id?: string
  name?: string
  email?: string
  role?: string
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

  // Backend returns user fields at top level (_id, name, email, role)
  // Also handle nested { user: { ... } } shape as fallback
  const rawUser = data.user ?? {}

  const id = rawUser.id ?? rawUser._id ?? data._id ?? data.id ?? ''
  const name = rawUser.name ?? data.name ?? ''
  const email = rawUser.email ?? data.email ?? ''
  const role = (rawUser.role ?? data.role ?? 'customer') as 'admin' | 'customer'

  if (import.meta.env.DEV && !token) {
    console.warn('[authService] Auth response missing token, response shape may have changed:', data)
  }

  return {
    token,
    user: { id, name, email, role },
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
