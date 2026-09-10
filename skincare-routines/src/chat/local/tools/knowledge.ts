/** Ingredient knowledge tool: resolves what the user said ("retinol", "BHA", "vit C") to ingredient families and
 * returns the site's sourced guidance — graded actives, safety flags, pairing verdicts, usage notes — plus the ranked
 * categories where those actives are core, so general advice can hand off to real listings. Twin of chat_api/tools/knowledge.py. */
import type { IngredientFamily, KnowledgeData, Manifest, Pairing, PairingVerdict, SourceRef } from '../../../lib/types';
import { DataError } from '../store';
import { categoryUrl, strList, ToolError, type Json, type Tool, type ToolContext } from './base';

const VERDICT_MEANING: Record<PairingVerdict, string> = {
  avoid: 'do not apply together in the same routine step',
  caution: 'can be combined, but stagger them (AM/PM or alternate nights) and build up slowly',
  fine: 'no evidence of a problem using both',
  synergy: 'evidence they work better or gentler together',
  essential: 'the second is a required companion of the first',
};
const VERDICT_ORDER: PairingVerdict[] = ['avoid', 'caution', 'essential', 'synergy', 'fine'];
const EVIDENCE_MEANING = {
  direct: 'a cited study examined this combination',
  inference: "follows from each ingredient's own cited profile; no study on the pair itself",
  regulatory: "a regulator's instruction",
};

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9%.\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
const wordMatch = (text: string, alias: string) => text === alias || new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}([^a-z0-9]|$)`).test(text);

function resolveFamily(query: string, families: IngredientFamily[]): IngredientFamily | null {
  const q = norm(query);
  if (!q) return null;
  let best: { fam: IngredientFamily; len: number } | null = null;
  for (const fam of families) {
    for (const alias of [...fam.aliases, ...fam.inci, fam.id]) {
      const a = norm(alias);
      if (a.length > (best?.len ?? 0) && wordMatch(q, a)) best = { fam, len: a.length };
    }
  }
  return best?.fam ?? null;
}

const cite = (keys: string[], sources: Record<string, SourceRef>) => keys.map((k) => sources[k]).filter(Boolean);

function pairingSummary(p: Pairing, byId: Map<string, IngredientFamily>, sources: Record<string, SourceRef>): Json {
  return {
    between: p.pair.map((id) => byId.get(id)?.label ?? id),
    verdict: p.verdict, verdictMeaning: VERDICT_MEANING[p.verdict],
    evidence: p.evidence, evidenceMeaning: EVIDENCE_MEANING[p.evidence],
    headline: p.headline, detail: p.detail, how: p.how, sources: cite(p.src, sources),
  };
}

function familySummary(fam: IngredientFamily, kb: KnowledgeData, m: Manifest, ctx: ToolContext): Json {
  const actives = kb.actives.filter((a) => fam.inci.includes(a.name));
  const categories = new Map<string, number>();
  for (const a of actives) for (const r of a.roles) categories.set(r, (categories.get(r) ?? 0) + 1);
  const rankedIn = [...categories.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([id]) => {
    const meta = m.categories.find((c) => c.id === id);
    return { category: id, label: meta?.label ?? id, listings: meta?.count ?? null, url: categoryUrl(ctx, id) };
  });
  return {
    family: fam.id, label: fam.label,
    actives: actives.map((a) => ({ inci: a.name, grade: a.grade, gradeMeaning: GRADE[a.grade], source: m.sources[a.src] ?? null })),
    usage: kb.usage.filter((u) => u.family === fam.id).flatMap((u) => u.notes.map((note) => ({ note, sources: cite(u.src, m.sources) }))),
    rankedIn,
  };
}

const GRADE = { A: 'multiple RCTs / regulatory monograph', B: 'clinical studies', C: 'in-vitro, animal or manufacturer data' };

export const getIngredientKnowledge: Tool = {
  name: 'get_ingredient_knowledge',
  description:
    'The site\'s sourced ingredient knowledge for general skincare / hair-care questions: what an ingredient is (evidence grade + cited paper), '
    + 'whether two ingredients can be layered (verdict avoid / caution / fine / synergy / essential, with the why and how), usage notes '
    + '(timing, sun, who should ask a doctor), safety flags, and which ranked categories carry each active. Pass every ingredient, acid or '
    + 'step the user named (e.g. ["retinol","BHA"]). This is general guidance about ingredients, never about one product\'s formula.',
  parameters: () => ({
    type: 'object',
    properties: {
      ingredients: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8, description: "Ingredient names or families as the user said them, e.g. 'retinol', 'BHA', 'vitamin c', 'glycolic acid', 'heat protectant'" },
    },
    required: ['ingredients'],
  }),
  async run(args, ctx) {
    const queries = strList(args.ingredients).map((s) => s.trim()).filter(Boolean);
    if (!queries.length) throw new ToolError('ingredients is required (one or more ingredient names)');
    let kb: KnowledgeData;
    try {
      kb = await ctx.store.knowledge();
    } catch (err) {
      if (err instanceof DataError) throw new ToolError(err.message);
      throw err;
    }
    const m = await ctx.store.manifest();
    const byId = new Map(kb.families.map((f) => [f.id, f]));
    const resolved = new Map<string, IngredientFamily>();
    const unresolved: string[] = [];
    for (const q of queries) {
      const fam = resolveFamily(q, kb.families);
      if (fam) resolved.set(fam.id, fam);
      else unresolved.push(q);
    }
    const flags = kb.flags
      .filter((f) => queries.some((q) => wordMatch(norm(q), norm(f.id)) || f.names.some((n) => wordMatch(norm(q), norm(n)))))
      .map((f) => ({ id: f.id, label: f.label, examples: f.names.slice(0, 6), source: m.sources[f.src] ?? null }));
    const ids = [...resolved.keys()];
    const among = kb.pairings.filter((p) => p.pair.every((id) => resolved.has(id)));
    const involving = ids.length === 1 || !among.length ? kb.pairings.filter((p) => p.pair.some((id) => resolved.has(id)) && !among.includes(p)) : [];
    const rank = (p: Pairing) => VERDICT_ORDER.indexOf(p.verdict);
    return {
      asked: queries,
      ingredients: ids.map((id) => familySummary(resolved.get(id)!, kb, m, ctx)),
      notInKnowledgeBase: unresolved,
      pairingsBetweenAsked: among.sort((a, b) => rank(a) - rank(b)).map((p) => pairingSummary(p, byId, m.sources)),
      otherPairings: involving.sort((a, b) => rank(a) - rank(b)).map((p) => pairingSummary(p, byId, m.sources)),
      safetyFlags: flags,
      note: 'General, sourced guidance about ingredients — not a statement about any listing. A product\'s actual formula must come from get_product. '
        + 'For prescription drugs, pregnancy, or a skin condition, advise a dermatologist.',
    };
  },
};
