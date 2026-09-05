import { Reveal } from '../fx/Reveal';
import { CategoryCard } from './CategoryCard';
import { SectionHead } from '../ui/primitives';
import type { CategoryMeta, FamilyKey } from '../../lib/types';
import { FAMILY_TONE } from '../../domain/scoreMeta';

/** Hub order and one-line sub per family; labels come from the manifest so the data owns the naming. */
const FAMILIES: { key: FamilyKey; sub: string }[] = [
  { key: 'power', sub: 'Chargers and packs — scored on the capacity, output, protocols and protections a maker page or spec table actually states.' },
  { key: 'grooming', sub: 'Trimmers, dryers and the like — motor, heat, runtime and safety certification from the maker, not the box.' },
  { key: 'kitchen', sub: 'Cooktops, blenders, lighters — rated power, materials and safety marks read from where they are published.' },
  { key: 'drinkware', sub: 'Tumblers and bottles — capacity, insulation construction and food-grade materials as the maker declares them.' },
  { key: 'outdoor', sub: 'Trekking shoes and packs — sole, upper, closure, volume and weight from the maker\u2019s own spec sheet.' },
];

/** Manifest family labels are upper-case badge text; headings read better in sentence case. */
const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Category hub grouped by product family, so power banks never sit next to trekking shoes as one undifferentiated list. */
export function CategorySections({ categories, families, compact }: { categories: CategoryMeta[]; families: Record<FamilyKey, string>; compact?: boolean }) {
  return (
    <div className="space-y-12">
      {FAMILIES.map((f) => {
        const cats = categories.filter((c) => c.family === f.key);
        if (!cats.length) return null;
        return (
          <section key={f.key} aria-labelledby={`fam-${f.key}`}>
            <SectionHead id={`fam-${f.key}`} title={sentence(families[f.key])} tone={FAMILY_TONE[f.key].text} sub={compact ? undefined : f.sub}
              meta={`${cats.length} ${cats.length === 1 ? 'category' : 'categories'} · ${cats.reduce((n, c) => n + c.count, 0).toLocaleString('en-IN')} listings`} />
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cats.map((c) => <CategoryCard key={c.id} cat={c} familyLabel={families[c.family]} />)}
            </Reveal>
          </section>
        );
      })}
    </div>
  );
}
