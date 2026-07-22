import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import ProductImage from "./ProductImage";
import Price from "./ui/Price";
import Rating from "./ui/Rating";
import Label from "./ui/Label";

// Catalog card: flat surface, 1px border separation, no shadow. Category is the
// tertiary label (top), title secondary, price the heaviest element in the card.
export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  return (
    <Link
      to={`/product/${product.id}`}
      data-transition
      className="group flex flex-col border border-border bg-surface hover:border-border-visible"
    >
      <div className="relative aspect-square border-b border-border">
        <ProductImage type={product.silhouette} className="h-full w-full" />
        <span className="absolute left-md top-md">
          <Label tone="disabled">{product.category}</Label>
        </span>
        {soldOut && (
          <span className="absolute right-md top-md font-body text-label uppercase tracking-[0.08em] text-accent">
            [ SOLD OUT ]
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-md p-md">
        <h3 className="font-body text-body-sm leading-snug text-text-primary group-hover:text-text-display">
          {product.title}
        </h3>
        <Rating value={product.rating} />
        <div className="mt-auto flex items-end justify-between pt-sm">
          <Price amount={product.price} size="md" />
          <Label tone="disabled">{product.etaDays}D ETA</Label>
        </div>
      </div>
    </Link>
  );
}
