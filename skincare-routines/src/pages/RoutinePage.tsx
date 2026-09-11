import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ClipboardCopy, Trash2 } from 'lucide-react';
import { useManifest } from '../data/hooks';
import { Hero } from '../components/layout/Hero';
import { StatusBlock } from '../components/ui/primitives';
import { SetupPanel } from '../components/routine/SetupPanel';
import { WeekStrip } from '../components/routine/WeekStrip';
import { Timeline } from '../components/routine/Timeline';
import { ProposalsPanel } from '../components/routine/ProposalsPanel';
import { StepEditor } from '../components/routine/StepEditor';
import { blankStep, type StepDraft } from '../schedule/draft';
import { toast } from '../state/toastStore';
import { usePagePublish } from '../chat/pageContext';
import { useDevPublish } from '../components/dev/devStore';
import { planAsText, SLOT_LABEL, type Day, type Proposal, type Slot, type Step } from '../schedule/model';
import {
  acceptAllPending, acceptProposal, addStep, clearDecided, clearPlan, dismissFill, fillWithAssistant, moveStep, registerCategoryLabels,
  rejectAllPending, rejectProposal, removeStep, stopFill, updateSetup, updateStep, useSchedule,
} from '../schedule/scheduleStore';

type Editor =
  | { kind: 'add'; slot: Slot }
  | { kind: 'edit'; step: Step }
  | { kind: 'proposal'; proposal: Proposal }
  | null;

export default function RoutinePage() {
  const manifest = useManifest();
  const { plan, fill, storageOk } = useSchedule();
  const [params] = useSearchParams();
  const [day, setDay] = useState<Day | null>(null);
  const [editor, setEditor] = useState<Editor>(null);

  const labels = useMemo(() => (manifest.status === 'ready' ? new Map(manifest.data.categories.map((c) => [c.id, c.label])) : new Map<string, string>()), [manifest]);
  const categoryLabel = useCallback((id: string) => labels.get(id) ?? id, [labels]);
  useEffect(() => { registerCategoryLabels(categoryLabel); }, [categoryLabel]);

  const pending = plan.proposals.filter((p) => p.status === 'pending').length;
  usePagePublish({
    routine: { zones: plan.setup.zones, concerns: plan.setup.concerns, skinType: plan.setup.skinType, maxPriceInr: plan.setup.maxPriceInr, steps: plan.steps.length, pending },
    resultCount: null, category: null, filters: [],
  });
  useDevPublish(params.get('dev') === '1', { page: 'routine', steps: plan.steps.length, pending, proposals: plan.proposals.length, fill: fill.phase, storage: storageOk });

  if (manifest.status === 'error') return <StatusBlock title="Could not load the site index" body={manifest.error} />;
  if (manifest.status === 'loading') return <StatusBlock title="Loading your routine…" />;
  const m = manifest.data;
  const filling = fill.phase === 'running';

  const submitEditor = (draft: StepDraft) => {
    if (!editor) return;
    if (editor.kind === 'add') { addStep(draft); toast(`Added to ${SLOT_LABEL[draft.slot].toLowerCase()} routine`); }
    else if (editor.kind === 'edit') updateStep(editor.step.id, draft);
    else { acceptProposal(editor.proposal.id, draft); toast(`Accepted “${draft.title}” with your edits`); }
    setEditor(null);
  };
  const accept = (id: string) => {
    const p = plan.proposals.find((x) => x.id === id);
    acceptProposal(id);
    if (p) toast(`“${p.step.title}” added to ${SLOT_LABEL[p.step.slot].toLowerCase()} routine`);
  };
  const acceptAll = () => { acceptAllPending(); toast(`${pending} proposal${pending === 1 ? '' : 's'} added to your routine`); };
  const copyPlan = async () => {
    try { await navigator.clipboard.writeText(planAsText(plan, categoryLabel)); toast('Routine copied as text'); }
    catch { toast('Could not copy — clipboard access was refused'); }
  };
  const initial: StepDraft = editor?.kind === 'add' ? blankStep(editor.slot, plan.setup.zones[0] ?? 'face')
    : editor?.kind === 'edit' ? { slot: editor.step.slot, days: editor.step.days, zone: editor.step.zone, title: editor.step.title, category: editor.step.category, product: editor.step.product, note: editor.step.note }
    : editor?.kind === 'proposal' ? { ...editor.proposal.step, note: editor.proposal.step.note || editor.proposal.why }
    : blankStep('am', 'face');

  return (
    <div className="pb-16">
      <Hero kicker="My routine · AM / PM · Mon – Sun"
        title="Your week, step by step — filled from real rankings, only on your say-so."
        lede="Set what the plan is for, then let the assistant propose steps and listings from this site's evidence-first rankings. Every proposal waits for you: accept it, edit it, or reject it. Saved in this browser only."
        proofs={[`${plan.steps.length} step${plan.steps.length === 1 ? '' : 's'} on the plan`, pending ? `${pending} pending proposal${pending === 1 ? '' : 's'}` : 'No pending proposals', `${m.categories.length} ranked categories to draw from`]} />

      {!storageOk && (
        <p role="status" className="mb-6 flex items-start gap-2 rounded-[12px] border border-warning/50 bg-warning/10 px-4 py-3 text-[13px] text-primary">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          This browser refused to save the routine (private mode or storage full) — it will be lost when the tab closes.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6 lg:sticky lg:top-24">
          <SetupPanel setup={plan.setup} concerns={m.concerns} filling={filling} onChange={updateSetup} onFill={() => void fillWithAssistant()} onStop={stopFill} />
          {(plan.steps.length > 0 || plan.proposals.length > 0) && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => void copyPlan()} disabled={plan.steps.length === 0}><ClipboardCopy size={14} aria-hidden />Copy as text</button>
              <button type="button" className="btn text-danger" onClick={() => { if (window.confirm('Remove every step and proposal from your routine?')) clearPlan(); }}><Trash2 size={14} aria-hidden />Clear routine</button>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <ProposalsPanel proposals={plan.proposals} fill={fill} categoryLabel={categoryLabel}
            onAccept={accept} onEdit={(p) => setEditor({ kind: 'proposal', proposal: p })} onReject={rejectProposal}
            onAcceptAll={acceptAll} onRejectAll={rejectAllPending} onClearDecided={clearDecided}
            onRetry={() => void fillWithAssistant()} onDismiss={dismissFill} />
          <WeekStrip steps={plan.steps} day={day} onChange={setDay} />
          <Timeline steps={plan.steps} day={day} filling={filling} categoryLabel={categoryLabel}
            onAdd={(slot) => setEditor({ kind: 'add', slot })} onFill={(slot) => void fillWithAssistant({ slot, zone: null })}
            onEdit={(step) => setEditor({ kind: 'edit', step })} onRemove={(id) => { removeStep(id); toast('Step removed'); }} onMove={moveStep} />
        </div>
      </div>

      <StepEditor open={editor !== null} onClose={() => setEditor(null)} onSubmit={submitEditor} initial={initial}
        categories={m.categories} categoryLabel={categoryLabel}
        title={editor?.kind === 'edit' ? 'Edit step' : editor?.kind === 'proposal' ? 'Edit proposal' : 'Add a step'}
        submitLabel={editor?.kind === 'edit' ? 'Save' : editor?.kind === 'proposal' ? 'Accept with edits' : 'Add step'} />
    </div>
  );
}
