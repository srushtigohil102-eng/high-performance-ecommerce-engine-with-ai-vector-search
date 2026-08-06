import { createContext, useState, useCallback, useMemo, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  exiting: boolean
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

const EXIT_DURATION = 250
const DISPLAY_DURATION = 3000

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    )
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_DURATION)
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, type, exiting: false }])
      window.setTimeout(() => {
        dismissToast(id)
      }, DISPLAY_DURATION)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  const typeStyles: Record<ToastType, string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-900 text-white dark:bg-gray-700',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${typeStyles[toast.type]} ${
              toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
            }`}
            role="status"
            aria-live="polite"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="ml-2 text-white/70 hover:text-white"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
