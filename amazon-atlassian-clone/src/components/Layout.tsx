import { useState, type ReactNode } from 'react'
import { useRouter } from '../context/RouterContext'
import { useCart } from '../context/CartContext'
import { CATEGORIES } from '../data/products'
import { Icon, type IconName } from './Icon'
import { TextField } from './TextField'
import { ThemeSwitcher } from './ThemeSwitcher'

const navItems: { label: string; icon: IconName; category?: string }[] = [
  { label: 'All products', icon: 'grid' },
  ...CATEGORIES.map((c) => ({ label: c, icon: 'tag' as IconName, category: c })),
]

function SideNav() {
  const { route, navigate } = useRouter()
  const activeCategory =
    route.name === 'search' ? route.category : route.name === 'home' ? undefined : undefined
  const isAllActive = route.name === 'home' || (route.name === 'search' && !route.category)

  return (
    <nav aria-label="Product categories" className="flex flex-col gap-0.5">
      <p className="mb-2 px-3 text-label uppercase tracking-[0.02em] text-subtle">Browse</p>
      {navItems.map((item) => {
        const selected = item.category ? activeCategory === item.category : isAllActive
        return (
          <button
            key={item.label}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() =>
              item.category
                ? navigate({ name: 'search', category: item.category })
                : navigate({ name: 'home' })
            }
            className={`relative flex min-h-[32px] items-center gap-2 rounded px-3 py-2 text-body transition-colors duration-100 ease-out-practical ${
              selected
                ? 'bg-brand-subtle font-medium text-selected'
                : 'text-subtle hover:bg-[color:var(--lz-neutral-bg)] hover:text-ink'
            }`}
          >
            {selected && <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-brand" />}
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { route, navigate } = useRouter()
  const { count } = useCart()
  const [term, setTerm] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ name: 'search', query: term.trim() || undefined })
  }

  return (
    <div className="min-h-full bg-page">
      {/* Top navigation — z-index 200 per ADS */}
      <header className="sticky top-0 z-[200] border-b border-[color:var(--border)] bg-surface">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 text-display"
            aria-label="Zaphlo home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-brand text-inverse">
              <Icon name="box" size={16} />
            </span>
            <span className="text-subheading font-bold">Zaphlo</span>
          </button>

          <form onSubmit={submitSearch} className="hidden flex-1 sm:block" role="search">
            <TextField
              label={undefined}
              aria-label="Search products"
              placeholder="Search products"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              iconBefore={<Icon name="search" size={16} />}
            />
          </form>

          <div className="ml-auto flex items-center gap-3 sm:ml-0">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={() => navigate({ name: 'cart' })}
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              aria-current={route.name === 'cart' ? 'page' : undefined}
              className={`relative flex min-h-[32px] items-center gap-2 rounded px-3 py-2 text-body transition-colors duration-100 ${
                route.name === 'cart'
                  ? 'bg-brand-subtle text-selected'
                  : 'text-ink hover:bg-[color:var(--lz-neutral-bg)]'
              }`}
            >
              <Icon name="cart" size={16} />
              <span className="hidden md:inline">Cart</span>
              {count > 0 && (
                <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-label font-bold text-inverse">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-6 px-4 py-6">
        <aside className="hidden w-[200px] shrink-0 lg:block">
          <div className="sticky top-20">
            <SideNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
