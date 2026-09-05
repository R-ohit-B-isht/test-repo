import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePrefersReducedMotion } from '../../lib/format';

interface Props { text: string; className?: string; delay?: number; stagger?: number; as?: 'h1' | 'h2' | 'p' | 'span' }

/** React Bits–style split-text entrance: words rise in with a strong ease-out. Transform/opacity only; skipped under reduced motion. */
export function SplitText({ text, className, delay = 0, stagger = 0.04, as = 'span' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  useGSAP(() => {
    if (reduced || !ref.current) return;
    gsap.fromTo(ref.current.querySelectorAll('[data-word]'),
      { yPercent: 60, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger, delay });
  }, { scope: ref, dependencies: [text] });
  const Tag = as;
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
          <span data-word className="inline-block will-change-transform">{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  );
}
