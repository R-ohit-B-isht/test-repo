import type { Product } from '../data/products'

/*
  Neutral, generated product silhouette — no scraped assets. A soft gradient
  wash plus a simple monoline silhouette keyed to the product's shape/hue.
*/

function Silhouette({ shape }: { shape: Product['shape'] }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (shape) {
    case 'headphone':
      return (
        <g {...common}>
          <path d="M18 40v-6a22 22 0 0 1 44 0v6" />
          <rect x="12" y="38" width="12" height="20" rx="5" />
          <rect x="56" y="38" width="12" height="20" rx="5" />
        </g>
      )
    case 'device':
      return (
        <g {...common}>
          <rect x="20" y="12" width="40" height="56" rx="7" />
          <line x1="34" y1="60" x2="46" y2="60" />
        </g>
      )
    case 'bottle':
      return (
        <g {...common}>
          <path d="M34 12h12v8l4 6v40a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V26l4-6z" />
        </g>
      )
    case 'circle':
      return (
        <g {...common}>
          <circle cx="40" cy="40" r="24" />
          <circle cx="40" cy="40" r="9" />
        </g>
      )
    case 'box':
    default:
      return (
        <g {...common}>
          <path d="M40 12 66 25v30L40 68 14 55V25z" />
          <path d="M14 25l26 13 26-13M40 38v30" />
        </g>
      )
  }
}

export function ProductImage({
  product,
  className = '',
  rounded = 'rounded-card',
}: {
  product: Product
  className?: string
  rounded?: string
}) {
  const { hue, shape } = product
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 70% 92%), hsl(${(hue + 40) % 360} 65% 84%))`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: `hsl(${hue} 45% 42%)` }}
      >
        <svg viewBox="0 0 80 80" className="h-1/2 w-1/2">
          <Silhouette shape={shape} />
        </svg>
      </div>
    </div>
  )
}
