import type { Product } from '../data/products'
import { useRouter } from '../context/RouterContext'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'
import { StockLozenge } from '../lib/status'
import { Lozenge } from './Lozenge'
import { splitPrice } from '../lib/format'

// Elevation-raised card (elevation.surface.raised + elevation.shadow.raised), radius.large (8px).
export function ProductCard({ product }: { product: Product }) {
  const { navigate } = useRouter()
  const price = splitPrice(product.price)
  const hasDeal = product.listPrice && product.listPrice > product.price

  return (
    <button
      type="button"
      onClick={() => navigate({ name: 'product', id: product.id })}
      className="group flex h-full flex-col gap-3 rounded-lg bg-surface-raised p-4 text-left shadow-raised transition-[box-shadow,transform] duration-100 ease-out-practical hover:shadow-overlay motion-reduce:transform-none"
    >
      <div className="relative">
        <ProductImage product={product} className="aspect-square w-full" />
        {hasDeal && (
          <span className="absolute left-2 top-2">
            <Lozenge appearance="removed">Deal</Lozenge>
          </span>
        )}
      </div>

      <p className="m-0 text-caption text-subtle">{product.category}</p>

      <h3 className="m-0 line-clamp-2 text-body font-medium text-ink">{product.title}</h3>

      <StarRating rating={product.rating} count={product.ratingCount} />

      <div className="mt-auto flex items-end justify-between gap-2">
        <p className="m-0 flex items-start text-display leading-none text-display">
          <span className="mt-1 text-body font-bold">$</span>
          <span className="text-display-lg font-bold">{price.whole}</span>
          <span className="mt-1 text-body font-bold">{price.frac}</span>
        </p>
        <StockLozenge stock={product.stock} />
      </div>

      {hasDeal && (
        <p className="m-0 text-caption text-subtle">
          <span className="line-through">${product.listPrice!.toFixed(2)}</span> list price
        </p>
      )}
    </button>
  )
}
