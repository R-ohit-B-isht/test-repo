import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { SplitText } from '../fx/SplitText';
import { Kicker } from '../ui/primitives';

interface Props { kicker: string; title: string; lede: string; proofs?: string[]; aside?: ReactNode; children?: ReactNode }

/** Headspace-style opener: heavy tight heading, one lede, a row of check-mark proof bullets built from real counts, ≤2 CTAs. */
export function Hero({ kicker, title, lede, proofs, aside, children }: Props) {
  return (
    <section className="relative pb-10 pt-10 sm:pb-14 sm:pt-16">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="max-w-3xl">
          <Kicker>{kicker}</Kicker>
          <SplitText as="h1" text={title} className="mt-4 text-[clamp(34px,5.2vw,64px)] leading-[1.02] text-display" />
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-secondary sm:text-[18px]">{lede}</p>
          {proofs && proofs.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2" aria-label="What is behind this page">
              {proofs.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[14px] font-bold text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden><Check size={12} strokeWidth={3} /></span>{p}
                </li>
              ))}
            </ul>
          )}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  );
}
