import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { ProductImage } from '../components/ProductImage'
import {
  Button,
  ProgressBar,
  RatingStars,
  Stepper,
  StatusPill,
} from '../components/ui'
import { getProduct } from '../data/products'
import { useCart } from '../state/CartContext'
import { useToast } from '../state/ToastContext'
import { formatPrice } from '../lib/format'

export function ProductDetail() {
  const { id } = useParams()
  const product = id ? getProduct(id) : undefined
  const { add } = useCart()
  const { notify } = useToast()
  const [qty, setQty] = useState(1)

  if (!product) {
    return (
      <div>
        <NavBar title="Not Found" back={{ label: 'Store', to: -1 }} large={false} />
        <p className="mx-auto max-w-[700px] px-md pt-2xl text-body text-label-secondary">
          That product could not be found.
        </p>
      </div>
    )
  }

  const discounted = product.listPrice && product.listPrice > product.price
  const stock = product.inStock
    ? product.fastDelivery
      ? { status: 'success' as const, icon: 'truck.box.fill' as const, text: 'In Stock · Free 2-Day Delivery' }
      : { status: 'caution' as const, icon: 'shippingbox.fill' as const, text: 'In Stock · Ships in 3–5 Days' }
    : { status: 'error' as const, icon: 'exclamationmark.circle.fill' as const, text: 'Currently Sold Out' }

  return (
    <div className="pb-[120px] sm:pb-2xl">
      <NavBar title={product.category} back={{ label: 'Store', to: -1 }} large={false} />

      <main className="mx-auto max-w-[900px] px-md pt-md">
        <div className="grid gap-xl sm:grid-cols-2">
          <ProductImage product={product} className="aspect-square w-full" />

          <div className="flex flex-col gap-md">
            {/* Primary layer: hero price (Large Title). */}
            <div className="flex items-baseline gap-sm">
              <span className="text-large-title font-bold tracking-tight">
                {formatPrice(product.price)}
              </span>
              {discounted ? (
                <span className="text-body text-label-secondary line-through">
                  {formatPrice(product.listPrice!)}
                </span>
              ) : null}
            </div>

            {/* Secondary layer: title + summary. */}
            <h1 className="text-title-3 font-semibold">{product.title}</h1>
            <p className="text-body text-label-secondary">{product.description}</p>

            <div className="flex flex-wrap items-center gap-sm">
              <StatusPill status={stock.status} icon={stock.icon}>
                {stock.text}
              </StatusPill>
            </div>

            {/* Ratings via determinate bar + status pill. */}
            <div className="flex flex-col gap-xs rounded-card bg-grouped-secondary p-md" style={{ border: '0.5px solid var(--separator)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <RatingStars rating={product.rating} />
                  <span className="text-headline font-semibold">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-footnote text-label-secondary">
                  {product.reviews.toLocaleString()} ratings
                </span>
              </div>
              <ProgressBar
                value={product.rating / 5}
                label={`${Math.round((product.rating / 5) * 100)}% of 5 stars`}
                color="var(--orange)"
              />
            </div>

            {/* Quantity: stepper. */}
            <div className="flex items-center justify-between">
              <span className="text-body font-medium">Quantity</span>
              <Stepper value={qty} onChange={setQty} />
            </div>

            {/* One prominent action (capsule, filled tint). */}
            <Button
              variant="prominent"
              size="lg"
              full
              leadingIcon="bag.fill"
              disabled={!product.inStock}
              onClick={() => {
                add(product, qty)
                notify('Added to Cart')
              }}
            >
              {product.inStock ? 'Add to Cart' : 'Sold Out'}
            </Button>
          </div>
        </div>

        {/* Tertiary layer: specs as grouped label→value rows. */}
        <section aria-labelledby="specs-heading" className="mt-2xl">
          <h2
            id="specs-heading"
            className="mb-sm px-xs text-footnote font-semibold uppercase tracking-wide text-label-secondary"
          >
            Specifications
          </h2>
          <div
            className="overflow-hidden rounded-card bg-grouped-secondary"
            style={{ border: '0.5px solid var(--separator)' }}
          >
            {product.specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`flex min-h-[44px] items-center justify-between px-md py-sm ${
                  i > 0 ? 'hairline-t' : ''
                }`}
              >
                <span className="text-body text-label">{spec.label}</span>
                <span className="text-body text-label-secondary">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
