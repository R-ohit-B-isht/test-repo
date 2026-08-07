import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { products, type Product } from '../data/products'

export type CartLine = { product: Product; qty: number }

type CartValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  add: (product: Product, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

const initial: CartLine[] = [
  { product: products.find((p) => p.id === 'aurora-headphones')!, qty: 1 },
  { product: products.find((p) => p.id === 'lumen-smart-bulb')!, qty: 2 },
]

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(initial)

  const add = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + qty } : l,
        )
      }
      return [...prev, { product, qty }]
    })
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== id))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0)

  const value = useMemo(
    () => ({ lines, count, subtotal, add, setQty, remove, clear }),
    [lines, count, subtotal, add, setQty, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
