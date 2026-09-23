import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePrefersReducedMotion } from '../../lib/format';

interface Props { children: ReactNode; className?: string; stagger?: number; y?: number }

/** Section reveal: direct children fade/rise once when scrolled into view. One IntersectionObserver per section, no per-card work. */
export function Reveal({ children, className, stagger = 0.05, y = 16 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useGSAP(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const kids = Array.from(el.children);
    gsap.set(kids, { opacity: 0, y });
    const io = new IntersectionObserver((entries) => {
      // Also reveal when the section was scrolled past between observer ticks (fast scroll / anchor jump).
      if (!entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) return;
      gsap.to(kids, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger, overwrite: true });
      io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}
