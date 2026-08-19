interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-20 w-20 text-2xl',
}

// Letter avatar — a simple, upload-free profile picture based on the user's name.
export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className={`inline-flex select-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display font-bold text-white shadow-sm ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
