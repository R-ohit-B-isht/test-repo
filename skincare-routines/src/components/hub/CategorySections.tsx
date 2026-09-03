import { Reveal } from '../fx/Reveal';
import { CategoryCard } from './CategoryCard';
import { SectionHead } from '../ui/primitives';
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
            <SectionHead id={`zone-${s.key}`} title={s.title} tone={s.tone} sub={compact ? undefined : s.sub}
              meta={`${cats.length} categories · ${cats.reduce((n, c) => n + c.count, 0).toLocaleString('en-IN')} listings`} />
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cats.map((c) => <CategoryCard key={c.id} cat={c} />)}
            </Reveal>
          </section>
        );
      })}
    </div>
  );
}
