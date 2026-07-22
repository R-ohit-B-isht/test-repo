import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'product'; id: string }
  | { name: 'cart' }
  | { name: 'search'; query?: string; category?: string }

interface RouterValue {
  route: Route
  navigate: (route: Route) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' })

  const navigate = useCallback((next: Route) => {
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}
