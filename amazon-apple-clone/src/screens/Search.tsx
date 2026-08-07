import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { ProductImage } from '../components/ProductImage'
import { Icon } from '../components/Icon'
import { RatingStars } from '../components/ui'
import { categories, products, type Category } from '../data/products'
import { formatPrice } from '../lib/format'

type SortKey = 'title' | 'price' | 'rating'
type SortDir = 'asc' | 'desc'

export function Search() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Category | 'All'>('All')
  const [sortKey, setSortKey] = useState<SortKey>('rating')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = products.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      const matchesCat = active === 'All' || p.category === active
      return matchesQuery && matchesCat
    })
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortKey === 'price') cmp = a.price - b.price
      else cmp = a.rating - b.rating
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [query, active, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'title' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="pb-[96px] sm:pb-2xl">
      <NavBar title="Search" />

      <main className="mx-auto max-w-[1000px] px-md pt-md">
        {/* Rounded search field: tertiary fill, tint caret, clear button. */}
        <div className="relative">
          <span className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-label-secondary">
            <Icon name="magnifyingglass" size={18} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the store"
            aria-label="Search the store"
            className="h-[44px] w-full rounded-control pl-[44px] pr-[44px] text-body outline-none"
            style={{
              background: 'var(--fill-tertiary)',
              color: 'var(--label)',
              caretColor: 'var(--tint)',
            }}
          />
          {query ? (
            <button
              className="press absolute right-sm top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center text-label-tertiary"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <Icon name="xmark.circle.fill" size={20} />
            </button>
          ) : null}
        </div>

        {/* Filter chips (capsule, tertiary fill; selected = tint). */}
        <div
          className="mt-md flex gap-sm overflow-x-auto pb-xs"
          role="group"
          aria-label="Filter by category"
        >
          <Chip label="All" selected={active === 'All'} onClick={() => setActive('All')} />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={active === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>

        {/* Table-style sortable header. */}
        <div className="mt-lg flex items-center gap-md px-md pb-xs text-footnote font-semibold uppercase tracking-wide text-label-secondary">
          <span className="flex-1">
            <SortButton
              label="Product"
              active={sortKey === 'title'}
              dir={sortDir}
              onClick={() => toggleSort('title')}
            />
          </span>
          <span className="w-[90px] text-right">
            <SortButton
              label="Rating"
              active={sortKey === 'rating'}
              dir={sortDir}
              onClick={() => toggleSort('rating')}
            />
          </span>
          <span className="w-[90px] text-right">
            <SortButton
              label="Price"
              active={sortKey === 'price'}
              dir={sortDir}
              onClick={() => toggleSort('price')}
            />
          </span>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-sm py-2xl text-center">
            <span className="text-label-tertiary">
              <Icon name="magnifyingglass" size={44} weight={1.4} />
            </span>
            <h2 className="text-headline font-semibold">No Results</h2>
            <p className="text-subheadline text-label-secondary">
              Try a different term or category.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-card bg-grouped-secondary"
            style={{ border: '0.5px solid var(--separator)' }}
          >
            {results.map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className={`press spring flex items-center gap-md px-md py-sm ${
                  i > 0 ? 'hairline-t' : ''
                }`}
              >
                <ProductImage product={p} className="h-[48px] w-[48px]" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-subheadline font-semibold">
                    {p.title}
                  </span>
                  <span className="text-caption-1 text-label-secondary">
                    {p.category}
                    {!p.inStock ? (
                      <>
                        {' · '}
                        <span className="text-red">Sold Out</span>
                      </>
                    ) : null}
                  </span>
                </div>
                <span className="flex w-[90px] items-center justify-end gap-xs">
                  <RatingStars rating={p.rating} size={12} />
                </span>
                <span className="w-[90px] text-right text-body font-semibold tabular-nums">
                  {formatPrice(p.price)}
                </span>
                <span className="text-label-tertiary">
                  <Icon name="chevron.right" size={16} />
                </span>
              </Link>
            ))}
          </div>
        )}
        {results.length > 0 ? (
          <p className="mt-sm px-md text-footnote text-label-secondary">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </main>
    </div>
  )
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="press spring min-h-[36px] shrink-0 rounded-full px-md text-subheadline font-semibold"
      style={{
        background: selected ? 'var(--tint)' : 'var(--fill-tertiary)',
        color: selected ? '#fff' : 'var(--label)',
      }}
    >
      {label}
    </button>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="press inline-flex items-center gap-[2px] uppercase"
      style={{ color: active ? 'var(--tint)' : 'var(--label-secondary)' }}
      aria-label={`Sort by ${label}${active ? `, ${dir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
    >
      {label}
      {active ? (
        <Icon name={dir === 'asc' ? 'chevron.down' : 'chevron.down'} size={12} style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none' }} />
      ) : null}
    </button>
  )
}
