import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { ProductImage } from './ProductImage'
import { RatingStars, StatusPill } from './ui'
import { formatPrice } from '../lib/format'

/*
  Grouped-background content card: secondarySystemGroupedBackground surface,
  continuous ~12px corners, hairline detail — NO drop shadow (HIG: content
  cards use grouped background + hairline, not elevation).
*/
export function ProductCard({ product }: { product: Product }) {
  const discounted = product.listPrice && product.listPrice > product.price
  return (
    <Link
      to={`/product/${product.id}`}
      className="press spring group flex flex-col overflow-hidden rounded-card bg-grouped-secondary hairline-b"
      style={{ border: '0.5px solid var(--separator)' }}
    >
      <ProductImage product={product} rounded="rounded-none" className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-xs p-md">
        <span className="text-caption-1 font-semibold uppercase tracking-wide text-label-tertiary">
          {product.category}
        </span>
        <h3 className="line-clamp-2 text-subheadline font-semibold text-label">
          {product.title}
        </h3>
        <div className="flex items-center gap-xs">
          <RatingStars rating={product.rating} size={13} />
          <span className="text-caption-1 text-label-secondary">
            {product.rating.toFixed(1)}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-xs">
          <div className="flex flex-col">
            <span className="text-title-3 font-bold text-label">
              {formatPrice(product.price)}
            </span>
            {discounted ? (
              <span className="text-caption-1 text-label-secondary line-through">
                {formatPrice(product.listPrice!)}
              </span>
            ) : null}
          </div>
          {!product.inStock ? (
            <StatusPill status="error" icon="exclamationmark.circle.fill">
              Sold Out
            </StatusPill>
          ) : product.fastDelivery ? (
            <StatusPill status="success" icon="truck.box.fill">
              Fast
            </StatusPill>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
