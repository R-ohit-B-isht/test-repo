import type { ReactNode } from 'react';
import { HeroMatrix } from '../fx/HeroMatrix';
import { SplitText } from '../fx/SplitText';
import { Kicker } from '../ui/primitives';

interface Props { kicker: string; number?: string; title: string; lede: string; aside?: ReactNode; matrix?: boolean; children?: ReactNode }

export function Hero({ kicker, number, title, lede, aside, matrix, children }: Props) {
  return (
    <section className="relative -mx-4 overflow-hidden border-b border-line px-4 pb-10 pt-10 sm:-mx-6 sm:px-6 sm:pb-14 sm:pt-16">
      {matrix && <HeroMatrix />}
      <div className="relative mx-auto grid max-w-[1440px] items-end gap-8 lg:grid-cols-[auto_1fr]">
        {number && <div className="display text-[clamp(72px,14vw,168px)]" aria-hidden>{number}</div>}
        <div className="max-w-2xl">
          <Kicker>{kicker}</Kicker>
          <SplitText as="h1" text={title} className="mt-3 text-[clamp(28px,4vw,48px)] leading-[1.05] text-display" />
          <p className="mt-4 max-w-xl text-[15px] text-secondary sm:text-base">{lede}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
        {aside && <div className="lg:col-span-2">{aside}</div>}
      </div>
    </section>
  );
}
