import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getProduct, type Product } from '../data/products'

export interface CartLine {
  productId: string
  qty: number
}

interface CartValue {
  lines: CartLine[]
  count: number
  subtotal: number
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  itemsWithProduct: { product: Product; qty: number }[]
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([
    { productId: 'p01', qty: 1 },
    { productId: 'p12', qty: 2 },
  ])

  const add = (productId: string, qty = 1) =>
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
      return [...prev, { productId, qty }]
    })

  const setQty = (productId: string, qty: number) =>
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    )

  const remove = (productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId))
  const clear = () => setLines([])

  const itemsWithProduct = useMemo(
    () =>
      lines
        .map((l) => {
          const product = getProduct(l.productId)
          return product ? { product, qty: l.qty } : null
        })
        .filter((x): x is { product: Product; qty: number } => x !== null),
    [lines],
  )

  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = itemsWithProduct.reduce((sum, { product, qty }) => sum + product.price * qty, 0)

  const value: CartValue = { lines, count, subtotal, add, setQty, remove, clear, itemsWithProduct }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
