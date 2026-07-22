import type { ReactNode } from 'react'

// ADS segmented control: neutral container, radius.small; selected segment uses
// the brand-selection tokens; inactive segments are transparent + subtle text.
export interface Segment<T extends string> {
  value: T
  label: ReactNode
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-sm bg-[color:var(--lz-neutral-bg)] p-0.5"
    >
      {segments.map((seg) => {
        const selected = seg.value === value
        return (
          <button
            key={seg.value}
            type="button"
            aria-pressed={selected}
            aria-label={seg.ariaLabel}
            onClick={() => onChange(seg.value)}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-sm px-2 text-caption font-medium transition-colors duration-150 ease-out-practical ${
              selected ? 'bg-brand-subtle text-selected' : 'bg-transparent text-subtle hover:text-ink'
            }`}
          >
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
