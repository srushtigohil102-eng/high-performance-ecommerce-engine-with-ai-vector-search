import type { ReactNode } from 'react'

interface ErrorMessageProps {
  message: string
  children?: ReactNode
}

export default function ErrorMessage({ message, children }: ErrorMessageProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
