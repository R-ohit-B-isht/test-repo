// Emits public/data/knowledge.json: the sourced ingredient knowledge (graded actives, safety flags, pairing and
// usage guidance) the in-browser assistant reads through get_ingredient_knowledge. Same tables the scorer uses, so
// the assistant's ingredient talk and the listing scores can never disagree.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SOURCES, ACTIVES, HAIR_ACTIVES } = require('./inci-kb.cjs');
const { FLAGS } = require('./inci-flags.cjs');
const { FAMILIES, PAIRINGS, USAGE } = require('./pairing-kb.cjs');

const active = ([name, grade, src, roles], zone) => ({ name, grade, src, zone, roles });

export function writeKnowledge(outDir, generatedAt, categoryIds) {
  const known = new Set(categoryIds);
  const actives = [...ACTIVES.map((a) => active(a, 'skin')), ...HAIR_ACTIVES.map((a) => active(a, 'hair'))]
    .map((a) => ({ ...a, roles: a.roles.filter((r) => known.has(r)) }));
  for (const a of actives) if (!SOURCES[a.src]) throw new Error(`knowledge: active ${a.name} cites unknown source ${a.src}`);
  for (const p of PAIRINGS) for (const s of p.src) if (!SOURCES[s]) throw new Error(`knowledge: pairing ${p.pair.join('+')} cites unknown source ${s}`);
  for (const u of USAGE) for (const s of u.src) if (!SOURCES[s]) throw new Error(`knowledge: usage ${u.family} cites unknown source ${s}`);
  const flags = FLAGS.map((f) => ({ id: f.id, label: f.label, names: f.names, src: f.src }));
  const payload = { generatedAt, families: FAMILIES, actives, flags, pairings: PAIRINGS, usage: USAGE };
  fs.writeFileSync(path.join(outDir, 'knowledge.json'), JSON.stringify(payload));
  return { file: 'knowledge.json', actives: actives.length, pairings: PAIRINGS.length, families: FAMILIES.length };
}
