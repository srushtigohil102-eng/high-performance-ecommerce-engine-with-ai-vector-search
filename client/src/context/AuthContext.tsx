import { createContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import * as authService from '../services/authService'
import { setAuthToken, clearAuthToken } from '../services/apiClient'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  authError: string | null
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwtPayload(token: string): { id: string; name: string; email: string; role: 'admin' | 'customer' } | null {
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

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout, authError, clearError }),
    [user, isAuthenticated, login, logout, authError, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
