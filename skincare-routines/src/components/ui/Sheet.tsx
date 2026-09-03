import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../../lib/format';

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }

const EASE = [0.23, 1, 0.32, 1] as const;

/** Right-side sheet (bottom sheet on phones). Focus is trapped inside, Esc closes, body scroll locks. */
export function Sheet({ open, onClose, title, children, wide }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  const dur = reduced ? 0 : 0.28;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-end bg-[rgba(26,23,29,0.45)] backdrop-blur-[2px]" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur }}>
          <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
            className={`scrollbar-thin flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] border-l border-line bg-page outline-none sm:h-dvh sm:rounded-none ${wide ? 'sm:max-w-5xl' : 'sm:max-w-2xl'}`}
            initial={{ x: 40, y: 0, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: dur, ease: EASE }}>
            <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3 sm:px-8">
              <p className="truncate text-[14px] font-bold text-display">{title}</p>
              <button type="button" onClick={onClose} className="btn h-10 w-10 shrink-0 px-0" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
