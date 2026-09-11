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
import { PlanStepper, type PlanView } from '../components/routine/plan/PlanStepper';
import { InventoryPanel } from '../components/routine/plan/InventoryPanel';
import { PlanPanel } from '../components/routine/plan/PlanPanel';
import { blankStep, type StepDraft } from '../schedule/draft';
import { toast } from '../state/toastStore';
import { usePagePublish } from '../chat/pageContext';
import { useDevPublish } from '../components/dev/devStore';
import { planAsText, SLOT_LABEL, type Day, type Proposal, type Slot, type Step } from '../schedule/model';
import {
  acceptAllPending, acceptProposal, addStep, clearDecided, clearPlan, dismissFill, moveStep, registerCategoryLabels,
  rejectAllPending, rejectProposal, removeStep, updateSetup, updateStep, useSchedule,
} from '../schedule/scheduleStore';
import {
  buildPlan, choosePick, effectivePick, proposeSteps, registerPlannerContext, resetPlanner, reviewWithAssistant,
  setPlannerInput, setRestNights, stopPlanner, usePlanner,
} from '../schedule/plannerStore';
import { DEV_EXAMPLE_INVENTORY } from '../schedule/planner/devExample';

type Editor =
  | { kind: 'add'; slot: Slot }
  | { kind: 'edit'; step: Step }
  | { kind: 'proposal'; proposal: Proposal }
  | null;

/** Where to open: an existing routine or pending proposals → the routine; a built week → the plan; otherwise the start. */
function startView(steps: number, proposals: number, hasWeek: boolean, hasZones: boolean): PlanView {
  if (hasWeek) return 'plan';
  if (steps > 0 || proposals > 0) return 'routine';
  return hasZones ? 'inventory' : 'setup';
}

export default function RoutinePage() {
  const manifest = useManifest();
  const { plan, fill, storageOk } = useSchedule();
  const planner = usePlanner();
  const [params] = useSearchParams();
  const dev = params.get('dev') === '1';
  const [day, setDay] = useState<Day | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [view, setView] = useState<PlanView>(() => startView(plan.steps.length, plan.proposals.length, planner.week !== null, plan.setup.zones.length > 0));

  const labels = useMemo(() => (manifest.status === 'ready' ? new Map(manifest.data.categories.map((c) => [c.id, c.label])) : new Map<string, string>()), [manifest]);
  const categoryLabel = useCallback((id: string) => labels.get(id) ?? id, [labels]);
  useEffect(() => { registerCategoryLabels(categoryLabel); }, [categoryLabel]);
  useEffect(() => {
    if (manifest.status === 'ready') registerPlannerContext({ labelFor: categoryLabel, categoryIds: manifest.data.categories.map((c) => c.id) });
  }, [manifest, categoryLabel]);

  const pending = plan.proposals.filter((p) => p.status === 'pending').length;
  usePagePublish({
    routine: { zones: plan.setup.zones, concerns: plan.setup.concerns, skinType: plan.setup.skinType, maxPriceInr: plan.setup.maxPriceInr, steps: plan.steps.length, pending },
    resultCount: null, category: null, filters: [],
  });
  useDevPublish(dev, { page: 'routine', view, steps: plan.steps.length, pending, proposals: plan.proposals.length, planner: planner.phase, planSteps: planner.week?.steps.length ?? 0, picked: planner.picked, proposed: planner.proposed.size, storage: storageOk });

  if (manifest.status === 'error') return <StatusBlock title="Could not load the site index" body={manifest.error} />;
  if (manifest.status === 'loading') return <StatusBlock title="Loading your routine…" />;
  const m = manifest.data;

  const reachable = new Set<PlanView>(['setup']);
  if (plan.setup.zones.length) reachable.add('inventory');
  if (planner.week || planner.phase === 'running' || planner.phase === 'error') reachable.add('plan');
  reachable.add('routine');

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
  const build = () => { setView('plan'); void buildPlan(plan.setup); };
  const propose = (ids: string[]) => {
    const n = proposeSteps(ids);
    if (n) toast(`${n} step${n === 1 ? '' : 's'} sent to your routine as pending`);
  };
  const initial: StepDraft = editor?.kind === 'add' ? blankStep(editor.slot, plan.setup.zones[0] ?? 'face')
    : editor?.kind === 'edit' ? { slot: editor.step.slot, days: editor.step.days, zone: editor.step.zone, title: editor.step.title, category: editor.step.category, product: editor.step.product, note: editor.step.note }
    : editor?.kind === 'proposal' ? { ...editor.proposal.step, note: editor.proposal.step.note || editor.proposal.why }
    : blankStep('am', 'face');

  return (
    <div className="pb-16">
      <Hero kicker="My routine · AM / PM · Mon – Sun"
        title="Your week, step by step — actives spaced out, products from real rankings, nothing added without your say-so."
        lede="Say who it's for and what you have. The planner spreads strong actives across the week using sourced pairing rules, pins ranked listings to each step, and the assistant adds a second opinion. Every step waits for you to accept it. Saved in this browser only."
        proofs={[`${plan.steps.length} step${plan.steps.length === 1 ? '' : 's'} on the plan`, pending ? `${pending} pending proposal${pending === 1 ? '' : 's'}` : 'No pending proposals', `${m.categories.length} ranked categories to draw from`]} />

      {!storageOk && (
        <p role="status" className="mb-6 flex items-start gap-2 rounded-[12px] border border-warning/50 bg-warning/10 px-4 py-3 text-[13px] text-primary">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          This browser refused to save the routine (private mode or storage full) — it will be lost when the tab closes.
        </p>
      )}

      <div className="mb-6"><PlanStepper view={view} reachable={reachable} onChange={setView} /></div>

      {view === 'setup' && (
        <div className="mx-auto max-w-[640px]">
          <SetupPanel setup={plan.setup} concerns={m.concerns} onChange={updateSetup} onNext={() => setView('inventory')} />
        </div>
      )}

      {view === 'inventory' && (
        <div className="mx-auto max-w-[640px]">
          <InventoryPanel input={planner.input} restNights={planner.restNights} running={planner.phase === 'running'} canBuild={plan.setup.zones.length > 0}
            onInput={setPlannerInput} onRestNights={setRestNights} onBuild={build} onStop={stopPlanner} example={dev ? DEV_EXAMPLE_INVENTORY : null} />
        </div>
      )}

      {view === 'plan' && (
        <PlanPanel planner={planner} pendingInRoutine={pending} categoryLabel={categoryLabel} effectivePick={effectivePick} onChoose={choosePick}
          onPropose={propose} onProposeAll={() => propose(planner.week?.steps.map((s) => s.id) ?? [])} onReview={() => void reviewWithAssistant(plan.setup)}
          onStop={stopPlanner} onRebuild={() => { resetPlanner(); setView('inventory'); }} onGoRoutine={() => setView('routine')} />
      )}

      {view === 'routine' && (
        <div className="min-w-0 space-y-6">
          <ProposalsPanel proposals={plan.proposals} fill={fill} categoryLabel={categoryLabel}
            onAccept={accept} onEdit={(p) => setEditor({ kind: 'proposal', proposal: p })} onReject={rejectProposal}
            onAcceptAll={acceptAll} onRejectAll={rejectAllPending} onClearDecided={clearDecided}
            onRetry={() => setView('inventory')} onDismiss={dismissFill} />
          <WeekStrip steps={plan.steps} day={day} onChange={setDay} />
          <Timeline steps={plan.steps} day={day} categoryLabel={categoryLabel}
            onAdd={(slot) => setEditor({ kind: 'add', slot })} onPlan={() => setView(plan.setup.zones.length ? 'inventory' : 'setup')}
            onEdit={(step) => setEditor({ kind: 'edit', step })} onRemove={(id) => { removeStep(id); toast('Step removed'); }} onMove={moveStep} />
          {(plan.steps.length > 0 || plan.proposals.length > 0) && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => void copyPlan()} disabled={plan.steps.length === 0}><ClipboardCopy size={14} aria-hidden />Copy as text</button>
              <button type="button" className="btn text-danger" onClick={() => { if (window.confirm('Remove every step and proposal from your routine?')) clearPlan(); }}><Trash2 size={14} aria-hidden />Clear routine</button>
            </div>
          )}
        </div>
      )}

      <StepEditor open={editor !== null} onClose={() => setEditor(null)} onSubmit={submitEditor} initial={initial}
        categories={m.categories} categoryLabel={categoryLabel}
        title={editor?.kind === 'edit' ? 'Edit step' : editor?.kind === 'proposal' ? 'Edit proposal' : 'Add a step'}
        submitLabel={editor?.kind === 'edit' ? 'Save' : editor?.kind === 'proposal' ? 'Accept with edits' : 'Add step'} />
    </div>
  );
}
