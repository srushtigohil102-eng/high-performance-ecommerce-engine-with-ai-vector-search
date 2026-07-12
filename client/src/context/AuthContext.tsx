import { createContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const FAKE_USER: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@shop.com',
  role: 'admin',
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  const isAuthenticated = user !== null

  const login = useCallback((email: string, _password: string): boolean => {
    if (email === FAKE_USER.email) {
      setUser(FAKE_USER)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
