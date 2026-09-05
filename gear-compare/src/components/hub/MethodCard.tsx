import type { ScoreMeta } from '../../domain/scoreMeta';

/** One ranking dimension: manifest weight as the big number, the manifest criterion as the label, our hint as the how. */
export function MethodCard({ meta, weight, criterion }: { meta: ScoreMeta; weight: number; criterion: string }) {
  return (
    <div className="card p-5">
      <span className="mono block text-[28px] font-extrabold leading-none text-display">{Math.round(weight * 100)}<span className="text-[15px] text-muted">%</span></span>
      <span className="label mt-1 block">{criterion}</span>
      <h3 className="mt-3 text-[17px] leading-tight text-display">{meta.label}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-secondary">{meta.hint}</p>
    </div>
  );
}
