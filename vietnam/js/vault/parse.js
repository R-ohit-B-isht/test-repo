import { fmtDate } from '../export/dates.js';

// Paste a confirmation (airline / train / hostel / Klook email, SMS, a PDF's
// text) → which Manager slot it belongs to, the PNR, dates and the amount.
// Two readers behind one shape: Gemini (structured JSON against the live slot
// list) or a regex pass when there is no key. Both return a `Fill`; the
// Manager shows it for review and `patchOf` turns it into the record patch.

export const KINDS = ['flight', 'train', 'bus', 'cruise', 'stay', 'ticket', 'visa', 'insurance', 'esim', 'other'];

export const slotLines = (slots) => slots.map((s) => [s.id, s.title, s.group, s.when || '', s.till || '', s.dateLabel || '', s.hint || ''].join(' | ')).join('\n');

export const PARSE_SYSTEM = [
  'You read travel booking confirmations for a Vietnam trip planner and return one JSON record.',
  'You get the list of Manager SLOTS (id | title | group | date | till | dateField | hint) and the pasted TEXT of one confirmation, email, SMS or PDF.',
  'Pick the ONE slot id the text is about, matching on route, city, hostel name or dates. If nothing fits, set slot to null.',
  'ref = the booking reference / PNR / confirmation number, exactly as written. Prefer the airline PNR over the agency order number.',
  'date = the travel / check-in / valid-from date as YYYY-MM-DD (or the date the slot\'s dateField names, e.g. Expires); till = check-out or valid-to date when present. Do not invent dates.',
  'amount = the total paid as a number and its currency code (INR, VND, USD, MYR, THB…). If several, the grand total.',
  'names = passenger / guest names as written. note = one short line with what matters at the gate: time, seat, terminal, pickup point.',
  'confidence 0–1: how sure you are the slot and ref are right. Never guess a ref; leave it empty if not present.',
].join(' ');

export const parseSchema = (slotIds) => ({
  type: 'object',
  properties: {
    kind: { type: 'string', enum: KINDS },
    slot: { type: 'string', enum: slotIds, nullable: true },
    ref: { type: 'string' },
    date: { type: 'string', nullable: true },
    till: { type: 'string', nullable: true },
    amount: { type: 'number', nullable: true },
    currency: { type: 'string', nullable: true },
    names: { type: 'array', items: { type: 'string' } },
    note: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: ['kind', 'ref', 'names', 'note', 'confidence'],
});

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const cleanIso = (s) => (typeof s === 'string' && ISO.test(s) ? s : '');

// Normalise whatever came back into the one shape the UI renders.
export const toFill = (r, slots, via) => ({
  via,
  kind: KINDS.includes(r.kind) ? r.kind : 'other',
  slot: slots.some((s) => s.id === r.slot) ? r.slot : '',
  ref: String(r.ref || '').trim().slice(0, 40),
  date: cleanIso(r.date),
  till: cleanIso(r.till),
  amount: Number.isFinite(r.amount) && r.amount > 0 ? Math.round(r.amount) : null,
  currency: (r.currency || '').toUpperCase().slice(0, 3),
  names: (r.names || []).map((n) => String(n).trim()).filter(Boolean).slice(0, 6),
  note: String(r.note || '').trim().slice(0, 160),
  confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0)),
});

// ---- Regex reader (no key) -------------------------------------------------

const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12' };
const p2 = (n) => String(n).padStart(2, '0');

// "24 Oct 2026", "Oct 24, 2026", "24/10/2026", "2026-10-24"
const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[\s/-]([A-Za-z]{3,4})[a-z]*[\s,/-]+(\d{4})\b|\b([A-Za-z]{3,4})[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b|\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

export const datesIn = (text) => {
  const out = [];
  for (const m of text.matchAll(DATE_RE)) {
    let iso = '';
    if (m[1]) iso = `${m[1]}-${m[2]}-${m[3]}`;
    else if (m[4] && MONTHS[m[5].toLowerCase()]) iso = `${m[6]}-${MONTHS[m[5].toLowerCase()]}-${p2(m[4])}`;
    else if (m[7] && MONTHS[m[7].toLowerCase()]) iso = `${m[9]}-${MONTHS[m[7].toLowerCase()]}-${p2(m[8])}`;
    else if (m[10]) iso = `${m[12]}-${p2(m[11])}-${p2(m[10])}`;
    if (iso && !out.includes(iso)) out.push(iso);
  }
  return out.sort();
};

const REF_RE = /(?:PNR|booking\s*(?:ref(?:erence)?|no\.?|number|id|code)|confirmation\s*(?:no\.?|number|code)|reservation\s*(?:no\.?|number|code)|order\s*(?:no\.?|number|id)|(?:registration|application|voucher)\s*(?:no\.?|number|code)|record\s*locator|e-?ticket\s*(?:no\.?|number)|reference)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{4,15})/i;
const PNR_RE = /\b(?=[A-Z0-9]{6}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]{6}\b/;

export const refIn = (text) => {
  const m = text.match(REF_RE);
  if (m) return m[1].toUpperCase();
  const p = text.match(PNR_RE);
  return p ? p[0] : '';
};

const CUR = { '₹': 'INR', rs: 'INR', inr: 'INR', '₫': 'VND', vnd: 'VND', đ: 'VND', $: 'USD', usd: 'USD', us$: 'USD', rm: 'MYR', myr: 'MYR', '฿': 'THB', thb: 'THB' };
const AMT_RE = /(₹|₫|đ|\$|us\$|rs\.?|inr|vnd|usd|rm|myr|฿|thb)\s?([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s?(₹|₫|đ|inr|vnd|usd|myr|thb)/gi;

// The amount next to "total" / "paid" wins; otherwise the biggest figure.
export const amountIn = (text) => {
  const found = [];
  for (const m of text.matchAll(AMT_RE)) {
    const cur = CUR[(m[1] || m[4]).toLowerCase()];
    const n = Number((m[2] || m[3]).replace(/,/g, ''));
    if (!cur || !Number.isFinite(n) || n <= 0) continue;
    const lead = text.slice(Math.max(0, m.index - 24), m.index);
    found.push({ amount: n, currency: cur, total: /total|paid|charged|grand/i.test(lead) });
  }
  const pool = found.some((f) => f.total) ? found.filter((f) => f.total) : found;
  return pool.sort((a, b) => b.amount - a.amount)[0] || null;
};

const KIND_WORDS = [
  ['flight', /\b(flight|airline|airasia|vietjet|indigo|boarding|departure|arrival|terminal)\b/i],
  ['train', /\b(train|sleeper|berth|coach|railway|dsvn|baolau|12go)\b/i],
  ['bus', /\b(bus|limousine|vexere|futa)\b/i],
  ['cruise', /\b(cruise|cabin|junk|ha ?long|lan ha)\b/i],
  ['stay', /\b(hostel|hotel|homestay|check-?in|check-?out|dorm|room|guest|hostelworld|booking\.com|agoda)\b/i],
  ['visa', /\b(e-?visa|immigration|entry permit)\b/i],
  ['insurance', /\b(insurance|policy|cover)\b/i],
  ['esim', /\b(e-?sim|data plan|airalo|viettel)\b/i],
  ['ticket', /\b(ticket|admission|klook|getyourguide|tour|voucher)\b/i],
];
// Most distinct hits wins, so a hostel email that mentions "arrival" stays a stay.
export const kindIn = (text) => {
  const scored = KIND_WORDS.map(([k, re]) => [k, new Set([...text.matchAll(new RegExp(re.source, 'gi'))].map((m) => m[0].toLowerCase())).size]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return scored[0]?.[0] || 'other';
};

const KIND_GROUP = { flight: 'fly', train: 'ride', bus: 'ride', cruise: 'play', stay: 'sleep', ticket: 'play', visa: 'papers', insurance: 'papers', esim: 'stuff' };
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);

// Best slot: same group, then most title words found in the text, then a date hit.
export const guessSlot = (text, slots, kind, dates) => {
  const low = text.toLowerCase();
  const scored = slots.map((s) => {
    let n = 0;
    if (KIND_GROUP[kind] === s.group) n += 2;
    if (s.id === kind) n += 3;
    n += words(s.title).filter((w) => low.includes(w)).length * 2;
    if (s.when && dates.includes(s.when)) n += 2;
    return [n, s.id];
  }).filter(([n]) => n >= 3).sort((a, b) => b[0] - a[0]);
  return scored[0]?.[1] || '';
};

// Only things with a span get a `till`; a flight's second date is its arrival.
const SPANS = new Set(['stay', 'cruise', 'visa', 'insurance', 'esim']);

export function quickParse(text, slots) {
  const dates = datesIn(text);
  const kind = kindIn(text);
  const money = amountIn(text);
  const ref = refIn(text);
  const slot = guessSlot(text, slots, kind, dates);
  const sure = (slot ? 0.3 : 0) + (ref ? 0.25 : 0) + (dates.length ? 0.15 : 0) + (money ? 0.1 : 0);
  return toFill({ kind, slot, ref, date: dates[0], till: SPANS.has(kind) ? dates[1] : '', amount: money?.amount, currency: money?.currency, names: [], note: '', confidence: sure }, slots, 'regex');
}

// ---- Result → record patch --------------------------------------------------

export const fmtAmount = (f) => (f.amount == null ? '' : `${f.currency === 'INR' ? '₹' : f.currency === 'VND' ? '₫' : `${f.currency} `}${f.amount.toLocaleString(f.currency === 'INR' ? 'en-IN' : 'en-US')}`);

// Slots without a date field (flights, beds — their date is fixed by the plan)
// keep the read date in the note instead, so nothing is lost.
export const patchOf = (fill, slot, rec) => {
  const hasDate = !!slot.dateLabel;
  const span = fill.date ? `${fmtDate(fill.date)}${fill.till ? ` → ${fmtDate(fill.till)}` : ''}` : '';
  const bits = [
    fill.note,
    fill.names.length ? fill.names.join(', ') : '',
    fmtAmount(fill) ? `paid ${fmtAmount(fill)}` : '',
    span && (!hasDate || fill.till) ? (hasDate ? `till ${fmtDate(fill.till)}` : span) : '',
  ].filter(Boolean);
  const note = [rec.note, bits.join(' · ')].filter(Boolean).join('\n');
  return {
    ...(fill.ref ? { ref: fill.ref } : {}),
    ...(hasDate && fill.date ? { date: fill.date } : {}),
    ...(bits.length ? { note } : {}),
    status: rec.status === 'done' ? 'done' : 'mid',
  };
};
