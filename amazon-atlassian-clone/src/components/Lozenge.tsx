import type { ReactNode } from 'react'

// ADS Lozenge: small status pill, UPPERCASE (the only place UPPERCASE is allowed),
// bold, radius.small (4px). Appearance maps to a semantic role via subtle bg + text tokens.
export type LozengeAppearance = 'default' | 'inprogress' | 'success' | 'removed' | 'moved' | 'new'

const styleFor: Record<LozengeAppearance, string> = {
  default: 'bg-[color:var(--lz-neutral-bg)] text-[color:var(--lz-neutral-text)]',
  inprogress: 'bg-[color:var(--lz-info-bg)] text-[color:var(--lz-info-text)]',
  success: 'bg-[color:var(--lz-success-bg)] text-[color:var(--lz-success-text)]',
  removed: 'bg-[color:var(--lz-danger-bg)] text-[color:var(--lz-danger-text)]',
  moved: 'bg-[color:var(--lz-warning-bg)] text-[color:var(--lz-warning-text)]',
  new: 'bg-[color:var(--lz-discovery-bg)] text-[color:var(--lz-discovery-text)]',
}

export function Lozenge({
  appearance = 'default',
  children,
}: {
  appearance?: LozengeAppearance
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1 py-0.5 text-label font-bold uppercase tracking-[0.02em] ${styleFor[appearance]}`}
    >
      {children}
    </span>
  )
}
