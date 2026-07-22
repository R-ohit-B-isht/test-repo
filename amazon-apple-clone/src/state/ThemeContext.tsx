import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Appearance = 'system' | 'light' | 'dark'

type ThemeValue = {
  appearance: Appearance
  resolved: 'light' | 'dark'
  setAppearance: (a: Appearance) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const STORAGE_KEY = 'aac-appearance'

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Appearance | null
    return saved ?? 'system'
  })
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemDark(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolved: 'light' | 'dark' =
    appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance

  useEffect(() => {
    const root = document.documentElement
    if (appearance === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', appearance)
    }
  }, [appearance])

  const setAppearance = (a: Appearance) => {
    setAppearanceState(a)
    localStorage.setItem(STORAGE_KEY, a)
  }

  const value = useMemo(
    () => ({ appearance, resolved, setAppearance }),
    [appearance, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
