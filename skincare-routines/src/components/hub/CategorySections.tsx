import { Reveal } from '../fx/Reveal';
import { CategoryCard } from './CategoryCard';
import type { CategoryMeta, Zone } from '../../lib/types';

type SectionKey = Zone | 'protocol';
const SECTIONS: { key: SectionKey; title: string; sub: string; tone: string }[] = [
  { key: 'face', title: 'Face', sub: 'Cleansers, actives, treatments and care made for the face.', tone: 'zone-face' },
  { key: 'both', title: 'Face + body', sub: 'Categories where face and body products sit side by side — split them with the Face / Body control inside.', tone: 'zone-both' },
  { key: 'body', title: 'Body', sub: 'Below the neck: washes, lotions and rough-skin care.', tone: 'zone-body' },
  { key: 'protocol', title: 'Protocols', sub: 'Multi-step plans with the products for each step, plus the honest timeline.', tone: 'text-accent' },
];
const sectionOf = (c: CategoryMeta): SectionKey => (c.kicker === 'PROTOCOL' ? 'protocol' : c.zone);

/** Category hub grouped by where the product goes — face, face + body, body — so nothing is one big dump. */
export function CategorySections({ categories, compact }: { categories: CategoryMeta[]; compact?: boolean }) {
  return (
    <div className="space-y-12">
      {SECTIONS.map((s) => {
        const cats = categories.filter((c) => sectionOf(c) === s.key);
        if (!cats.length) return null;
        return (
          <section key={s.key} aria-labelledby={`zone-${s.key}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 id={`zone-${s.key}`} className={`text-[26px] ${s.tone}`}>{s.title}</h2>
                {!compact && <p className="mt-1 text-[13px] text-secondary">{s.sub}</p>}
              </div>
              <span className="label">{cats.length} categories · {cats.reduce((n, c) => n + c.count, 0).toLocaleString('en-IN')} listings</span>
            </div>
            <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cats.map((c) => <CategoryCard key={c.id} cat={c} />)}
            </Reveal>
          </section>
        );
      })}
    </div>
  );
}
