import { createContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import * as authService from '../services/authService'
import { setAuthToken, clearAuthToken } from '../services/apiClient'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  authError: string | null
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwtPayload(token: string): User | null {
  try {
    const base64 = token.split('.')[1]
    const payload = JSON.parse(atob(base64))

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    return {
      id: payload.sub ?? payload.id ?? payload._id ?? '',
      name: payload.name ?? '',
      email: payload.email ?? '',
      role: payload.role ?? 'customer',
      emailVerified: payload.emailVerified ?? undefined,
    }
  } catch {
    return null
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('jwt_token')
    if (stored) {
      const parsed = parseJwtPayload(stored)
      if (!parsed) {
        localStorage.removeItem('jwt_token')
      }
      return parsed
    }
    return null
  })
  const [authError, setAuthError] = useState<string | null>(null)

  const isAuthenticated = user !== null

  // Hydrate the full user profile (name, emailVerified, ...) from /auth/me when
  // a token exists — e.g. after a page refresh, where only the JWT was cached.
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (!token) return

    let cancelled = false
    authService
      .getMe()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken()
          setUser(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      clearAuthToken()
    }
  }, [isAuthenticated])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null)
    try {
      const res = await authService.login(email, password)
      setAuthToken(res.token)
      setUser(res.user)
      return true
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        'Login failed. Please try again.'
      setAuthError(message)
      return false
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setAuthError(null)
    try {
      const res = await authService.register({ name, email, password })
      setAuthToken(res.token)
      setUser(res.user)
      return true
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        'Registration failed. Please try again.'
      setAuthError(message)
      return false
    }
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const profile = await authService.getMe()
      setUser(profile)
    } catch {
      // Keep current user; a failed refresh is non-fatal for the UI.
    }
  }, [])

  const logout = useCallback(() => {
    // Best-effort server-side cookie invalidation, then local cleanup.
    void authService.logout()
    clearAuthToken()
    setUser(null)
  }, [])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, login, register, logout, refreshUser, authError, clearError }),
    [user, isAuthenticated, login, register, logout, refreshUser, authError, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
