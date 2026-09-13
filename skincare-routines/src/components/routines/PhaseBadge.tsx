import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { phaseHue } from '../../domain/routines';

/** Phase tag tinted by its hue; theme-aware via light/dark HSL pairs read from the html data-theme / colour-scheme. */
export function PhaseBadge({ phase, active, onClick, count }: { phase: string; active?: boolean; onClick?: () => void; count?: number }) {
  const h = phaseHue(phase);
  const style = { '--ph': String(h) } as CSSProperties;
  const cls = clsx('phase inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-bold', active && 'phase-on', onClick && 'press transition-colors');
  if (!onClick) return <span className={cls} style={style}>{phase}</span>;
  return (
    <button type="button" className={cls} style={style} aria-pressed={!!active} onClick={onClick}>
      {phase}{count !== undefined && <span className="mono opacity-70">{count}</span>}
    </button>
  );
}
