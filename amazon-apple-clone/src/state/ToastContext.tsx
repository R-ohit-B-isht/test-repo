import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Icon } from '../components/Icon'

type ToastValue = { notify: (message: string) => void }
const ToastContext = createContext<ToastValue | null>(null)

/*
  Brief, non-blocking confirmation — an in-context transient overlay per HIG
  (not a third-party toast library). Auto-dismisses; cross-dissolves.
*/
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const notify = useCallback((msg: string) => {
    setMessage(msg)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 1800)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-[76px] z-50 flex justify-center px-md"
          role="status"
          aria-live="polite"
        >
          <div className="material animate-in flex items-center gap-sm rounded-full px-lg py-sm text-subheadline font-semibold shadow-lg">
            <span className="text-green">
              <Icon name="checkmark.circle.fill" size={18} />
            </span>
            {message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
