import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/* ---------- Button ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'prominent' | 'gray' | 'plain' | 'destructive'
  size?: 'md' | 'lg'
  full?: boolean
  leadingIcon?: IconName
}

export function Button({
  variant = 'gray',
  size = 'md',
  full = false,
  leadingIcon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'press spring inline-flex items-center justify-center gap-sm rounded-full font-semibold select-none disabled:opacity-40 disabled:pointer-events-none'
  const sizes = {
    md: 'min-h-[44px] px-lg text-body',
    lg: 'min-h-[50px] px-xl text-headline',
  }
  const variants = {
    prominent: 'bg-tint text-white',
    gray: 'bg-fill-tertiary text-tint',
    plain: 'text-tint bg-transparent',
    destructive: 'bg-red text-white',
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        full ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {leadingIcon ? <Icon name={leadingIcon} size={18} /> : null}
      {children}
    </button>
  )
}

/* ---------- Status pill (color + glyph/text, never color alone) ---------- */

type Status = 'success' | 'caution' | 'error' | 'info'

const statusMap: Record<
  Status,
  { color: string; fill: string; icon: IconName }
> = {
  success: {
    color: 'var(--green)',
    fill: 'color-mix(in srgb, var(--green) 16%, transparent)',
    icon: 'checkmark.circle.fill',
  },
  caution: {
    color: 'var(--orange)',
    fill: 'color-mix(in srgb, var(--orange) 16%, transparent)',
    icon: 'exclamationmark.triangle.fill',
  },
  error: {
    color: 'var(--red)',
    fill: 'color-mix(in srgb, var(--red) 16%, transparent)',
    icon: 'exclamationmark.circle.fill',
  },
  info: {
    color: 'var(--tint)',
    fill: 'color-mix(in srgb, var(--tint) 16%, transparent)',
    icon: 'shippingbox.fill',
  },
}

export function StatusPill({
  status,
  children,
  icon,
}: {
  status: Status
  children: ReactNode
  icon?: IconName
}) {
  const s = statusMap[status]
  return (
    <span
      className="inline-flex items-center gap-xs rounded-full px-sm py-[3px] text-footnote font-semibold"
      style={{ color: s.color, background: s.fill }}
    >
      <Icon name={icon ?? s.icon} size={13} />
      {children}
    </span>
  )
}

/* ---------- Rating (stars + determinate bar) ---------- */

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-[2px] text-orange"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="relative inline-block"
          style={{ width: size, height: size }}
        >
          <span className="absolute inset-0 text-label-tertiary">
            <Icon name="star.fill" size={size} />
          </span>
          <span
            className="absolute inset-0 overflow-hidden text-orange"
            style={{ width: `${Math.max(0, Math.min(1, rating - i)) * 100}%` }}
          >
            <Icon name="star.fill" size={size} />
          </span>
        </span>
      ))}
    </span>
  )
}

/* ---------- Determinate progress bar (ProgressView-style) ---------- */

export function ProgressBar({
  value,
  label,
  color = 'var(--tint)',
}: {
  value: number
  label?: string
  color?: string
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div>
      <div
        className="h-[6px] w-full overflow-hidden rounded-full"
        style={{ background: 'var(--fill-tertiary)' }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="spring h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {label ? (
        <div className="mt-xs text-footnote text-label-secondary">{label}</div>
      ) : null}
    </div>
  )
}

/* ---------- Stepper (− value +) ---------- */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{ background: 'var(--fill-tertiary)' }}
    >
      <button
        className="press flex h-[44px] w-[44px] items-center justify-center text-tint disabled:opacity-30"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" size={18} />
      </button>
      <span
        className="min-w-[32px] text-center text-body font-semibold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        className="press flex h-[44px] w-[44px] items-center justify-center text-tint disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-control p-[2px]"
      style={{ background: 'var(--fill-tertiary)' }}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={`spring press min-h-[36px] rounded-[8px] px-md text-subheadline font-semibold ${
              selected ? 'text-label' : 'text-label-secondary'
            }`}
            style={
              selected
                ? {
                    background: 'var(--bg)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  }
                : undefined
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
