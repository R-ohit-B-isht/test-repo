import { useState } from 'react'
import { getProduct } from '../data/products'
import { useRouter } from '../context/RouterContext'
import { useCart } from '../context/CartContext'
import { useFlags } from '../context/FlagContext'
import { ProductImage } from '../components/ProductImage'
import { Button } from '../components/Button'
import { Stepper } from '../components/Stepper'
import { StarRating } from '../components/StarRating'
import { ProgressBar } from '../components/ProgressBar'
import { Lozenge } from '../components/Lozenge'
import { SectionMessage } from '../components/SectionMessage'
import { Icon } from '../components/Icon'
import { StockLozenge, deliveryText } from '../lib/status'
import { splitPrice } from '../lib/format'

export function ProductDetail({ id }: { id: string }) {
  const product = getProduct(id)
  const { navigate } = useRouter()
  const { add } = useCart()
  const { showFlag } = useFlags()
  const [qty, setQty] = useState(1)

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-heading font-bold text-display">Product not found</h1>
        <p className="mt-2 text-body text-subtle">This item may have been removed.</p>
        <div className="mt-4 flex justify-center">
          <Button appearance="primary" onClick={() => navigate({ name: 'home' })}>
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  const price = splitPrice(product.price)
  const outOfStock = product.stock === 'out-of-stock'
  // Illustrative rating breakdown derived from the sample rating (demo data, not telemetry).
  const fiveStarShare = Math.max(0, Math.min(1, (product.rating - 2.5) / 2.5))

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-caption text-subtle">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-ink hover:underline">
          Home
        </button>
        <Icon name="chevron-right" size={12} />
        <button
          onClick={() => navigate({ name: 'search', category: product.category })}
          className="hover:text-ink hover:underline"
        >
          {product.category}
        </button>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage product={product} className="aspect-square w-full rounded-xl" rounded="rounded-xl" />

        <div className="flex flex-col gap-4">
          {/* Secondary layer: title + rating */}
          <h1 className="m-0 text-display-md font-bold text-display">{product.title}</h1>
          <StarRating rating={product.rating} count={product.ratingCount} size={16} />

          {/* Primary layer: the hero price */}
          <p className="m-0 flex items-start text-display">
            <span className="mt-2 text-heading font-bold">$</span>
            <span className="text-metric-hero font-bold tracking-tight">{price.whole}</span>
            <span className="mt-2 text-heading font-bold">{price.frac}</span>
          </p>
          {product.listPrice && (
            <p className="m-0 text-body text-subtle">
              <span className="line-through">${product.listPrice.toFixed(2)}</span>{' '}
              <span className="font-medium text-[color:var(--lz-success-text)]">
                Save ${(product.listPrice - product.price).toFixed(2)}
              </span>
            </p>
          )}

          {/* Status via Lozenges (color + text, never color alone) */}
          <div className="flex flex-wrap items-center gap-2">
            <StockLozenge stock={product.stock} />
            {product.prime && <Lozenge appearance="inprogress">Free delivery</Lozenge>}
          </div>

          <p className="m-0 flex items-center gap-2 text-body text-ink">
            <Icon name="truck" size={16} />
            {deliveryText(product)}
          </p>

          <p className="m-0 text-body text-ink">{product.description}</p>

          {!outOfStock ? (
            <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--border)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-caption text-subtle">Quantity</span>
                <Stepper value={qty} onChange={setQty} />
              </div>
              <Button
                appearance="primary"
                fullWidth
                iconBefore={<Icon name="cart" size={16} />}
                onClick={() => {
                  add(product.id, qty)
                  showFlag({
                    appearance: 'success',
                    title: 'Added to cart',
                    description: `${qty} × ${product.title}`,
                  })
                }}
              >
                Add to cart
              </Button>
            </div>
          ) : (
            <SectionMessage appearance="warning" title="Currently unavailable">
              We don’t know when or if this item will be back in stock.
            </SectionMessage>
          )}
        </div>
      </div>

      {/* Data-dense sections vary their visual form (SKILL §2.9) */}
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="m-0 mb-3 text-heading font-bold text-display">
            Specifications
          </h2>
          <dl className="m-0">
            {product.specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`flex items-center justify-between py-3 ${
                  i > 0 ? 'border-t border-[color:var(--border)]' : ''
                }`}
              >
                <dt className="text-body text-subtle">{spec.label}</dt>
                <dd className="m-0 text-body font-medium text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="ratings-heading">
          <h2 id="ratings-heading" className="m-0 mb-3 text-heading font-bold text-display">
            Customer ratings
          </h2>
          <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
            <ProgressBar
              label="Overall rating"
              valueText={`${product.rating.toFixed(1)} / 5`}
              value={product.rating / 5}
              appearance="success"
            />
            <ProgressBar
              label="5-star reviews"
              valueText={`${Math.round(fiveStarShare * 100)}%`}
              value={fiveStarShare}
            />
            <p className="m-0 text-caption text-subtle">
              Based on {product.ratingCount.toLocaleString()} sample reviews
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
