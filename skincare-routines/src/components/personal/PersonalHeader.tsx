import { ArrowUpRight, Moon, Sun } from 'lucide-react';

export type PersonalView = 'daily' | 'week' | 'shelf';
const VIEWS = [{ id: 'daily', label: 'Daily routine' }, { id: 'week', label: 'Full week' }, { id: 'shelf', label: 'Product shelf' }] as const;

export function PersonalHeader({ view, onView }: { view: PersonalView; onView: (view: PersonalView) => void }) {
  return (
    <>
      <header className="personal-hero">
        <div>
          <p className="label flex items-center gap-2 text-accent"><span className="personal-kicker-line" aria-hidden />Your personal skin ledger</p>
          <h1>A little care.<br /><span>Every day.</span></h1>
          <p className="personal-lede">Your morning essentials and evening rotation, with a ranked product for every step.</p>
          <div className="mt-6 flex flex-wrap gap-4 text-[13px] font-bold text-secondary">
            <span className="flex items-center gap-2"><Sun size={16} aria-hidden />Daily AM</span>
            <span className="flex items-center gap-2"><Moon size={16} aria-hidden />7-night PM plan</span>
          </div>
        </div>
        <div className="personal-hero-note">
          <span className="label">Less guessing, more clarity</span>
          <p>Your schedule.<br />The Ledger’s evidence.</p>
          <span className="text-[13px] leading-relaxed text-secondary">Every pick shows its category rank, buyer rating and ingredient evidence. Higher-ranked products may not match your requested ingredients.</span>
          <a href="https://skincare-routines-vloimvmn.devinapps.com/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-accent">Original Skin Ledger <ArrowUpRight size={14} aria-hidden /></a>
        </div>
      </header>
      <nav className="personal-views" aria-label="Personal routine views">
        {VIEWS.map((item) => <button type="button" key={item.id} aria-pressed={view === item.id}
          onClick={() => onView(item.id)}>{item.label}</button>)}
      </nav>
    </>
  );
}
