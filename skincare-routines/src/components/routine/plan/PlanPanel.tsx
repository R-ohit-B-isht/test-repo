import { useState } from 'react';
import { AlertTriangle, ArrowRight, RefreshCw, Send, Sparkles, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { StageProgress } from './StageProgress';
import { WeekHeatmap } from './WeekHeatmap';
import { PlanWarnings } from './PlanWarnings';
import { PlanStepList } from './PlanStepList';
import type { PlannerState } from '../../../schedule/plannerStore';
import type { PickResult } from '../../../schedule/planner/picker';
import type { Day } from '../../../schedule/model';

interface Props {
  planner: PlannerState;
  pendingInRoutine: number;
  categoryLabel: (id: string) => string;
  effectivePick: (stepId: string) => PickResult['chosen'];
  onChoose: (stepId: string, productId: string) => void;
  onPropose: (stepIds: string[]) => void;
  onProposeAll: () => void;
  onReview: () => void;
  onStop: () => void;
  onRebuild: () => void;
  onGoRoutine: () => void;
}

const plain = (text: string) => text.replace(/\[\[[^\]]*\]\]?/g, '').replace(/\*\*/g, '').replace(/^FOLLOWUPS:.*$/m, '').replace(/[ \t]{2,}/g, ' ').trim();

/** Stage 3 — the plan stays on screen while later stages run: heatmap first (the peak moment: seeing actives spaced out),
 * compatibility notes, then the step rows filling in with ranked picks, then the assistant's notes layered on top. */
export function PlanPanel({ planner, pendingInRoutine, categoryLabel, effectivePick, onChoose, onPropose, onProposeAll, onReview, onStop, onRebuild, onGoRoutine }: Props) {
  const [day, setDay] = useState<Day | null>(null);
  const { week, stages, phase } = planner;
  const running = phase === 'running';
  const reviewStage = stages.find((s) => s.id === 'review');
  const reviewing = reviewStage?.status === 'running';
  const productsDone = stages.find((s) => s.id === 'products')?.status === 'done';
  const total = week?.steps.length ?? 0;
  const sent = week ? week.steps.filter((s) => planner.proposed.has(s.id)).length : 0;

  return (
    <div className="space-y-5">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] text-display">{running ? 'Building your week…' : phase === 'error' ? 'Could not build the week' : 'Your week'}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-secondary">
              {week ? `${total} steps · ${week.restNights.length} rest night${week.restNights.length === 1 ? '' : 's'} · one strong active per night, sunscreen every morning.` : 'Spacing comes from the pairing evidence; products from the site’s rankings; the assistant only comments.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {running || reviewing ? <button type="button" className="btn h-9" onClick={onStop}><Square size={13} aria-hidden />Stop</button> : <button type="button" className="btn h-9" onClick={onRebuild}><RefreshCw size={13} aria-hidden />Change list</button>}
            {week && productsDone && sent < total && <button type="button" className="btn btn-primary h-9" onClick={onProposeAll}><Send size={13} aria-hidden />Send all {total - sent} to routine</button>}
            {sent > 0 && <button type="button" className="btn btn-accent h-9" onClick={onGoRoutine}>Review {pendingInRoutine} pending<ArrowRight size={13} aria-hidden /></button>}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <StageProgress stages={stages} />
          {planner.error && (
            <p role="alert" className="flex items-start gap-2 rounded-[12px] border border-danger/40 bg-danger/5 px-3.5 py-3 text-[13px] text-primary"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden />{planner.error}</p>
          )}
          {planner.inventory && planner.inventory.unknown.length > 0 && !planner.error && (
            <p className="text-[12.5px] text-secondary self-start"><span className="font-bold text-primary">Not understood, left out:</span> {planner.inventory.unknown.join(', ')}.</p>
          )}
        </div>
      </section>

      {week && (
        <>
          <WeekHeatmap week={week} day={day} onDay={setDay} />
          <PlanWarnings warnings={week.warnings} rules={week.rulesUsed} assistant={planner.review?.warnings ?? []} />
          <AssistantNote stage={reviewStage} note={planner.reviewNote} error={planner.reviewError?.message ?? null} problems={planner.review?.problems ?? []} canRetry={!running && !reviewing} onRetry={onReview} />
          <PlanStepList week={week} picks={planner.picks} picking={running && !productsDone} review={planner.review} proposed={planner.proposed} day={day}
            categoryLabel={categoryLabel} effectivePick={effectivePick} onChoose={onChoose} onPropose={onPropose} />
        </>
      )}
    </div>
  );
}

function AssistantNote({ stage, note, error, problems, canRetry, onRetry }: { stage: PlannerState['stages'][number] | undefined; note: string; error: string | null; problems: string[]; canRetry: boolean; onRetry: () => void }) {
  if (!stage || stage.status === 'pending') return null;
  const text = plain(note);
  return (
    <section className={clsx('rounded-[14px] border px-4 py-3 text-[13px]', stage.status === 'error' ? 'border-danger/40 bg-danger/5' : 'border-line bg-surface')} aria-live="polite">
      <p className="flex flex-wrap items-center gap-2 font-bold text-display">
        <Sparkles size={14} className="text-accent" aria-hidden />
        {stage.status === 'running' ? <><span className="chat-dots" aria-hidden><i /><i /><i /></span>{stage.detail}</> : stage.status === 'done' ? `Assistant’s notes are on the steps below · ${stage.detail}` : stage.status === 'skipped' ? 'Assistant review skipped' : 'Assistant review failed'}
        {canRetry && stage.status !== 'running' && <button type="button" className="btn ml-auto h-8 px-3 text-[12px]" onClick={onRetry}><RefreshCw size={12} aria-hidden />{stage.status === 'done' ? 'Ask again' : 'Try the assistant'}</button>}
      </p>
      {stage.status !== 'running' && stage.status !== 'done' && stage.detail && <p className="mt-1 text-secondary">{error ?? stage.detail}</p>}
      {text && <p className="mt-1.5 leading-relaxed text-primary">{text}</p>}
      {problems.length > 0 && (
        <details className="mt-1.5 text-[12px] text-secondary">
          <summary className="cursor-pointer font-bold text-primary">{problems.length} assistant suggestion{problems.length === 1 ? '' : 's'} refused</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
