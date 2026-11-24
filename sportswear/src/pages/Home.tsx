import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useLoad, type Manifest, type RowsFile } from '../data';
import { Score } from '../components/bits';

const q = (k: string, v: string) => `/browse?${new URLSearchParams({ [k]: v })}`;
const QUICK: [string, string, string][] = [
  ['Jerseys', 'cat', 'Jerseys'], ['Motorsport', 'sport', 'Motorsport'], ['Slides', 'cat', 'Slides'], ['Slippers', 'cat', 'Slippers'], ['Flip-flops', 'cat', 'Flip-Flops'], ['Sandals', 'cat', 'Sandals'],
  ['Running shoes', 'cat', 'Running Shoes'], ['Football boots', 'cat', 'Football Boots'], ['Basketball', 'sport', 'Basketball'], ['Training', 'sport', 'Training'], ['Cricket', 'sport', 'Cricket'], ['Tennis', 'sport', 'Tennis'],
  ['Golf', 'sport', 'Golf'], ['Lifestyle sneakers', 'cat', 'Lifestyle Sneakers'], ['Hoodies', 'cat', 'Hoodies'], ['Sweatshirts', 'cat', 'Sweatshirts'], ['Track tops', 'cat', 'Track Tops'], ['Backpacks', 'cat', 'Backpacks'],
  ['Elite tier only', 'tier', 'Elite tier'], ['Jordan', 'line', 'Nike · Jordan'], ['adidas Originals', 'line', 'Adidas · adidas Originals'], ['Scuderia Ferrari', 'team', 'Scuderia Ferrari'],
];

export default function Home() {
  const m = useLoad<Manifest>('manifest.json');
  const rf = useLoad<RowsFile>('rows.json');
  const byId = useMemo(() => new Map(rf?.rows.map((r) => [r.id, r]) ?? []), [rf]);
  if (!m) return <p className="p-8 text-muted">Loading…</p>;
  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-24">
      <section className="py-10 sm:py-14">
        <p className="label text-accent">Puma India · Nike India · adidas · {m.total.toLocaleString('en-IN')} men’s and unisex products</p>
        <h1 className="mt-2 max-w-3xl text-[32px] font-extrabold leading-tight tracking-tight text-display sm:text-[44px]">Every men’s product from the three brands, ranked on quality only.</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-secondary">Score = maker tier {m.weights.tier}% · technology {m.weights.tech}% · materials {m.weights.materials}% · buyer rating {m.weights.buyers}% · spec transparency {m.weights.transparency}%. Price is shown for reference and never counts toward the score.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(m.brands).map(([b, n]) => <Link key={b} to={q('brand', b)} className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold ring-1 ring-line hover:ring-line-strong">{b} <span className="text-muted">{n.toLocaleString('en-IN')}</span></Link>)}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {QUICK.map(([l, k, v]) => <Link key={l} to={q(k, v)} className="rounded-full bg-accent-soft px-3 py-1.5 text-[13px] font-bold text-accent hover:brightness-95">{l}</Link>)}
        </div>
      </section>
      {Object.entries(m.depts).map(([dk, dl]) => (
        <section key={dk} className="mt-8">
          <div className="flex items-baseline justify-between"><h2 className="text-[22px] font-extrabold text-display">{dl}</h2><Link to={q('dept', dl)} className="text-[13px] font-bold text-accent">See all →</Link></div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {m.categories.filter((c) => c.dept === dk).sort((a, b) => b.count - a.count).map((c) => {
              const top = byId.get(c.top[0]);
              return (
                <Link key={c.id} to={q('cat', c.label)} className="card card-hover flex gap-3 p-3">
                  <span className="h-[88px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">{c.img && <img src={c.img} alt="" loading="lazy" className="h-full w-full object-contain" />}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-extrabold text-display">{c.label}</span>
                    <span className="block text-[12px] text-muted">{c.count} items · {Object.entries(c.byBrand).filter(([, n]) => n).map(([b, n]) => `${b} ${n}`).join(' · ')}</span>
                    {top && <span className="mt-1.5 flex items-center gap-2"><Score s={top.s} /><span className="line-clamp-2 text-[12px] font-bold leading-snug text-secondary">#1 {top.b} {top.n}</span></span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <section className="card mt-12 p-5 text-[14px] text-secondary">
        <h2 className="text-[18px] font-extrabold text-display">How the score works</h2>
        <ul className="mt-3 space-y-2">{Object.entries(m.criteria).map(([k, v]) => <li key={k}><b className="text-primary">{k[0].toUpperCase() + k.slice(1)} ({m.weights[k as keyof typeof m.weights]}%)</b>: {v}</li>)}</ul>
        <p className="mt-3">Sources: {Object.entries(m.sources).map(([b, s]) => `${b}: ${s}`).join(' · ')}. Data collected {new Date(m.generatedAt).toLocaleDateString('en-IN')}.</p>
      </section>
    </main>
  );
}
