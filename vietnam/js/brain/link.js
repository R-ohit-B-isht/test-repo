import { STOPS } from '../data/trip.js';
import { EXTRA_STOPS, catalogOf } from '../data/activities.js';

// "Saw it on Insta": one pasted YouTube / TikTok / Instagram link becomes a
// pick. Three small adapters — oEmbed for the clip's title, Gemini (or a word
// match without a key) to name the place, Wikimedia Commons for real photos of
// it — and `toPick`, which turns the answer into a catalog-shaped activity.
// Only the link, its public title and your caption go to Gemini.

const ALL_STOPS = [...STOPS, ...EXTRA_STOPS];
export const STOP_IDS = ALL_STOPS.map((s) => s.id);
export const STOP_NAME = Object.fromEntries(ALL_STOPS.map((s) => [s.id, s.name]));
export const SLOTS = ['am', 'pm', 'night', 'any', 'day'];

// ---- 1 · the link ------------------------------------------------------------

const YT_ID = /^[\w-]{11}$/;

export function parseLink(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^(www|m)\./, '');
  const url = u.toString();
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
    const m = url.match(/(?:shorts\/|embed\/|youtu\.be\/|[?&]v=)([\w-]{11})/);
    return { provider: 'youtube', url, yt: m && YT_ID.test(m[1]) ? m[1] : '' };
  }
  if (host.endsWith('tiktok.com')) return { provider: 'tiktok', url, yt: '' };
  if (host.endsWith('instagram.com')) return { provider: 'instagram', url, yt: '' };
  return { provider: 'other', url, yt: '' };
}

export const PROVIDER_NAME = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', other: 'the link' };

// oEmbed: YouTube and TikTok answer cross-origin with title + author; Instagram
// has no public endpoint, so its caption has to be pasted by hand.
const OEMBED = {
  youtube: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  tiktok: (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
};

export async function fetchEmbed(link, signal) {
  const mk = OEMBED[link.provider];
  if (!mk) return null;
  const r = await fetch(mk(link.url), { signal });
  if (!r.ok) throw new Error(`${PROVIDER_NAME[link.provider]} did not recognise that link (${r.status})`);
  const d = await r.json();
  return { title: String(d.title || '').trim(), by: String(d.author_name || '').trim() };
}

// ---- 2 · what place is it -----------------------------------------------------

export const LINK_SYSTEM = [
  'You help a visual Vietnam trip planner turn a social clip into one activity pick.',
  'You get the clip\'s LINK, its public TITLE and AUTHOR when known, the CAPTION the traveller pasted, the STOPS of the trip (id = name) and the CATALOG (id | name | stop) of picks that already exist.',
  'If the clip is about a place or activity already in the CATALOG, set match to that id and still fill the other fields. Otherwise match is null.',
  'name = the exact place or activity, short, in English (keep the Vietnamese proper noun). stop = the trip stop it belongs to; pick the nearest one, or an extra stop like sapa / phongnha / catba / haiphong.',
  'slot: am / pm / night / any, or day for a full-day trip. hours: realistic time on site. kind: fun for parks, boats, food crawls, shows, adventure; see for walks, temples, viewpoints, monuments.',
  'inr = conservative entry / activity price per person in Indian rupees, null when it is free. note = one short line: what you do there, the vibe.',
  'search = 2–5 English words to find photos of this exact place on Wikimedia Commons, e.g. "Hai Van Pass Da Nang".',
  'confidence 0–1: how sure you are about the place. If the clip is not about a place in Vietnam at all, set stop to the most plausible one, confidence below 0.3 and say so in note.',
].join(' ');

export const linkSchema = (catalogIds) => ({
  type: 'object',
  properties: {
    match: { type: 'string', enum: catalogIds, nullable: true },
    name: { type: 'string' },
    stop: { type: 'string', enum: STOP_IDS },
    slot: { type: 'string', enum: SLOTS },
    hours: { type: 'number' },
    inr: { type: 'integer', nullable: true },
    kind: { type: 'string', enum: ['fun', 'see'] },
    note: { type: 'string' },
    search: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: ['name', 'stop', 'slot', 'hours', 'kind', 'note', 'search', 'confidence'],
});

export const catalogLines = (state) => catalogOf(state).map((x) => `${x.id} | ${x.name} | ${x.stop}`).join('\n');
export const stopLines = () => ALL_STOPS.map((s) => `${s.id} = ${s.name}`).join(', ');

export const linkPrompt = (link, embed, caption, state) => [
  `LINK: ${link.url} (${PROVIDER_NAME[link.provider]})`,
  embed?.title ? `TITLE: ${embed.title}` : 'TITLE: unknown',
  embed?.by ? `AUTHOR: ${embed.by}` : '',
  caption ? `CAPTION: ${caption.slice(0, 2000)}` : 'CAPTION: none',
  `STOPS: ${stopLines()}`,
  'CATALOG (id | name | stop):',
  catalogLines(state),
].filter(Boolean).join('\n');

// No key: the title/caption words pick the stop and, if a catalog name is in
// there, the match. Everything else is left for the traveller to fill.
const STOP_WORDS = [
  ['hoian', /hoi ?an|h\u1ed9i an/i], ['danang', /da ?nang|\u0111\u00e0 n\u1eb5ng|ba ?na|hai ?van|my ?khe|son ?tra/i], ['hue', /\bhue\b|hu\u1ebf/i],
  ['hanoi', /ha ?noi|h\u00e0 n\u1ed9i/i], ['ninhbinh', /ninh ?binh|tam ?coc|trang ?an|mua cave|hang m\u00faa/i], ['halong', /ha ?long|h\u1ea1 long/i],
  ['sapa', /sa ?pa|fansipan/i], ['phongnha', /phong ?nha|son ?doong|paradise cave/i], ['catba', /cat ?ba|lan ?ha/i], ['haiphong', /hai ?phong|h\u1ea3i ph\u00f2ng/i],
];

const clean = (s) => s.replace(/#\w+/g, '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s*[|\u2013\u2014-]\s*(shorts?|vlog|part \d+|4k|travel|vietnam).*$/i, '').replace(/\s+/g, ' ').trim();

// "Ba Na Hills" in a caption should still find "Sun World Ba Na Hills".
const BRAND = /^(sun world|vinwonders|vinpearl)\s+/i;
const namesOf = (x) => [x.name, x.name.replace(BRAND, '')].map((n) => n.toLowerCase());

// "Driving the Hai Van Pass near Da Nang" → "Hai Van Pass": the longest run of
// capitalised words that is not just the stop's own name.
const NOISE = /^(the|a|an|in|at|to|of|on|and|vietnam(['’]s)?|viet nam|book|klook)$/i;
export function placeIn(text) {
  const runs = [];
  let run = [];
  const end = () => { if (run.length) runs.push(run); run = []; };
  for (const tok of String(text).split(/\s+/)) {
    const w = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}']+$/gu, '');
    if (w && /^\p{Lu}/u.test(w) && !NOISE.test(w)) run.push(w); else end();
    if (/[,.;:!?|()]$/.test(tok)) end();
  }
  end();
  const stops = Object.values(STOP_NAME).map((n) => n.toLowerCase());
  return runs.map((r) => r.join(' ')).filter((r) => r.split(' ').length > 1 && !stops.includes(r.toLowerCase())).sort((a, b) => b.length - a.length)[0] || '';
}

export function quickGuess(link, embed, caption, state) {
  const text = [embed?.title, caption].filter(Boolean).join(' · ');
  const low = text.toLowerCase();
  const match = catalogOf(state).find((x) => namesOf(x).some((n) => low.includes(n)))?.id || null;
  const stop = STOP_WORDS.find(([, re]) => re.test(text))?.[0] || '';
  const name = clean(embed?.title || caption.split(/[.\n]/)[0] || '').slice(0, 60);
  const place = placeIn(text);
  return { match, name, stop, slot: 'any', hours: 2, inr: null, kind: 'fun', note: '', search: place || [name, STOP_NAME[stop]].filter(Boolean).join(' '), confidence: (place ? 0.15 : 0) + (match ? 0.5 : 0) + (stop ? 0.2 : 0) + (name ? 0.1 : 0) };
}

export const toGuess = (r, state) => ({
  match: catalogOf(state).some((x) => x.id === r.match) ? r.match : null,
  name: String(r.name || '').trim().slice(0, 80),
  stop: STOP_IDS.includes(r.stop) ? r.stop : '',
  slot: SLOTS.includes(r.slot) ? r.slot : 'any',
  hours: Math.min(12, Math.max(0.5, Number(r.hours) || 2)),
  inr: r.inr == null || Number(r.inr) <= 0 ? null : Math.min(50000, Math.round(Number(r.inr))),
  kind: r.kind === 'see' ? 'see' : 'fun',
  note: String(r.note || '').trim().slice(0, 120),
  search: String(r.search || r.name || '').trim().slice(0, 80),
  confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0)),
});

// ---- 3 · photos of the exact place ---------------------------------------------

const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const untag = (s) => String(s || '').replace(/<[^>]+>/g, '').trim();
const SKIP = /\b(map|logo|flag|coat of arms|diagram|icon|svg|locator)\b/i;

export async function findPics(query, signal, n = 3) {
  if (!query) return [];
  const q = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '8',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1280',
    iiextmetadatafilter: 'Artist|LicenseShortName',
  });
  const r = await fetch(`${COMMONS}?${q}`, { signal });
  if (!r.ok) throw new Error(`Wikimedia Commons is not answering (${r.status})`);
  const d = await r.json();
  const pages = Object.values(d.query?.pages || {}).sort((a, b) => a.index - b.index);
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || SKIP.test(p.title) || ii.width < 800 || ii.height < 500 || ii.height > ii.width * 1.6) continue;
    const em = ii.extmetadata || {};
    out.push({
      u: String(ii.thumburl).replace('//thumb.wikimedia.org/', '//upload.wikimedia.org/'),
      w: ii.thumbwidth, h: ii.thumbheight,
      alt: p.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
      by: untag(em.Artist?.value) || 'Wikimedia Commons', lic: untag(em.LicenseShortName?.value) || 'see page', page: ii.descriptionurl,
    });
    if (out.length >= n) break;
  }
  return out;
}

// Full query first, then just the place words, then the place + stop.
export async function picsFor(g, signal) {
  const tries = [...new Set([g.search, placeIn(g.name), [placeIn(g.name) || g.name, STOP_NAME[g.stop]].filter(Boolean).join(' ')].filter(Boolean))];
  for (const q of tries) {
    const pics = await findPics(q, signal);
    if (pics.length || signal?.aborted) return pics;
  }
  return [];
}

// ---- 4 · the pick ----------------------------------------------------------------

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32);

export const toPick = (g, link, embed, pics) => ({
  id: `ai-${slug(g.name)}`,
  stop: g.stop,
  slot: g.slot,
  h: g.hours,
  name: g.name,
  icon: 'sparkle',
  kind: g.kind,
  inr: g.inr == null ? 0 : g.inr,
  free: g.inr == null,
  est: true,
  note: g.note || `saved from ${PROVIDER_NAME[link.provider]}`,
  link: link.url,
  ...(link.yt ? { yt: link.yt, by: embed?.by || '', clip: embed?.title || '' } : {}),
  ...(pics.length ? { pics } : {}),
});
