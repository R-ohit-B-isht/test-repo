import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search, Shuffle, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useManifest } from '../../data/hooks';
import { usePrefersReducedMotion } from '../../lib/format';
import { FamilyBadge } from '../ui/primitives';
import { buildCommands, type Command } from './commands';

const EASE = [0.23, 1, 0.32, 1] as const;

/** Explore-style "show me…" prompt (Screenroom command-input + ⌘K): finds a category, a size-class or maker-verified slice of it, or searches inside the current page. */
export function CommandSearch() {
  const manifest = useManifest();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const dev = params.get('dev') === '1';
  const currentCategory = pathname.startsWith('/c/') ? pathname.slice(3).split('/')[0] : null;
  const all = useMemo(() => (manifest.status === 'ready' ? buildCommands(manifest.data.categories, manifest.data.families, currentCategory, dev) : []), [manifest, currentCategory, dev]);
  const sections = useMemo(() => groupBy(filter(all, q)), [all, q]);
  /** Display order (grouped) is the keyboard order, so ↑↓/↵ always act on the highlighted row. */
  const results = useMemo(() => sections.flatMap(([, cmds]) => cmds), [sections]);
  const indexOf = useMemo(() => new Map(results.map((c, i) => [c.id, i])), [results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setQ(''); setCursor(0); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const t = requestAnimationFrame(() => input.current?.focus());
    return () => { cancelAnimationFrame(t); document.body.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const openSearch = () => { setQ(''); setCursor(0); setOpen(true); };
  const onInput = (v: string) => { setQ(v); setCursor(0); };
  const run = (c: Command) => { setOpen(false); navigate(c.to); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const c = results[cursor]; if (c) run(c); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={openSearch} aria-label="Show me… (search categories, press / or ⌘K)"
        className="btn h-9 shrink-0 gap-2 px-3 text-secondary sm:min-w-[180px] sm:justify-start">
        <Search size={15} aria-hidden />
        <span className="hidden text-[13px] font-semibold sm:inline">Show me…</span>
        <kbd className="mono ml-auto hidden rounded border border-line bg-raised px-1.5 text-[11px] font-bold text-muted md:inline">/</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(26,23,29,0.45)] px-4 pt-[10vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
            <motion.div role="dialog" aria-modal="true" aria-label="Show me" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
              className="card flex w-full max-w-xl flex-col overflow-hidden shadow-[0_24px_64px_-24px_rgba(26,23,29,0.5)]">
              <label className="flex items-center gap-3 border-b border-line px-4">
                <Sparkles size={16} className="shrink-0 text-accent" aria-hidden />
                <input ref={input} value={q} onChange={(e) => onInput(e.target.value)} onKeyDown={onKeyDown} role="combobox" aria-expanded aria-controls="cmd-list" aria-activedescendant={results[cursor] ? `cmd-${results[cursor].id}` : undefined} aria-autocomplete="list"
                  placeholder={currentCategory ? 'Show me… a category, or a brand on this page' : 'Show me… sunscreen, body, retinol, protocol'} className="h-14 min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-display outline-none placeholder:font-medium placeholder:text-muted" />
                <kbd className="mono hidden rounded border border-line bg-raised px-1.5 text-[11px] font-bold text-muted sm:inline">esc</kbd>
              </label>
              <ul ref={list} id="cmd-list" role="listbox" className="scrollbar-thin max-h-[52vh] overflow-y-auto p-1.5">
                {results.length === 0 && <li className="px-3 py-6 text-center text-[14px] text-secondary">Nothing matches “{q}”. Try a category name, a size class or “maker-verified”.</li>}
                {sections.map(([section, cmds]) => (
                  <li key={section}>
                    <p className="label px-3 pb-1 pt-2.5">{section}</p>
                    <ul role="group" aria-label={section}>
                      {cmds.map((c) => {
                        const idx = indexOf.get(c.id) ?? -1;
                        const active = idx === cursor;
                        return (
                          <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={active} data-i={idx}>
                            <button type="button" tabIndex={-1} onClick={() => run(c)} onMouseMove={() => setCursor(idx)}
                              className={clsx('flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors', active ? 'bg-accent-soft' : 'hover:bg-raised')}>
                              <span className="shrink-0 text-secondary" aria-hidden>{c.kind === 'surprise' ? <Shuffle size={15} /> : <Search size={15} />}</span>
                              <span className="min-w-0 flex-1">
                                <span className={clsx('block truncate text-[14px] font-bold', active ? 'text-accent' : 'text-display')}>{c.label}</span>
                                {c.hint && <span className="block truncate text-[12px] text-secondary">{c.hint}</span>}
                              </span>
                              {c.family && c.familyLabel && <FamilyBadge family={c.family} label={c.familyLabel} />}
                              {c.count !== undefined && <span className="mono shrink-0 text-[12px] font-bold text-muted">{c.count.toLocaleString('en-IN')}</span>}
                              {active && <CornerDownLeft size={14} className="shrink-0 text-muted" aria-hidden />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2 text-[12px] text-muted">
                <span>↑↓ move · ↵ open · esc close</span>
                {manifest.status === 'ready' && <span className="mono">{manifest.data.total.toLocaleString('en-IN')} real listings</span>}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function filter(all: Command[], q: string): Command[] {
  const s = q.trim().toLowerCase();
  if (!s) return all.filter((c) => c.kind !== 'query');
  const words = s.split(/\s+/);
  const scored = all
    .map((c) => {
      if (c.kind === 'query') return { c: { ...c, label: `Search “${q.trim()}” on this page`, to: c.to + encodeURIComponent(q.trim()) }, w: 0.5 };
      const hay = `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`.toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      if (hits < words.length) return null;
      return { c, w: (c.label.toLowerCase().startsWith(s) ? 3 : 0) + hits + (c.kind === 'category' ? 1 : 0) };
    })
    .filter((x): x is { c: Command; w: number } => x !== null)
    .sort((a, b) => b.w - a.w);
  return scored.map((x) => x.c);
}

function groupBy(cmds: Command[]): [string, Command[]][] {
  const order: Command['section'][] = ['Categories', 'One size class only', 'Maker-verified only', 'Just browsing', 'On this page'];
  const m = new Map<string, Command[]>();
  for (const c of cmds) m.set(c.section, [...(m.get(c.section) ?? []), c]);
  return order.filter((k) => m.has(k)).map((k) => [k, m.get(k)!]);
}
