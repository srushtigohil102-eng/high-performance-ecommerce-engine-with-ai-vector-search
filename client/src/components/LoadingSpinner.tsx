interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div
        className={`animate-spin rounded-full border-gray-300 border-t-gray-900 ${sizeClasses[size]}`}
      />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  )
}
