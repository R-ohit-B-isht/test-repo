import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Appearance = 'primary' | 'default' | 'subtle' | 'link' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: Appearance
  fullWidth?: boolean
  iconBefore?: ReactNode
  iconAfter?: ReactNode
  children?: ReactNode
}

// Radius.medium (6px) for buttons; sentence-case labels; 32px height / ≥24px hit area.
// Only `primary` uses brand blue — roughly one primary action per view.
const base =
  'inline-flex items-center justify-center gap-2 rounded font-medium text-body h-8 px-3 min-h-[32px] ' +
  'transition-colors duration-100 ease-out-practical disabled:cursor-not-allowed disabled:opacity-60 select-none'

const byAppearance: Record<Appearance, string> = {
  primary: 'bg-brand text-inverse hover:brightness-95 active:brightness-90',
  default:
    'bg-[color:var(--lz-neutral-bg)] text-ink hover:brightness-95 active:brightness-90 border border-transparent',
  subtle: 'bg-transparent text-subtle hover:bg-[color:var(--lz-neutral-bg)]',
  link: 'bg-transparent text-link px-0 h-auto min-h-0 hover:underline',
  danger: 'bg-danger-bold text-inverse hover:brightness-95 active:brightness-90',
}

export function Button({
  appearance = 'default',
  fullWidth,
  iconBefore,
  iconAfter,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${byAppearance[appearance]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {iconBefore}
      {children}
      {iconAfter}
    </button>
  )
}
