import { Check } from 'lucide-react';
import type { PersonalStep } from '../../data/personalSchedule';
import { PersonalProduct } from './PersonalProduct';

interface Props {
  steps: PersonalStep[];
  completed?: string[];
  onToggle?: (id: string) => void;
}

export function PersonalSteps({ steps, completed = [], onToggle }: Props) {
  return (
    <ol className="personal-steps">
      {steps.map((step, index) => {
        const done = completed.includes(step.id);
        return (
          <li key={step.id} className="personal-step">
            <div className="personal-step-heading">
              {onToggle ? (
                <button type="button" className="personal-step-check press" aria-pressed={done}
                  aria-label={`${done ? 'Unmark' : 'Complete'} ${step.title}`} onClick={() => onToggle(step.id)}>
                  {done ? <Check size={18} aria-hidden /> : String(index + 1).padStart(2, '0')}
                </button>
              ) : <span className="personal-step-check" aria-hidden>{String(index + 1).padStart(2, '0')}</span>}
              <div className="min-w-0">
                <h3 className="flex flex-wrap items-center gap-2 text-[18px] font-bold text-display">
                  {step.title}{step.bodyOnly && <span className="personal-body-label">Not for face</span>}
                </h3>
                <p className="mt-1 text-[13px] text-secondary">{step.ingredients}</p>
              </div>
            </div>
            <div className="personal-step-content">
              {step.note && <p className="mb-4 text-[13px] leading-relaxed text-secondary">{step.note}</p>}
              <div className={step.picks.length > 1 ? 'grid gap-3 min-[640px]:grid-cols-2' : ''}>
                {step.picks.map((pick) => <PersonalProduct key={pick} pickKey={pick} />)}
              </div>
              {step.alternatives && (
                <details className="mt-3">
                  <summary className="cursor-pointer py-3 text-[13px] font-bold text-accent">Kojic acid alternative</summary>
                  <div className="mt-1 grid gap-3">{step.alternatives.map((pick) => <PersonalProduct key={pick} pickKey={pick} />)}</div>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
