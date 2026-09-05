// Specification extraction from a maker's product page. Produces a key→value map from the structures makers
// actually publish (spec tables, dt/dd lists, "Key: value" lines, short label/value line pairs) plus the prose of
// the main product region. Nothing here scores anything — parsing/plausibility live in the site schema.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#8211': '–', '#8212': '—', '#8226': '•', '#215': '×', '#176': '°' };
const decode = (s) => String(s).replace(/&(#?\w+);/g, (m, e) => (ENT[e] !== undefined ? ENT[e] : /^#\d+$/.test(e) ? String.fromCodePoint(Number(e.slice(1))) : m));
const clean = (s) => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const STOP = /you may also like|related products|recently viewed|customer reviews|frequently bought|similar products|recommended for you|people also bought|complete the look/i;

export function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
}

// Text lines of the main product region (cut at the first "related products"-style heading).
export function mainLines(html) {
  const lines = decode(stripHtml(html).replace(/<(?:br|\/p|\/li|\/tr|\/td|\/th|\/div|\/h\d|\/dt|\/dd|\/span|\/strong|\/b)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const cut = lines.findIndex((l) => l.length < 60 && STOP.test(l));
  return cut > 20 ? lines.slice(0, cut) : lines;
}

function tableKv(html, kv) {
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => clean(m[1]));
    if (cells.length === 2 && cells[0] && cells[1] && cells[0].length <= 60) kv[cells[0]] ??= cells[1];
  }
  for (const dl of html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi)) {
    const dts = [...dl[1].matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/gi)].map((m) => clean(m[1]));
    const dds = [...dl[1].matchAll(/<dd[^>]*>([\s\S]*?)<\/dd>/gi)].map((m) => clean(m[1]));
    if (dts.length === dds.length) dts.forEach((k, i) => { if (k && dds[i] && k.length <= 60) kv[k] ??= dds[i]; });
  }
}

function colonKv(lines, kv) {
  for (let i = 0; i < lines.length; i++) {
    const m = /^([A-Za-z][A-Za-z0-9 .()/&-]{1,40}?)\s*:\s*(.{1,160})$/.exec(lines[i]);
    if (m && !/^https?/.test(m[2])) { kv[m[1].trim()] ??= m[2].trim(); continue; }
    const k = /^([A-Za-z][A-Za-z0-9 .()/&-]{1,40}?)\s*:$/.exec(lines[i]);
    if (k && lines[i + 1] && lines[i + 1].length <= 160) { kv[k[1].trim()] ??= lines[i + 1]; i++; }
  }
}

// Zebronics / boAt-style flat spec lists: a short label line immediately followed by a short value line.
// A short label line that already carries a number ("1 Year Warranty", "Net Weight: 250 Gram") is self-contained.
function pairKv(lines, labels, kv) {
  const isLabel = (l) => l.length <= 40 && labels.some((x) => x.test(l));
  for (let i = 0; i < lines.length - 1; i++) {
    const k = lines[i];
    const v = lines[i + 1];
    if (!isLabel(k)) continue;
    if (/\d/.test(k) && k.length <= 50) { kv[k] ??= k; continue; }
    if (isLabel(v) || v.length > 160 || /:$/.test(k)) continue;
    kv[k] ??= v;
    i++;
  }
}

/**
 * @param {string} html   maker product page
 * @param {RegExp[]} labels  label patterns the site cares about (built from field.official labels)
 * @returns {{ kv: Record<string,string>, text: string, lines: number }}
 */
export function extractSpecs(html, labels) {
  const kv = {};
  const lines = mainLines(html);
  tableKv(stripHtml(html), kv);
  colonKv(lines, kv);
  pairKv(lines, labels, kv);
  return { kv, text: lines.join('\n'), lines: lines.length };
}

export function labelPatterns(site) {
  const set = new Set();
  for (const f of site.fields) for (const l of f.official || [f.label]) set.add(l.toLowerCase());
  return [...set].map((l) => new RegExp(`\\b${l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*')}\\b`, 'i'));
}
