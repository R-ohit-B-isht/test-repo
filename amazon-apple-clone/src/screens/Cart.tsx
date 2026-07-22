import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { ProductImage } from '../components/ProductImage'
import { Button, Stepper } from '../components/ui'
import { Icon } from '../components/Icon'
import { useCart } from '../state/CartContext'
import { useToast } from '../state/ToastContext'
import { formatPrice } from '../lib/format'

export function Cart() {
  const { lines, subtotal, count, setQty, remove, clear } = useCart()
  const { notify } = useToast()
  const [placed, setPlaced] = useState(false)

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 5.99
  const tax = subtotal * 0.0875
  const total = subtotal + shipping + tax

  if (lines.length === 0) {
    return (
      <div className="pb-[96px] sm:pb-2xl">
        <NavBar title="Cart" />
        <main className="mx-auto flex max-w-[700px] flex-col items-center gap-md px-md pt-[15vh] text-center">
          <span className="text-label-tertiary">
            <Icon name="cart" size={56} weight={1.4} />
          </span>
          <h2 className="text-headline font-semibold">Your Cart Is Empty</h2>
          <p className="max-w-[280px] text-subheadline text-label-secondary">
            {placed
              ? 'Thanks! Your order has been placed.'
              : 'Browse the store and add items to get started.'}
          </p>
          <Link to="/">
            <Button variant="prominent">Continue Shopping</Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="pb-[96px] sm:pb-2xl">
      <NavBar title="Cart" />

      <main className="mx-auto max-w-[760px] px-md pt-md">
        {/* Inline section note — cart-level message. */}
        {shipping > 0 ? (
          <div
            className="mb-md flex items-start gap-sm rounded-card p-md text-footnote"
            style={{
              background: 'color-mix(in srgb, var(--tint) 12%, transparent)',
              color: 'var(--label)',
            }}
            role="note"
          >
            <span className="text-tint">
              <Icon name="truck.box.fill" size={16} />
            </span>
            <span>
              Add {formatPrice(100 - subtotal)} more to qualify for{' '}
              <span className="font-semibold">free shipping</span>.
            </span>
          </div>
        ) : null}

        {/* Line items as grouped list rows, hairline-separated (no zebra). */}
        <section aria-label="Items">
          <div
            className="overflow-hidden rounded-card bg-grouped-secondary"
            style={{ border: '0.5px solid var(--separator)' }}
          >
            {lines.map((line, i) => (
              <div
                key={line.product.id}
                className={`flex gap-md p-md ${i > 0 ? 'hairline-t' : ''}`}
              >
                <Link to={`/product/${line.product.id}`} className="shrink-0">
                  <ProductImage
                    product={line.product}
                    className="h-[72px] w-[72px]"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-xs">
                  <Link
                    to={`/product/${line.product.id}`}
                    className="line-clamp-2 text-subheadline font-semibold"
                  >
                    {line.product.title}
                  </Link>
                  <span className="text-footnote text-label-secondary">
                    {formatPrice(line.product.price)} each
                  </span>
                  <div className="mt-xs flex items-center justify-between">
                    <Stepper
                      value={line.qty}
                      min={1}
                      onChange={(v) => setQty(line.product.id, v)}
                    />
                    <button
                      className="press flex h-[44px] w-[44px] items-center justify-center text-red"
                      onClick={() => remove(line.product.id)}
                      aria-label={`Remove ${line.product.title}`}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>
                <span className="shrink-0 self-start text-body font-semibold tabular-nums">
                  {formatPrice(line.product.price * line.qty)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Order summary: label→value rows. */}
        <section aria-labelledby="summary-heading" className="mt-xl">
          <h2
            id="summary-heading"
            className="mb-sm px-xs text-footnote font-semibold uppercase tracking-wide text-label-secondary"
          >
            Order Summary
          </h2>
          <div
            className="overflow-hidden rounded-card bg-grouped-secondary"
            style={{ border: '0.5px solid var(--separator)' }}
          >
            <SummaryRow label={`Subtotal (${count} items)`} value={formatPrice(subtotal)} />
            <SummaryRow
              label="Shipping"
              value={shipping === 0 ? 'Free' : formatPrice(shipping)}
              hairline
              accent={shipping === 0 ? 'var(--green)' : undefined}
            />
            <SummaryRow label="Estimated Tax" value={formatPrice(tax)} hairline />
            <SummaryRow label="Total" value={formatPrice(total)} hairline bold />
          </div>
        </section>

        <div className="mt-xl flex flex-col gap-sm">
          <Button
            variant="prominent"
            size="lg"
            full
            onClick={() => {
              clear()
              setPlaced(true)
              notify('Order Placed')
            }}
          >
            Checkout · {formatPrice(total)}
          </Button>
          <Link to="/" className="text-center text-subheadline font-semibold text-tint">
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  hairline,
  bold,
  accent,
}: {
  label: string
  value: string
  hairline?: boolean
  bold?: boolean
  accent?: string
}) {
  return (
    <div
      className={`flex min-h-[44px] items-center justify-between px-md py-sm ${
        hairline ? 'hairline-t' : ''
      }`}
    >
      <span className={`text-body ${bold ? 'font-semibold text-label' : 'text-label'}`}>
        {label}
      </span>
      <span
        className={`text-body tabular-nums ${bold ? 'font-bold' : 'font-medium'}`}
        style={{ color: accent ?? (bold ? 'var(--label)' : 'var(--label-secondary)') }}
      >
        {value}
      </span>
    </div>
  )
}
