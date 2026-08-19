import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'jwt_token'

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuthToken(): void {
  removeStoredToken()
  delete apiClient.defaults.headers.common['Authorization']
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Separate instance for the refresh call so it never re-enters the interceptor.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Always attach the latest access token from storage. This means retried
// requests after a silent refresh automatically pick up the new token.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Single-flight refresh: while one refresh is in flight, concurrent 401s are
// queued and retried once the new token arrives.
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null): void {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  )
}

function handleSessionExpired(): void {
  clearAuthToken()
  const currentPath = window.location.pathname
  if (currentPath !== '/login') {
    window.location.href = '/login?session=expired'
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await refreshClient.post<{ token?: string; access_token?: string }>(
      '/auth/refresh',
    )
    const newToken = data.token ?? data.access_token ?? ''
    if (!newToken) return null
    setAuthToken(newToken)
    return newToken
  } catch {
    return null
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined

    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !original ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error)
    }

    if (original._retried) {
      // A retried request still failed — the session is genuinely gone.
      handleSessionExpired()
      return Promise.reject(error)
    }

    const retry = (): Promise<unknown> => {
      original._retried = true
      return apiClient(original)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (token) resolve(retry())
          else reject(error)
        })
      })
    }

    isRefreshing = true
    return refreshAccessToken()
      .then((newToken) => {
        flushQueue(newToken)
        if (newToken) return retry()
        handleSessionExpired()
        throw error
      })
      .catch((err) => {
        flushQueue(null)
        throw err
      })
      .finally(() => {
        isRefreshing = false
      })
  },
)
