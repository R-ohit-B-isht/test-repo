import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

// ADS Text Field: label above, radius.medium (6px), 2px focus ring via focus-visible.
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  iconBefore?: ReactNode
  helperText?: string
}

export function TextField({ label, iconBefore, helperText, id, className = '', ...rest }: TextFieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-caption text-subtle">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 rounded border border-[color:var(--border)] bg-surface px-3 h-8 focus-within:outline focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-[color:var(--border-focused)]">
        {iconBefore && <span className="shrink-0 text-subtle">{iconBefore}</span>}
        <input
          id={inputId}
          className="h-full w-full bg-transparent text-body text-ink placeholder:text-subtle focus:outline-none"
          {...rest}
        />
      </div>
      {helperText && <p className="mt-1 text-caption text-subtle">{helperText}</p>}
    </div>
  )
}
