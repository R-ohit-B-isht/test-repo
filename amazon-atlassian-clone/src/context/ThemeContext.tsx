import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeChoice = 'auto' | 'light' | 'dark'
type Resolved = 'light' | 'dark'

interface ThemeValue {
  choice: ThemeChoice
  resolved: Resolved
  setChoice: (c: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const STORAGE_KEY = 'ads-theme-choice'

function systemPref(): Resolved {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
  })
  const [system, setSystem] = useState<Resolved>(systemPref)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: Resolved = choice === 'auto' ? system : choice

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  const setChoice = (c: ThemeChoice) => {
    setChoiceState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }

  const value = useMemo(() => ({ choice, resolved, setChoice }), [choice, resolved])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
