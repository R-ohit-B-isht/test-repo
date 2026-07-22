import { createContext, useContext, useMemo, useState } from "react";
import { PRODUCTS, type Product } from "../data/products";

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

// Seed with a couple of demo lines so the cart screen is populated on load.
const SEED: Record<string, number> = { "nd-phone-1": 1, "nd-ear-1": 2 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<string, number>>(SEED);

  const add = (id: string, qty = 1) =>
    setItems((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + qty }));

  const setQty = (id: string, qty: number) =>
    setItems((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const remove = (id: string) =>
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const clear = () => setItems({});

  const value = useMemo<CartValue>(() => {
    const lines: CartLine[] = Object.entries(items)
      .map(([id, qty]) => {
        const product = PRODUCTS.find((p) => p.id === id);
        return product ? { product, qty } : null;
      })
      .filter((l): l is CartLine => l !== null);

    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0);

    return { lines, count, subtotal, add, setQty, remove, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
