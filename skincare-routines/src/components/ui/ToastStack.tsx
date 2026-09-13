import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { dismissToast, useToasts } from '../../state/toastStore';
import { usePrefersReducedMotion } from '../../lib/format';

const EASE = [0.23, 1, 0.32, 1] as const;

/** Bottom-centre ink toasts (Booking "Property saved" / Pinterest "Saved" + Screenroom toast-stack): stack of ≤2, slide up 8px, 4 s. */
export function ToastStack() {
  const toasts = useToasts();
  const reduced = usePrefersReducedMotion();
  const dur = reduced ? 0 : 0.22;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div key={t.id} layout
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: dur, ease: EASE }}
            className="pointer-events-auto flex min-h-12 w-full max-w-md items-center gap-3 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-bold text-page shadow-[0_12px_40px_-12px_rgba(26,23,29,0.45)]">
            <span className="min-w-0 flex-1">{t.text}</span>
            {t.action && (
              <button type="button" onClick={() => { t.action?.run(); dismissToast(t.id); }}
                className="press shrink-0 rounded-full px-2 py-1 text-[13px] font-extrabold text-accent-soft underline-offset-2 hover:underline">
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismissToast(t.id)} className="press shrink-0 rounded-full p-1 text-page/70 hover:text-page" aria-label="Dismiss"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
