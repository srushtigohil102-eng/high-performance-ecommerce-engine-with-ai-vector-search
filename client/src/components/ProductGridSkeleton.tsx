interface ProductGridSkeletonProps {
  count?: number
}

export default function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-11 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
