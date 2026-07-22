import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getProduct } from "../data/products";
import { useCart } from "../state/CartContext";
import ProductImage from "../components/ProductImage";
import Price from "../components/ui/Price";
import Label from "../components/ui/Label";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import SegmentedBar from "../components/ui/SegmentedBar";
import QuantityControl from "../components/ui/QuantityControl";
import StatRow from "../components/ui/StatRow";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const product = getProduct(id);
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-[1200px] px-lg py-4xl text-center">
        <p className="font-body text-heading text-text-secondary">NO SUCH PRODUCT</p>
        <p className="mt-md font-body text-body-sm text-text-disabled">
          The requested item is not in this catalog.
        </p>
        <Link to="/" className="mt-lg inline-block">
          <Button variant="secondary">BACK TO CATALOG</Button>
        </Link>
      </div>
    );
  }

  const soldOut = product.stock === 0;
  const stockStatus = product.stock === 0 ? "over" : product.stock < 10 ? "moderate" : "good";
  const stockFilled = Math.min(20, Math.ceil((product.stock / 120) * 20)) || (soldOut ? 0 : 1);

  const onAdd = () => {
    add(product.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-lg pb-3xl pt-lg">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="mb-lg flex h-[44px] w-[44px] items-center justify-center rounded-pill border border-border bg-surface text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>

      <div className="grid grid-cols-1 gap-2xl md:grid-cols-2">
        {/* Visual */}
        <div className="dot-grid flex items-center justify-center border border-border-visible p-2xl">
          <ProductImage type={product.silhouette} className="aspect-square w-full max-w-[420px]" />
        </div>

        {/* Info column */}
        <div className="flex flex-col">
          <Label tone="secondary" className="mb-md">
            {product.category}
          </Label>

          {/* PRIMARY LAYER: hero price */}
          <Price amount={product.price} size="hero" className="mb-lg" />

          {/* SECONDARY LAYER: title + blurb */}
          <h1 className="mb-sm font-body text-heading leading-tight text-text-primary">
            {product.title}
          </h1>
          <p className="mb-lg max-w-[42ch] font-body text-body-sm text-text-secondary">
            {product.blurb}
          </p>

          <Rating value={product.rating} reviews={product.reviews} size="standard" className="mb-xl" />

          {/* Quantity + add to cart */}
          <div className="mb-xl flex flex-wrap items-center gap-md">
            <QuantityControl qty={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <Button variant="primary" onClick={onAdd} disabled={soldOut}>
              {soldOut ? "SOLD OUT" : "ADD TO CART"}
            </Button>
            {added && (
              <span className="font-body text-label uppercase tracking-[0.08em] text-success">
                [ ADDED ]
              </span>
            )}
          </div>

          {/* Instrument readouts: stock + delivery */}
          <div className="mb-lg border-t border-border pt-lg">
            <div className="mb-xs flex items-center justify-between">
              <Label tone="secondary">STOCK LEVEL</Label>
              <span
                className={[
                  "font-body text-body-sm tabular-nums",
                  stockStatus === "good"
                    ? "text-success"
                    : stockStatus === "moderate"
                      ? "text-warning"
                      : "text-accent",
                ].join(" ")}
              >
                {soldOut ? "0 UNITS" : `${product.stock} UNITS`}
              </span>
            </div>
            <SegmentedBar filled={stockFilled} total={20} status={stockStatus} size="standard" />
          </div>

          <div className="border-t border-border">
            <StatRow label="DELIVERY ETA" value={product.etaDays.toString()} unit="DAYS" />
            <div className="border-t border-border" />
            <StatRow label="RATING" value={product.rating.toFixed(1)} unit="/ 5" />
          </div>
        </div>
      </div>

      {/* SPECS — secondary layer, data rows */}
      <section className="mt-2xl border-t border-border-visible pt-lg">
        <Label tone="secondary" className="mb-md block">
          SPECIFICATIONS
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {product.specs.map((spec, i) => (
            <div
              key={spec}
              className={[
                "flex items-center justify-between py-md",
                i !== 0 ? "border-t border-border md:border-t-0" : "",
                "md:border-b md:border-border",
              ].join(" ")}
            >
              <Label tone="disabled">SPEC {String(i + 1).padStart(2, "0")}</Label>
              <span className="font-body text-body-sm text-text-primary">{spec}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
