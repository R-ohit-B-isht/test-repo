import { useFlags, type FlagAppearance } from '../context/FlagContext'
import { Icon, type IconName } from './Icon'

// ADS Flag: transient confirmation toast at z-index 600, overlay surface + shadow.
const iconFor: Record<FlagAppearance, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  error: 'error',
}
const accentFor: Record<FlagAppearance, string> = {
  success: 'text-[color:var(--lz-success-text)]',
  info: 'text-[color:var(--lz-info-text)]',
  warning: 'text-[color:var(--lz-warning-text)]',
  error: 'text-[color:var(--lz-danger-text)]',
}

export function Flags() {
  const { flags, dismiss } = useFlags()
  if (flags.length === 0) return null
  return (
    <div className="fixed bottom-6 left-6 z-[600] flex w-[calc(100%-48px)] max-w-[380px] flex-col gap-2">
      {flags.map((flag) => (
        <div
          key={flag.id}
          role="alert"
          className="flex items-start gap-3 rounded-lg bg-surface-overlay p-4 shadow-overlay"
        >
          <span className={`mt-0.5 shrink-0 ${accentFor[flag.appearance]}`}>
            <Icon name={iconFor[flag.appearance]} size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-body font-bold text-display">{flag.title}</p>
            {flag.description && <p className="m-0 mt-1 text-caption text-subtle">{flag.description}</p>}
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(flag.id)}
            className="shrink-0 rounded p-1 text-subtle hover:text-ink"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
