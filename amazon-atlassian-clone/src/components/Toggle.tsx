// ADS Toggle: pill track + circular thumb. On = brand track, thumb inverse; ~150ms transition.
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ease-out-practical ${
        checked ? 'bg-brand' : 'bg-[color:var(--lz-neutral-bg)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-raised transition-transform duration-150 ease-out-practical ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}
