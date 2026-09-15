import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SHELF_PICKS } from '../data/personalPicks';
import { PERSONAL_WEEK } from '../data/personalSchedule';
import { useDevPublish } from '../components/dev/devStore';
import { PersonalDaily } from '../components/personal/PersonalDaily';
import { PersonalHeader, type PersonalView } from '../components/personal/PersonalHeader';
import { PersonalProduct } from '../components/personal/PersonalProduct';
import { FullWeek, PersonalWeek } from '../components/personal/PersonalWeek';
import './personal.css';

export default function PersonalPage() {
  const [view, setView] = useState<PersonalView>('daily');
  const [day, setDay] = useState(() => (new Date().getDay() + 6) % 7);
  const [period, setPeriod] = useState<'am' | 'pm'>('am');
  const [params] = useSearchParams();
  useDevPublish(params.get('dev') === '1', {
    page: 'personal', view, day: PERSONAL_WEEK[day].name, period, selectedProducts: SHELF_PICKS.length,
    dataSource: 'Original category JSON; ranks computed by buildIndex',
  });
  function selectEvening(index: number) {
    setDay(index); setPeriod('pm'); setView('daily');
    document.getElementById('personal-content')?.scrollIntoView({ block: 'start' });
  }
  return (
    <div className="personal-page">
      <PersonalHeader view={view} onView={setView} />
      <div id="personal-content" className="personal-layout">
        <div className="min-w-0">
          {view === 'daily' && <PersonalDaily day={day} onDay={setDay} period={period} onPeriod={setPeriod} />}
          {view === 'week' && <FullWeek />}
          {view === 'shelf' && <ProductShelf />}
        </div>
        <div className="personal-sidebar">
          <PersonalWeek onSelect={selectEvening} />
          <div className="mt-5 px-2 text-[13px] leading-relaxed text-secondary">
            <p className="font-bold text-display">Read the numbers separately.</p>
            <p className="mt-2">Rank is within the full category. Stars are marketplace buyer ratings out of 5. Evidence scores are out of 100, using the site’s original methodology.</p>
            <p className="mt-3">Products and prices come from the Ledger’s saved listings, not a live stock check. Ingredient matches use its recorded lists; always check your own packaging.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductShelf() {
  return <section aria-labelledby="shelf-heading">
    <p className="label">Your ingredient-matched shortlist</p>
    <h2 id="shelf-heading" className="mt-2 text-[28px] text-display">Everything on your shelf.</h2>
    <p className="mb-6 mt-2 text-[13px] text-secondary">{SHELF_PICKS.length} distinct listings, including alternatives. Repeated steps share the same product.</p>
    <div className="grid gap-4 min-[640px]:grid-cols-2">{SHELF_PICKS.map((key) => <PersonalProduct key={key} pickKey={key} />)}</div>
  </section>;
}
