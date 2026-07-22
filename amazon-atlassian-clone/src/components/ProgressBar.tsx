// ADS ProgressBar: full-width rounded track (radius.full) with a filled portion.
// Track = neutral; fill = brand (default) or success. Always paired with a numeric readout.
type Appearance = 'brand' | 'success' | 'warning'

const fillFor: Record<Appearance, string> = {
  brand: 'bg-brand',
  success: 'bg-success-bold',
  warning: 'bg-warning-bold',
}

interface ProgressBarProps {
  /** 0..1 */
  value: number
  appearance?: Appearance
  label?: string
  valueText?: string
  ariaLabel?: string
}

export function ProgressBar({
  value,
  appearance = 'brand',
  label,
  valueText,
  ariaLabel,
}: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="w-full">
      {(label || valueText) && (
        <div className="mb-1 flex items-center justify-between text-caption">
          {label && <span className="text-subtle">{label}</span>}
          {valueText && <span className="text-ink font-medium">{valueText}</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--lz-neutral-bg)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-250 ease-out-practical ${fillFor[appearance]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
