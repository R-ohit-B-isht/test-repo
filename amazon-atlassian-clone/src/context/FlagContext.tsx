import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type FlagAppearance = 'success' | 'info' | 'warning' | 'error'

export interface FlagItem {
  id: number
  appearance: FlagAppearance
  title: string
  description?: string
}

interface FlagValue {
  flags: FlagItem[]
  showFlag: (flag: Omit<FlagItem, 'id'>) => void
  dismiss: (id: number) => void
}

const FlagContext = createContext<FlagValue | null>(null)

export function FlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlagItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setFlags((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const showFlag = useCallback(
    (flag: Omit<FlagItem, 'id'>) => {
      const id = nextId.current++
      setFlags((prev) => [...prev, { ...flag, id }])
      // Transient confirmation — auto-dismiss (ADS Flag behavior).
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return <FlagContext.Provider value={{ flags, showFlag, dismiss }}>{children}</FlagContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlags(): FlagValue {
  const ctx = useContext(FlagContext)
  if (!ctx) throw new Error('useFlags must be used within FlagProvider')
  return ctx
}
