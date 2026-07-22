import type { ReactNode } from 'react'
import type { Product } from '../data/products'

// Neutral, generated product silhouettes — no scraped brand assets, single-color line art
// on a sunken neutral tile so the catalog stays token-driven and calm.
const silhouettes: Record<Product['shape'], ReactNode> = {
  headphones: (
    <path d="M20 52v-8a20 20 0 0 1 40 0v8M18 50h8v18h-8a4 4 0 0 1-4-4V54a4 4 0 0 1 4-4zM62 50h-8v18h8a4 4 0 0 0 4-4V54a4 4 0 0 0-4-4z" />
  ),
  laptop: (
    <path d="M22 26h36a2 2 0 0 1 2 2v26H20V28a2 2 0 0 1 2-2zM12 58h56l-4 6H16z" />
  ),
  mug: (
    <path d="M24 28h26v28a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6zM50 34h8a5 5 0 0 1 0 14h-8" />
  ),
  book: (
    <path d="M24 22h28a4 4 0 0 1 4 4v34H28a4 4 0 0 1-4-4zM24 56a4 4 0 0 1 4-4h28M32 30h16M32 38h16" />
  ),
  shoe: (
    <path d="M14 46c8 0 12-4 18-10l4 6 8 2 12 4a6 6 0 0 1 4 6v4H14zM14 54h48" />
  ),
  ball: (
    <>
      <circle cx="40" cy="40" r="22" />
      <path d="M40 26l8 6-3 10h-10l-3-10zM26 44l9-2M54 44l-9-2M40 26v-8M32 62l3-11M48 62l-3-11" />
    </>
  ),
  controller: (
    <path d="M26 34h28a10 10 0 0 1 10 10v2a8 8 0 0 1-14 5H30a8 8 0 0 1-14-5v-2a10 10 0 0 1 10-10zM24 44h8M28 40v8M50 42v.1M56 46v.1" />
  ),
  camera: (
    <>
      <path d="M18 32h8l4-5h20l4 5h8a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V35a3 3 0 0 1 3-3z" />
      <circle cx="40" cy="46" r="9" />
    </>
  ),
  watch: (
    <>
      <rect x="28" y="28" width="24" height="24" rx="5" />
      <path d="M33 28l2-8h10l2 8M33 52l2 8h10l2-8M40 40v-6M40 40h5" />
    </>
  ),
  blender: (
    <path d="M30 20h20l-3 22H33zM33 42h14v14a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4zM34 60h12v4H34z" />
  ),
}

interface ProductImageProps {
  product: Product
  className?: string
  rounded?: string
}

export function ProductImage({ product, className = '', rounded = 'rounded-lg' }: ProductImageProps) {
  return (
    <div
      className={`flex items-center justify-center bg-surface-sunken ${rounded} ${className}`}
      role="img"
      aria-label={`${product.title} — illustrative product image`}
    >
      <svg
        viewBox="0 0 80 80"
        className="h-1/2 w-1/2 text-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {silhouettes[product.shape]}
      </svg>
    </div>
  )
}
