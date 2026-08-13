import { useState, useEffect, memo } from 'react'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || '')
  const [loaded, setLoaded] = useState(false)
  const [hadError, setHadError] = useState(false)

  useEffect(() => {
    setImgSrc(src || '')
    setLoaded(false)
    setHadError(false)
  }, [src])

  if (!imgSrc || hadError) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-surface-elevated ${className}`}>
        <div className="flex flex-col items-center gap-2 text-accent/25">
          <svg className="h-10 w-10 transition-transform duration-500 group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary/35">ShopNest</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-surface-elevated" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setHadError(true)}
      />
    </div>
  )
}

export default memo(ProductImage)
