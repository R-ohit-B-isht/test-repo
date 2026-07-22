import { useMemo, useState } from 'react'
import { products, CATEGORIES, type Product } from '../data/products'
import { useRouter } from '../context/RouterContext'
import { TextField } from '../components/TextField'
import { Tag } from '../components/Tag'
import { Icon } from '../components/Icon'
import { StarRating } from '../components/StarRating'
import { ProductImage } from '../components/ProductImage'
import { StockLozenge } from '../lib/status'
import { SectionMessage } from '../components/SectionMessage'
import { formatPrice } from '../lib/format'

type SortKey = 'title' | 'category' | 'rating' | 'price'
type SortDir = 'asc' | 'desc'

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'title', label: 'Product', align: 'left' },
  { key: 'category', label: 'Category', align: 'left' },
  { key: 'rating', label: 'Rating', align: 'left' },
  { key: 'price', label: 'Price', align: 'right' },
]

export function Search({ query, category }: { query?: string; category?: string }) {
  const { navigate } = useRouter()
  const [term, setTerm] = useState(query ?? '')
  const [activeCategories, setActiveCategories] = useState<string[]>(category ? [category] : [])
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'rating', dir: 'desc' })

  const toggleCategory = (c: string) =>
    setActiveCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    const filtered = products.filter((p) => {
      const matchesTerm =
        !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      const matchesCat = activeCategories.length === 0 || activeCategories.includes(p.category)
      return matchesTerm && matchesCat
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const getVal = (p: Product) => {
        switch (sort.key) {
          case 'price':
            return p.price
          case 'rating':
            return p.rating
          default:
            return p[sort.key].toLowerCase()
        }
      }
      const av = getVal(a)
      const bv = getVal(b)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [term, activeCategories, sort])

  const setSortKey = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'title' || key === 'category' ? 'asc' : 'desc' },
    )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-display-md font-bold text-display">Search products</h1>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-md" role="search">
        <TextField
          label="Search"
          placeholder="Search by name or description"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          iconBefore={<Icon name="search" size={16} />}
        />
      </form>

      <section aria-label="Filters" className="flex flex-col gap-2">
        <span className="text-caption text-subtle">Filter by category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Tag key={c} selected={activeCategories.includes(c)} onClick={() => toggleCategory(c)}>
              {c}
            </Tag>
          ))}
          {activeCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategories([])}
              className="text-caption text-link hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <p className="m-0 text-caption text-subtle">
        {results.length} result{results.length === 1 ? '' : 's'}
      </p>

      {results.length === 0 ? (
        <SectionMessage appearance="info" title="No matching products">
          Try a different search term or clear the category filters.
        </SectionMessage>
      ) : (
        // DynamicTable-style results: sortable header with chevrons, dividers, no zebra striping.
        <div className="overflow-hidden rounded-xl bg-surface">
          <table className="w-full border-collapse text-body">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                {columns.map((col) => {
                  const active = sort.key === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSortKey(col.key)}
                        className={`inline-flex items-center gap-1 text-caption font-bold ${
                          active ? 'text-ink' : 'text-subtle hover:text-ink'
                        } ${col.align === 'right' ? 'flex-row-reverse' : ''}`}
                      >
                        {col.label}
                        <Icon
                          name={active ? (sort.dir === 'asc' ? 'chevron-up' : 'chevron-down') : 'sort'}
                          size={12}
                        />
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {results.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ name: 'product', id: p.id })}
                  className={`cursor-pointer transition-colors duration-100 hover:bg-[color:var(--lz-neutral-bg)] ${
                    i > 0 ? 'border-t border-[color:var(--border)]' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage product={p} className="h-10 w-10" rounded="rounded-sm" />
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">{p.title}</span>
                        <span className="mt-0.5">
                          <StockLozenge stock={p.stock} />
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-subtle">{p.category}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={p.rating} count={p.ratingCount} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatPrice(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
