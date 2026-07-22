import { Icon } from './Icon'

// Quantity stepper as a segmented control: neutral container, brand-selected value readout.
interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function Stepper({ value, onChange, min = 1, max = 99 }: StepperProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  return (
    <div className="inline-flex items-center rounded bg-[color:var(--lz-neutral-bg)] p-0.5">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center rounded text-ink transition-colors duration-100 hover:bg-surface disabled:opacity-40"
      >
        <Icon name="minus" size={16} />
      </button>
      <span
        aria-live="polite"
        className="min-w-[36px] rounded bg-brand-subtle px-2 text-center text-body font-medium text-selected"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center rounded text-ink transition-colors duration-100 hover:bg-surface disabled:opacity-40"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
