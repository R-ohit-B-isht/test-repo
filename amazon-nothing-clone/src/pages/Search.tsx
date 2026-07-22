import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { CATEGORIES, PRODUCTS, type Category } from "../data/products";
import ProductCard from "../components/ProductCard";
import Chip from "../components/ui/Chip";
import Label from "../components/ui/Label";
import SegmentedControl from "../components/ui/SegmentedControl";

type Sort = "REL" | "PRICE_ASC" | "PRICE_DESC" | "RATING";

const SORTS: { value: Sort; label: string }[] = [
  { value: "REL", label: "RELEVANCE" },
  { value: "PRICE_ASC", label: "PRICE ↑" },
  { value: "PRICE_DESC", label: "PRICE ↓" },
  { value: "RATING", label: "RATING" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<Set<Category>>(new Set());
  const [sort, setSort] = useState<Sort>("REL");

  const toggleCat = (c: Category) =>
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      const matchQ =
        q === "" ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.specs.some((s) => s.toLowerCase().includes(q));
      const matchCat = cats.size === 0 || cats.has(p.category);
      return matchQ && matchCat;
    });
    list = [...list];
    if (sort === "PRICE_ASC") list.sort((a, b) => a.price - b.price);
    else if (sort === "PRICE_DESC") list.sort((a, b) => b.price - a.price);
    else if (sort === "RATING") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [query, cats, sort]);

  return (
    <div className="mx-auto max-w-[1200px] px-lg pb-3xl pt-xl">
      {/* Underline-style search input */}
      <div className="mb-xl">
        <Label tone="secondary" className="mb-sm block">
          SEARCH CATALOG
        </Label>
        <div className="flex items-center gap-md border-b border-border-visible pb-sm focus-within:border-text-primary">
          <SearchIcon size={18} strokeWidth={1.5} className="text-text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TYPE A PRODUCT, CATEGORY OR SPEC…"
            className="w-full bg-transparent font-body text-subheading text-text-display placeholder:text-text-disabled placeholder:text-body-sm placeholder:uppercase placeholder:tracking-[0.06em] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="font-body text-label uppercase tracking-[0.08em] text-text-disabled hover:text-text-primary"
            >
              [ X ]
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-lg flex flex-wrap items-center gap-sm">
        <Label tone="disabled" className="mr-sm">
          FILTER
        </Label>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={cats.has(c)} onClick={() => toggleCat(c)} />
        ))}
        {cats.size > 0 && (
          <button
            onClick={() => setCats(new Set())}
            className="ml-xs font-body text-caption uppercase tracking-[0.06em] text-text-disabled hover:text-accent"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Sort + count */}
      <div className="mb-lg flex flex-wrap items-center justify-between gap-md border-t border-border pt-lg">
        <Label tone="secondary">{results.length} RESULTS</Label>
        <SegmentedControl options={SORTS} value={sort} onChange={setSort} />
      </div>

      {results.length === 0 ? (
        <div className="dot-grid flex flex-col items-center gap-md py-4xl text-center">
          <p className="font-body text-heading text-text-secondary">NO MATCHES</p>
          <p className="font-body text-body-sm text-text-disabled">
            Adjust the query or clear filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
