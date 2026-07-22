import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

// ADS Section message: persistent inline status. Semantic tinted background + icon + text.
type Appearance = 'info' | 'warning' | 'error' | 'success' | 'discovery'

const config: Record<Appearance, { bg: string; text: string; icon: IconName }> = {
  info: { bg: 'bg-[color:var(--lz-info-bg)]', text: 'text-[color:var(--lz-info-text)]', icon: 'info' },
  warning: {
    bg: 'bg-[color:var(--lz-warning-bg)]',
    text: 'text-[color:var(--lz-warning-text)]',
    icon: 'warning',
  },
  error: { bg: 'bg-[color:var(--lz-danger-bg)]', text: 'text-[color:var(--lz-danger-text)]', icon: 'error' },
  success: {
    bg: 'bg-[color:var(--lz-success-bg)]',
    text: 'text-[color:var(--lz-success-text)]',
    icon: 'check',
  },
  discovery: {
    bg: 'bg-[color:var(--lz-discovery-bg)]',
    text: 'text-[color:var(--lz-discovery-text)]',
    icon: 'info',
  },
}

interface SectionMessageProps {
  appearance?: Appearance
  title?: string
  children?: ReactNode
}

export function SectionMessage({ appearance = 'info', title, children }: SectionMessageProps) {
  const { bg, text, icon } = config[appearance]
  return (
    <div className={`flex gap-3 rounded-lg p-4 ${bg}`} role="status">
      <span className={`mt-0.5 shrink-0 ${text}`}>
        <Icon name={icon} size={16} />
      </span>
      <div className="text-body text-ink">
        {title && <p className={`m-0 font-bold ${text}`}>{title}</p>}
        {children && <div className="mt-1 text-ink">{children}</div>}
      </div>
    </div>
  )
}
