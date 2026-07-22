import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, PRODUCTS, type Category } from "../data/products";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import Price from "../components/ui/Price";
import Label from "../components/ui/Label";
import Button from "../components/ui/Button";
import SegmentedBar from "../components/ui/SegmentedBar";

type Filter = Category | "ALL";

// Hero "deal of the day" — the single most expressive moment on the page.
const DEAL = PRODUCTS.find((p) => p.id === "nd-over-2")!;
const DEAL_WAS = 349;

export default function Home() {
  const [active, setActive] = useState<Filter>("ALL");

  const grid = useMemo(
    () => (active === "ALL" ? PRODUCTS : PRODUCTS.filter((p) => p.category === active)),
    [active],
  );

  const cats: Filter[] = ["ALL", ...CATEGORIES];

  return (
    <div className="mx-auto max-w-[1200px] px-lg pb-3xl pt-xl">
      {/* HERO — three-layer hierarchy: price (primary) / title (secondary) / meta (tertiary) */}
      <section className="mb-2xl grid grid-cols-1 items-stretch border border-border-visible md:grid-cols-2">
        <div className="dot-grid relative flex items-center justify-center border-b border-border-visible p-2xl md:border-b-0 md:border-r">
          <ProductImage type={DEAL.silhouette} className="aspect-square w-full max-w-[360px]" />
          <span className="absolute left-lg top-lg font-body text-label uppercase tracking-[0.08em] text-accent">
            ● DEAL OF THE DAY
          </span>
        </div>
        <div className="flex flex-col justify-center gap-lg p-2xl">
          <Label tone="secondary">{DEAL.category} / LIMITED DROP</Label>
          <h1 className="font-body text-heading leading-tight text-text-primary">
            {DEAL.title}
          </h1>
          <div className="flex items-end gap-md">
            <Price amount={DEAL.price} size="hero" />
            <span className="mb-sm font-body text-body text-text-disabled line-through">
              {DEAL_WAS}
            </span>
          </div>
          <div className="max-w-[320px]">
            <div className="mb-xs flex items-center justify-between">
              <Label tone="secondary">STOCK</Label>
              <span className="font-body text-body-sm text-warning">{DEAL.stock} LEFT</span>
            </div>
            <SegmentedBar filled={3} total={20} status="moderate" size="standard" />
          </div>
          <div className="flex gap-md pt-sm">
            <Link to={`/product/${DEAL.id}`}>
              <Button variant="primary">VIEW DROP</Button>
            </Link>
            <Link to="/search">
              <Button variant="secondary">ALL DEALS</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY NAV — bracket / pipe style */}
      <nav className="mb-xl flex flex-wrap items-center gap-md">
        {cats.map((c, i) => {
          const on = c === active;
          return (
            <span key={c} className="flex items-center gap-md">
              {i > 0 && <span className="text-text-disabled">|</span>}
              <button
                data-transition
                onClick={() => setActive(c)}
                className={[
                  "font-body text-label uppercase tracking-[0.08em]",
                  on ? "text-text-display" : "text-text-disabled hover:text-text-secondary",
                ].join(" ")}
              >
                {on ? `[ ${c} ]` : c}
              </button>
            </span>
          );
        })}
      </nav>

      <div className="mb-lg flex items-baseline justify-between">
        <Label tone="secondary">
          {active === "ALL" ? "ALL PRODUCTS" : active} — {grid.length} ITEMS
        </Label>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-4">
        {grid.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
