import { clsx } from 'clsx';
import { tone, verdict } from '../data';

export function Score({ s, big }: { s: number; big?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx('mono inline-flex items-center justify-center rounded-lg font-extrabold text-white', tone(s), big ? 'h-12 min-w-14 px-2 text-[20px]' : 'h-9 min-w-11 px-1.5 text-[15px]')}>{s.toFixed(1)}</span>
      {big && <span className="text-[14px] font-bold text-display">{verdict(s)}</span>}
    </span>
  );
}
export function Bar({ label, v, w }: { label: string; v: number; w: number }) {
  return (
    <div className="grid grid-cols-[130px_1fr_36px] items-center gap-3 text-[13px]">
      <span className="text-secondary">{label} <span className="text-muted">· {w}%</span></span>
      <span className="h-2 overflow-hidden rounded-full bg-raised"><span className={clsx('block h-full rounded-full', tone(v))} style={{ width: `${v}%` }} /></span>
      <span className="mono text-right font-bold">{v}</span>
    </div>
  );
}
export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={clsx('inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] font-bold transition', active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-secondary hover:border-line-strong')}>
      {children}
    </button>
  );
}
