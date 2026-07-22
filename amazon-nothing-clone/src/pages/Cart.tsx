import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../state/CartContext";
import ProductImage from "../components/ProductImage";
import Price from "../components/ui/Price";
import Label from "../components/ui/Label";
import Button from "../components/ui/Button";
import StatRow from "../components/ui/StatRow";
import QuantityControl from "../components/ui/QuantityControl";

const SHIPPING = 0; // demo: free
const TAX_RATE = 0.08;

export default function Cart() {
  const { lines, subtotal, setQty, remove, count, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + SHIPPING + tax;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-lg py-4xl">
        <div className="dot-grid flex flex-col items-center justify-center gap-md rounded-md py-4xl text-center">
          <p className="font-body text-heading text-text-secondary">CART EMPTY</p>
          <p className="max-w-[36ch] font-body text-body-sm text-text-disabled">
            No line items. Add products from the catalog to begin an order.
          </p>
          <Link to="/" className="mt-md">
            <Button variant="secondary">BROWSE CATALOG</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-lg pb-3xl pt-xl">
      <div className="mb-xl flex items-baseline justify-between">
        <h1 className="font-body text-display-md text-text-display">CART</h1>
        <Label tone="secondary">{count} ITEMS</Label>
      </div>

      <div className="grid grid-cols-1 gap-2xl lg:grid-cols-[1fr_360px]">
        {/* Line items as data rows with dividers */}
        <div className="border-t border-border-visible">
          {lines.map((line) => (
            <div
              key={line.product.id}
              className="flex items-center gap-md border-b border-border py-lg"
            >
              <Link
                to={`/product/${line.product.id}`}
                className="h-[72px] w-[72px] flex-shrink-0 border border-border"
              >
                <ProductImage type={line.product.silhouette} className="h-full w-full" />
              </Link>
              <div className="min-w-0 flex-1">
                <Label tone="disabled">{line.product.category}</Label>
                <Link
                  to={`/product/${line.product.id}`}
                  className="block truncate font-body text-body-sm text-text-primary hover:text-text-display"
                >
                  {line.product.title}
                </Link>
                <div className="mt-sm">
                  <QuantityControl
                    qty={line.qty}
                    onChange={(q) => setQty(line.product.id, q)}
                    max={Math.max(1, line.product.stock)}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-sm">
                <Price amount={line.product.price * line.qty} size="md" />
                <button
                  onClick={() => remove(line.product.id)}
                  aria-label={`Remove ${line.product.title}`}
                  className="text-text-disabled hover:text-accent"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
          <div className="py-lg">
            <Button variant="ghost" onClick={clear}>
              CLEAR CART
            </Button>
          </div>
        </div>

        {/* Order summary — stat rows */}
        <aside className="h-fit border border-border bg-surface p-lg">
          <Label tone="secondary" className="mb-sm block">
            ORDER SUMMARY
          </Label>
          <div className="divide-y divide-border">
            <StatRow label="SUBTOTAL" value={`$${subtotal.toLocaleString()}`} />
            <StatRow label="SHIPPING" value={SHIPPING === 0 ? "FREE" : `$${SHIPPING}`} status="good" />
            <StatRow label="EST. TAX" value={`$${tax.toLocaleString()}`} />
            <StatRow label="TOTAL" value={`$${total.toLocaleString()}`} strong />
          </div>
          <div className="mt-lg">
            <Button variant="primary" full onClick={() => setPlaced(true)}>
              CHECKOUT
            </Button>
          </div>
          {placed && (
            <p className="mt-md text-center font-body text-label uppercase tracking-[0.08em] text-success">
              [ ORDER PLACED — DEMO ]
            </p>
          )}
          <p className="mt-md font-body text-label uppercase tracking-[0.08em] text-text-disabled">
            SAMPLE CHECKOUT · NO PAYMENT PROCESSED
          </p>
        </aside>
      </div>
    </div>
  );
}
