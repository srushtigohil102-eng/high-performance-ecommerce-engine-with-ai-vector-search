import { useState, memo } from 'react'

const PLACEHOLDER_SRC = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=No+Image'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_SRC)
  const [loaded, setLoaded] = useState(false)
  const [hadError, setHadError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!hadError) {
            setHadError(true)
            setImgSrc(PLACEHOLDER_SRC)
          }
        }}
      />
    </div>
  )
}

export default memo(ProductImage)
