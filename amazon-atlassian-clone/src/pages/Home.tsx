import { products } from '../data/products'
import { useRouter } from '../context/RouterContext'
import { useCart } from '../context/CartContext'
import { useFlags } from '../context/FlagContext'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { Button } from '../components/Button'
import { Lozenge } from '../components/Lozenge'
import { StarRating } from '../components/StarRating'
import { Icon } from '../components/Icon'
import { splitPrice } from '../lib/format'

export function Home() {
  const { navigate } = useRouter()
  const { add } = useCart()
  const { showFlag } = useFlags()

  const deal = products.find((p) => p.id === 'p07')! // best discount, in stock
  const dealPrice = splitPrice(deal.price)
  const grid = products.filter((p) => p.id !== deal.id)

  return (
    <div className="flex flex-col gap-8">
      {/* One <h1> per page */}
      <h1 className="sr-only">Zaphlo storefront</h1>

      {/* Hero "deal" moment — the single primary layer: a bold metric price + one primary action */}
      <section
        aria-labelledby="deal-heading"
        className="grid gap-6 rounded-xl bg-surface p-6 shadow-raised md:grid-cols-[1fr_320px] md:p-8"
      >
        <div className="flex flex-col justify-center gap-3">
          <span className="flex items-center gap-2">
            <Lozenge appearance="new">Deal of the day</Lozenge>
          </span>
          <h2 id="deal-heading" className="m-0 text-display-md font-bold text-display">
            {deal.title}
          </h2>
          <StarRating rating={deal.rating} count={deal.ratingCount} />
          <p className="m-0 flex items-start text-display">
            <span className="mt-2 text-heading font-bold">$</span>
            <span className="text-metric-hero font-bold tracking-tight">{dealPrice.whole}</span>
            <span className="mt-2 text-heading font-bold">{dealPrice.frac}</span>
          </p>
          {deal.listPrice && (
            <p className="m-0 text-body text-subtle">
              <span className="line-through">${deal.listPrice.toFixed(2)}</span>{' '}
              <span className="font-medium text-[color:var(--lz-success-text)]">
                Save ${(deal.listPrice - deal.price).toFixed(2)}
              </span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            <Button
              appearance="primary"
              iconBefore={<Icon name="cart" size={16} />}
              onClick={() => {
                add(deal.id)
                showFlag({ appearance: 'success', title: 'Added to cart', description: deal.title })
              }}
            >
              Add to cart
            </Button>
            <Button appearance="subtle" onClick={() => navigate({ name: 'product', id: deal.id })}>
              View details
            </Button>
          </div>
        </div>
        <ProductImage product={deal} className="aspect-square w-full" rounded="rounded-lg" />
      </section>

      <section aria-labelledby="catalog-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 id="catalog-heading" className="m-0 text-heading font-bold text-display">
            Featured products
          </h2>
          <button
            type="button"
            onClick={() => navigate({ name: 'search' })}
            className="text-body text-link hover:underline"
          >
            See all
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grid.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
