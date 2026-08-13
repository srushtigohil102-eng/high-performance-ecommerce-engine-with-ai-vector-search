import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm hover:shadow-md hover:brightness-115 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus:ring-primary',
  secondary:
    'bg-surface-elevated text-text-primary border border-border hover:bg-border/60 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus:ring-border',
  outline:
    'border border-border text-text-primary hover:bg-surface-elevated hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus:ring-border',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
