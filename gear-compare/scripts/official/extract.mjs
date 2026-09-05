// Specification extraction from a maker's product page. Produces a key→value map from the structures makers
// actually publish (spec tables, dt/dd lists, "Key: value" lines, short label/value line pairs) plus the prose of
// the main product region. Nothing here scores anything — parsing/plausibility live in the site schema.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#8211': '–', '#8212': '—', '#8226': '•', '#215': '×', '#176': '°' };
const decode = (s) => String(s).replace(/&(#?\w+);/g, (m, e) => (ENT[e] !== undefined ? ENT[e] : /^#\d+$/.test(e) ? String.fromCodePoint(Number(e.slice(1))) : m));
const clean = (s) => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Storefront chrome that leaks into key/value scraping (cart totals, prices, nav headings) — never a specification.
const CHROME_KEY = /^(?:sub\s*total|total|m\.?r\.?p\.?|price|sale price|regular price|you save|quantity|qty|share|cart|add to cart|buy now|sku|vendor|availability|shipping|delivery|returns?|search|menu|view all.*|(?:other|natural|bath|face|beauty care|breast care|shop) accessories|sign in|login|track order|coupon|offer|discount|current price|discounted price|apply code|compare at price|unit price|tax(?:es)? included|inclusive of all taxes|couldn'?t load pickup availability|pickup availability|check availability|notify me|wishlist|add to wishlist|https?|timing|timings|follow us|regd\.? office|registered office|corporate office|head office|cin|gst(?:in)?|phone|tel|telephone|email|e-mail|address|customer care|toll[-\s]?free|helpline|support|copyright|you are viewing|home|category|categories|tags?|collections?|filter|sort by|newsletter|subscribe)$/i;
const CHROME_VALUE = /^(?:track order|add to cart|buy now|continue shopping|sign in|login|view all|see order and shipping status|decrease quantity|increase quantity|download manual|refresh|notify me)$/i;
// A value that still carries markup ("alt=… title=…>", 'target="_blank">') came from a broken tag, not a spec.
const MARKUP_VALUE = /[<>]|\b(?:alt|title|target|href|src|class)=/i;
const STOP = /you may also like|related products|recently viewed|customer reviews|frequently bought|similar products|recommended for you|people also bought|complete the look/i;

export function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s>][\s\S]*?<\/nav>/gi, ' ');
}

// Text lines of the main product region: from the product's own heading (skips header nav / "most popular"
// carousels that list sibling products) to the first "related products"-style heading.
export function mainLines(html, title) {
  let lines = decode(stripHtml(html).replace(/<(?:br|\/p|\/li|\/tr|\/td|\/th|\/div|\/h\d|\/dt|\/dd|\/span|\/strong|\/b)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const head = (title || '').replace(/\s*[|–].*$/, '').replace(/^buy\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 24);
  let anchored = false;
  if (head.length >= 8) {
    const at = lines.findIndex((l, i) => i > 0 && l.toLowerCase().includes(head));
    if (at > 0) { lines = lines.slice(at); anchored = true; }
  }
  const cut = lines.findIndex((l) => l.length < 60 && STOP.test(l));
  return { lines: cut > 20 ? lines.slice(0, cut) : lines, anchored };
}

// The markup of the product region only: from the product heading in <body> (past header nav, mega-menus and
// "popular" carousels whose tables describe sibling products) to the first related-products heading. A page whose
// heading is not in the served HTML (JS-rendered) or a bare body_html fragment is used whole.
export function mainHtml(html, title) {
  const head = (title || '').replace(/\s*[|–].*$/, '').replace(/^buy\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 24);
  if (head.length < 8) return html;
  const lower = html.toLowerCase();
  const body = Math.max(0, lower.indexOf('<body'));
  const at = lower.indexOf(head, body);
  if (at < 0) return html;
  const start = Math.max(body, lower.lastIndexOf('<', at));
  const stop = lower.slice(start).search(STOP);
  return stop > 2000 ? html.slice(start, start + stop) : html.slice(start);
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
 * @param {string} [title]  product title, used to locate the start of the product region
 * @returns {{ kv: Record<string,string>, text: string, lines: number, anchored: boolean }}
 *   anchored=false means the product heading was not found in the served HTML (JS-rendered page), so `text` is
 *   mostly site chrome and must not be used for prose spec parsing.
 */
export function extractSpecs(html, labels, title) {
  const kv = {};
  const { lines, anchored } = mainLines(html, title);
  tableKv(mainHtml(stripHtml(html), title), kv);
  colonKv(lines, kv);
  pairKv(lines, labels, kv);
  for (const k of Object.keys(kv)) if (CHROME_KEY.test(k) || CHROME_VALUE.test(kv[k]) || MARKUP_VALUE.test(kv[k]) || /[a-z]+:[a-z]/.test(k) || /^(?:https?:|\/\/)/i.test(kv[k])) delete kv[k];
  return { kv, text: lines.join('\n'), lines: lines.length, anchored };
}

export function labelPatterns(site) {
  const set = new Set();
  for (const f of site.fields) for (const l of f.official || [f.label]) set.add(l.toLowerCase());
  return [...set].map((l) => new RegExp(`\\b${l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*')}\\b`, 'i'));
}
