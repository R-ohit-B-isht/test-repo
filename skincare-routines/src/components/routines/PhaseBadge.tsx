import { clsx } from 'clsx';
import { phaseHue } from '../../domain/routines';


export function PhaseBadge({ phase, active, onClick, count }: { phase: string; active?: boolean; onClick?: () => void; count?: number }) {
  const h = phaseHue(phase);
  const style = { color: `hsl(${h} 55% 68%)`, borderColor: active ? `hsl(${h} 55% 68%)` : `hsl(${h} 30% 28%)`, backgroundColor: active ? `hsl(${h} 40% 16%)` : 'transparent' };
  const cls = clsx('mono inline-flex h-6 items-center gap-1.5 rounded-[3px] border px-1.5 text-[10px] tracking-wider', onClick && 'press transition-colors hover:brightness-125');
  if (!onClick) return <span className={cls} style={style}>{phase}</span>;
  return (
    <button type="button" className={cls} style={style} aria-pressed={!!active} onClick={onClick}>
      {phase}{count !== undefined && <span className="text-muted">{count}</span>}
    </button>
  );
}
