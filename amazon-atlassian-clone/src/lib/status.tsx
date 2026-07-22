import type { Product, Stock } from '../data/products'
import { Lozenge, type LozengeAppearance } from '../components/Lozenge'

// Map stock/delivery to ADS Lozenge appearances. Status is never conveyed by color alone —
// the Lozenge always carries text (e.g. "IN STOCK") in addition to its semantic color.
const stockConfig: Record<Stock, { appearance: LozengeAppearance; label: string }> = {
  'in-stock': { appearance: 'success', label: 'In stock' },
  'low-stock': { appearance: 'moved', label: 'Low stock' },
  'out-of-stock': { appearance: 'removed', label: 'Out of stock' },
}

export function StockLozenge({ stock }: { stock: Stock }) {
  const { appearance, label } = stockConfig[stock]
  return <Lozenge appearance={appearance}>{label}</Lozenge>
}

// eslint-disable-next-line react-refresh/only-export-components
export function deliveryText(product: Product): string {
  if (product.stock === 'out-of-stock') return 'Currently unavailable'
  if (product.deliveryDays <= 1) return 'Free delivery tomorrow'
  return `Free delivery in ${product.deliveryDays} days`
}
