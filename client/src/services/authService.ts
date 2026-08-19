import { apiClient } from './apiClient'
import type { User } from '../types'

interface AuthResponse {
  token: string
  user: User
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
  emailVerified?: boolean
  user?: {
    id?: string
    _id?: string
    name?: string
    email?: string
    role?: string
    emailVerified?: boolean
  }
}

interface RegisterPayload {
  name: string
  email: string
  password: string
}

function normalizeAuthResponse(data: RawAuthResponse, suppressTokenWarning = false): AuthResponse {
  const token = data.token ?? data.access_token ?? data.jwt ?? ''

  // Backend returns user fields at top level (_id, name, email, role)
  // Also handle nested { user: { ... } } shape as fallback
  const rawUser = data.user ?? {}

  const id = rawUser.id ?? rawUser._id ?? data._id ?? data.id ?? ''
  const name = rawUser.name ?? data.name ?? ''
  const email = rawUser.email ?? data.email ?? ''
  const role = (rawUser.role ?? data.role ?? 'customer') as 'admin' | 'customer'
  const emailVerified = rawUser.emailVerified ?? data.emailVerified ?? false

  if (import.meta.env.DEV && !token && !suppressTokenWarning) {
    console.warn('[authService] Auth response missing token, response shape may have changed:', data)
  }

  return {
    token,
    user: { id, name, email, role, emailVerified },
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

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<RawAuthResponse>('/auth/me')
  const normalized = normalizeAuthResponse({ ...data }, true)
  return normalized.user
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password })
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.get('/auth/verify-email', { params: { token } })
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post('/auth/resend-verification', { email })
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Server-side cookie invalidation is best-effort; local cleanup proceeds regardless.
  }
}
