import axios from 'axios'

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
})

const storedToken = getStoredToken()
if (storedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
