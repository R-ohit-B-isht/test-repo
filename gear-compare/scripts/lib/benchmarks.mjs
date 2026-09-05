// Benchmark validation + marketplace matching for the per-category reference ceiling.
// A benchmark never enters the listing index; the only thing it borrows from the
// marketplace data is the rank of a verified matching listing, if one exists.

const HTTP = /^https?:\/\//;

export function assertBenchmark(b, categoryIds) {
  const problems = [];
  if (!categoryIds.has(b.category)) problems.push(`category "${b.category}" unknown`);
  for (const k of ['brand', 'name', 'why']) if (typeof b[k] !== 'string' || !b[k].trim()) problems.push(k);
  if (!HTTP.test(b.maker?.url || '') || !b.maker?.label) problems.push('maker');
  if (!HTTP.test(b.image?.url || '') || !b.image?.source) problems.push('image');
  if (!Array.isArray(b.facts) || !b.facts.length || b.facts.some((f) => !f.k || !f.v)) problems.push('facts');
  if (!Array.isArray(b.evidence) || !b.evidence.length) problems.push('evidence');
  else b.evidence.forEach((e, i) => { if (!HTTP.test(e.url || '') || !e.label || !e.publisher) problems.push(`evidence[${i}]`); });
  if (b.caution !== null && typeof b.caution !== 'string') problems.push('caution');
  if (b.match !== null && (typeof b.match?.brand !== 'string' || typeof b.match?.model !== 'string')) problems.push('match');
  if (b.match?.exact !== undefined && typeof b.match.exact !== 'boolean') problems.push('match.exact');
  if (b.match?.exact === false && !b.match.note) problems.push('match.note (required when exact: false)');
  if (problems.length) throw new Error(`benchmarks.js: ${b.category} benchmark invalid: ${problems.join(', ')}`);
}

export function assertBenchmarkSet(benchmarks, categoryIds) {
  const seen = new Set();
  for (const b of benchmarks) {
    assertBenchmark(b, categoryIds);
    if (seen.has(b.category)) throw new Error(`benchmarks.js: duplicate benchmark for ${b.category}`);
    seen.add(b.category);
  }
  for (const id of categoryIds) if (!seen.has(id)) throw new Error(`benchmarks.js: no benchmark for category ${id}`);
}

// Same ordering the UI uses for the default rank (score desc, then price asc).
export function rankOrder(items) {
  return items.map((_, i) => i).sort((x, y) => items[y].s - items[x].s || items[x].p - items[y].p);
}

export function matchBenchmark(b, items) {
  if (!b.match) return { status: 'not-found', note: 'Not searched for on Flipkart / Amazon.in.' };
  const brand = new RegExp(b.match.brand, 'i');
  const model = new RegExp(b.match.model, 'i');
  const order = rankOrder(items);
  const hits = [];
  order.forEach((pos, r) => {
    const it = items[pos];
    if (brand.test(it.b) && model.test(`${it.b} ${it.m}`)) hits.push({ ...it, rank: r + 1 });
  });
  if (!hits.length) {
    return { status: 'not-found', note: b.match.note || 'No matching listing found on Flipkart / Amazon.in in this dataset.' };
  }
  const top = hits[0];
  return {
    status: b.match.exact === false ? 'related' : 'found', id: top.id, rank: top.rank, of: items.length, score: top.s, price: top.p, store: top.st,
    title: `${top.b} ${top.m}`, listings: hits.length, note: b.match.note, ev: top.ev,
  };
}

export function publicBenchmark(b, market) {
  return {
    category: b.category, brand: b.brand, name: b.name, variant: b.variant || null,
    maker: b.maker, image: b.image, why: b.why, facts: b.facts, evidence: b.evidence, caution: b.caution, market,
  };
}
