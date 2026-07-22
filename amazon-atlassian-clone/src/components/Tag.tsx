import type { ReactNode } from 'react'
import { Icon } from './Icon'

// ADS Tag: subtle filled background, sentence case, radius.small (4px).
// Selected tags read as the current filter selection using the brand-selection tokens.
interface TagProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export function Tag({ children, selected = false, onClick, onRemove }: TagProps) {
  const selectable = Boolean(onClick)
  const cls = selected
    ? 'bg-brand-subtle text-selected border-transparent'
    : 'bg-[color:var(--lz-neutral-bg)] text-ink border-transparent hover:brightness-95'

  const content = (
    <>
      {selected && <Icon name="check" size={12} />}
      <span>{children}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove filter ${typeof children === 'string' ? children : ''}`}
          className="ml-1 inline-flex rounded-sm hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onRemove()
            }
          }}
        >
          <Icon name="close" size={12} />
        </span>
      )}
    </>
  )

  const shared = `inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-caption font-medium transition-colors duration-100 ease-out-practical ${cls}`

  if (selectable) {
    return (
      <button type="button" aria-pressed={selected} onClick={onClick} className={shared}>
        {content}
      </button>
    )
  }
  return <span className={shared}>{content}</span>
}
