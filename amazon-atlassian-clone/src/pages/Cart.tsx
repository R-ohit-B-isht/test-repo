import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useRouter } from '../context/RouterContext'
import { useFlags } from '../context/FlagContext'
import { ProductImage } from '../components/ProductImage'
import { Stepper } from '../components/Stepper'
import { Button } from '../components/Button'
import { SectionMessage } from '../components/SectionMessage'
import { Icon } from '../components/Icon'
import { formatPrice } from '../lib/format'

function StatRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={strong ? 'text-body font-medium text-ink' : 'text-body text-subtle'}>{label}</span>
      <span className={strong ? 'text-subheading font-bold text-display' : 'text-body text-ink'}>{value}</span>
    </div>
  )
}

export function Cart() {
  const { itemsWithProduct, subtotal, setQty, remove, clear, count } = useCart()
  const { navigate } = useRouter()
  const { showFlag } = useFlags()
  const [placed, setPlaced] = useState(false)

  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax
  const hasLowStock = itemsWithProduct.some(({ product }) => product.stock === 'low-stock')

  if (itemsWithProduct.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="m-0 text-heading font-bold text-display">Your cart is empty</h1>
        <p className="m-0 max-w-sm text-body text-subtle">
          Browse the catalog and add items — they’ll show up here.
        </p>
        <Button appearance="primary" onClick={() => navigate({ name: 'home' })}>
          Continue shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-display-md font-bold text-display">Shopping cart</h1>

      {placed && (
        <SectionMessage appearance="success" title="Order placed">
          This is a demo checkout — no payment was processed.
        </SectionMessage>
      )}
      {hasLowStock && !placed && (
        <SectionMessage appearance="warning" title="Some items are low on stock">
          Low-stock items may sell out before you check out. Order soon to secure them.
        </SectionMessage>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Line items — data rows separated by dividers, no zebra striping */}
        <section aria-label="Cart items" className="rounded-lg bg-surface p-4">
          {itemsWithProduct.map(({ product, qty }, i) => (
            <div
              key={product.id}
              className={`flex gap-4 py-4 ${i > 0 ? 'border-t border-[color:var(--border)]' : ''}`}
            >
              <button
                onClick={() => navigate({ name: 'product', id: product.id })}
                aria-label={`View ${product.title}`}
                className="shrink-0"
              >
                <ProductImage product={product} className="h-20 w-20" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <button
                  onClick={() => navigate({ name: 'product', id: product.id })}
                  className="text-left text-body font-medium text-ink hover:text-link hover:underline"
                >
                  {product.title}
                </button>
                <p className="m-0 text-caption text-subtle">{product.category}</p>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <Stepper value={qty} onChange={(q) => setQty(product.id, q)} min={0} />
                  <Button
                    appearance="link"
                    onClick={() => {
                      remove(product.id)
                      showFlag({ appearance: 'info', title: 'Removed from cart', description: product.title })
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="m-0 text-subheading font-bold text-display">
                  {formatPrice(product.price * qty)}
                </p>
                <p className="m-0 text-caption text-subtle">{formatPrice(product.price)} each</p>
              </div>
            </div>
          ))}
        </section>

        {/* Order summary — stat rows */}
        <aside className="h-fit rounded-lg bg-surface-raised p-4 shadow-raised lg:sticky lg:top-20">
          <h2 className="m-0 mb-2 text-subheading font-bold text-display">Order summary</h2>
          <StatRow label={`Subtotal (${count} item${count === 1 ? '' : 's'})`} value={formatPrice(subtotal)} />
          <StatRow label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
          <StatRow label="Estimated tax" value={formatPrice(tax)} />
          <div className="my-2 border-t border-[color:var(--border)]" />
          <StatRow label="Order total" value={formatPrice(total)} strong />
          <div className="mt-4 flex flex-col gap-2">
            <Button
              appearance="primary"
              fullWidth
              iconBefore={<Icon name="check" size={16} />}
              onClick={() => {
                setPlaced(true)
                clear()
                showFlag({ appearance: 'success', title: 'Order placed', description: 'Thanks for shopping!' })
              }}
            >
              Proceed to checkout
            </Button>
            <Button appearance="subtle" fullWidth onClick={() => navigate({ name: 'home' })}>
              Continue shopping
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
