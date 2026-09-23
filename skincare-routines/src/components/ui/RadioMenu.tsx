import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { usePrefersReducedMotion } from '../../lib/format';

export interface RadioOption<K extends string> { value: K; label: string; hint?: string; icon?: ReactNode }

interface Props<K extends string> {
  value: K;
  options: RadioOption<K>[];
  onChange: (k: K) => void;
  trigger: (open: boolean) => ReactNode;
  triggerClassName?: string;
  triggerLabel: string;
  align?: 'left' | 'right';
  heading?: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;

/** Single-choice menu (Booking "Sort options" sheet / "Appearance" radio group, Screenroom dropdown-menu): outside click + Esc close, arrow keys move, Enter picks. */
export function RadioMenu<K extends string>({ value, options, onChange, trigger, triggerClassName, triggerLabel, align = 'right', heading }: Props<K>) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); (root.current?.querySelector('button') as HTMLButtonElement | null)?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    if (open) items.current[cursor]?.focus();
  }, [open, cursor]);

  const openAt = () => { setCursor(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };
  const pick = (k: K) => { onChange(k); setOpen(false); };
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + options.length) % options.length); }
    else if (e.key === 'Home') { e.preventDefault(); setCursor(0); }
    else if (e.key === 'End') { e.preventDefault(); setCursor(options.length - 1); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={triggerLabel}
        onClick={() => (open ? setOpen(false) : openAt())} className={triggerClassName}>
        {trigger(open)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div id={id} role="menu" aria-label={triggerLabel} onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: EASE }}
            className={clsx('card absolute top-[calc(100%+6px)] z-50 min-w-[240px] origin-top p-1.5 shadow-[0_16px_48px_-16px_rgba(26,23,29,0.35)]', align === 'right' ? 'right-0' : 'left-0')}>
            {heading && <p className="label px-3 pb-1.5 pt-2">{heading}</p>}
            {options.map((o, i) => {
              const on = o.value === value;
              return (
                <button key={o.value} type="button" role="menuitemradio" aria-checked={on} tabIndex={i === cursor ? 0 : -1}
                  ref={(el) => { items.current[i] = el; }} onClick={() => pick(o.value)} onMouseMove={() => setCursor(i)}
                  className={clsx('flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors', on ? 'bg-accent-soft text-display' : 'text-primary hover:bg-raised focus-visible:bg-raised')}>
                  {o.icon && <span className="shrink-0 text-secondary" aria-hidden>{o.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block font-bold', on && 'text-accent')}>{o.label}</span>
                    {o.hint && <span className="block text-[12px] text-secondary">{o.hint}</span>}
                  </span>
                  <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong')} aria-hidden>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
