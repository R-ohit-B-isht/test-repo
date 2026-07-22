import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { Button, StatusPill } from '../components/ui'
import { products } from '../data/products'
import { formatPrice } from '../lib/format'

export function Home() {
  const deal = products.find((p) => p.id === 'aurora-headphones')!
  const grid = products.filter((p) => p.id !== deal.id)

  return (
    <div className="pb-[96px] sm:pb-2xl">
      <NavBar title="Store" />

      <main className="mx-auto max-w-[1100px] px-md pt-md">
        {/* Hero "deal" moment — the single loud element (Large Title price). */}
        <section aria-labelledby="deal-heading" className="mb-2xl">
          <Link
            to={`/product/${deal.id}`}
            className="press spring block overflow-hidden rounded-card bg-grouped-secondary"
            style={{ border: '0.5px solid var(--separator)' }}
          >
            <div className="grid gap-md p-lg sm:grid-cols-2 sm:items-center">
              <ProductImage
                product={deal}
                className="aspect-[4/3] w-full sm:aspect-square"
              />
              <div className="flex flex-col gap-sm">
                <StatusPill status="caution" icon="bolt.fill">
                  Deal of the Day
                </StatusPill>
                <h2 id="deal-heading" className="text-title-2 font-bold">
                  {deal.title}
                </h2>
                <p className="text-subheadline text-label-secondary">
                  {deal.description}
                </p>
                <div className="mt-xs flex items-baseline gap-sm">
                  <span className="text-large-title font-bold tracking-tight">
                    {formatPrice(deal.price)}
                  </span>
                  {deal.listPrice ? (
                    <span className="text-body text-label-secondary line-through">
                      {formatPrice(deal.listPrice)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-sm">
                  <Button variant="prominent">Shop the Deal</Button>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Catalog grid of grouped-background cards. */}
        <section aria-labelledby="catalog-heading">
          <div className="mb-md flex items-center justify-between">
            <h2 id="catalog-heading" className="text-title-3 font-bold">
              Featured
            </h2>
            <Link
              to="/search"
              className="text-subheadline font-semibold text-tint"
            >
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-4">
            {grid.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
