import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { useCart } from '../state/CartContext'

type Tab = {
  to: string
  label: string
  icon: IconName
  iconSelected: IconName
  badge?: number
}

/*
  Tab bar on the material (floating functional layer). SF-Symbol-style glyph +
  short Title-Case label. Selected tab uses the app tint (filled glyph);
  unselected uses secondaryLabel. Bottom on mobile, top-right inline on wide.
*/
export function TabBar() {
  const { count } = useCart()
  const tabs: Tab[] = [
    { to: '/', label: 'Home', icon: 'house', iconSelected: 'house.fill' },
    {
      to: '/search',
      label: 'Search',
      icon: 'magnifyingglass',
      iconSelected: 'magnifyingglass',
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: 'cart',
      iconSelected: 'cart.fill',
      badge: count,
    },
  ]

  return (
    <nav
      className="material hairline-t fixed inset-x-0 bottom-0 z-40 sm:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-[1100px]">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className="flex min-h-[52px] flex-col items-center justify-center gap-[2px] py-xs"
            >
              {({ isActive }) => (
                <TabInner tab={tab} isActive={isActive} />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TabInner({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  return (
    <>
      <span
        className="relative spring"
        style={{ color: isActive ? 'var(--tint)' : 'var(--label-secondary)' }}
      >
        <Icon name={isActive ? tab.iconSelected : tab.icon} size={26} />
        {tab.badge ? (
          <span className="absolute -right-[10px] -top-[4px] flex min-w-[16px] items-center justify-center rounded-full bg-red px-[4px] text-[10px] font-bold leading-none text-white">
            {tab.badge}
          </span>
        ) : null}
      </span>
      <span
        className="text-caption-2 font-medium"
        style={{ color: isActive ? 'var(--tint)' : 'var(--label-secondary)' }}
      >
        {tab.label}
      </span>
    </>
  )
}

/* Wide-screen inline nav (top). Mirrors the tabs as a segmented-ish toolbar. */
export function TopTabs() {
  const { count } = useCart()
  const tabs: Tab[] = [
    { to: '/', label: 'Home', icon: 'house', iconSelected: 'house.fill' },
    {
      to: '/search',
      label: 'Search',
      icon: 'magnifyingglass',
      iconSelected: 'magnifyingglass',
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: 'cart',
      iconSelected: 'cart.fill',
      badge: count,
    },
  ]
  return (
    <nav
      className="hidden sm:block"
      aria-label="Primary"
    >
      <ul className="flex items-center gap-xs">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className="press spring flex min-h-[40px] items-center gap-xs rounded-full px-md text-subheadline font-semibold"
            >
              {({ isActive }) => (
                <span
                  className="relative flex items-center gap-xs"
                  style={{
                    color: isActive ? 'var(--tint)' : 'var(--label-secondary)',
                  }}
                >
                  <Icon
                    name={isActive ? tab.iconSelected : tab.icon}
                    size={18}
                  />
                  {tab.label}
                  {tab.badge ? (
                    <span className="ml-[2px] flex min-w-[18px] items-center justify-center rounded-full bg-red px-[5px] text-[11px] font-bold leading-none text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
