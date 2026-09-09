import { $, html } from './dom.js';
import { IS_DEV } from './config.js';
import { STRATEGIES } from './strategies.js';
import { computeBudget } from './budget.js';
import { CHECKLIST } from './data/checklist.js';
import { ACTIVITIES, DEFAULT_PICKS } from './data/activities.js';
import { isoOf } from './data/trip.js';
import { cyclePin, today } from './clock.js';
import { shiftISO } from './ritual.js';
import { MICRO } from './data/ritual.js';
import { devTrail } from './trail/replay.js';

// Developer bar (Command pattern: each button is a named action on the store).
// Opens with ?dev=1, localStorage.IS_DEV='true', or the D key.

// Paste fixtures for the Manager reader. Shaped like real confirmations so the
// regex and Gemini paths get exercised; the refs are made up and never saved
// unless you tap Fill.
const LINKS = {
  'YT match': { url: 'https://www.youtube.com/watch?v=3B3EtAQNVdk' },           // "Sun World Ba Na Hills" in the title → catalog match
  'YT new': { url: 'https://youtu.be/69WMflA3410' },                             // Hai Van Pass → not in the catalog → new pick
  'TikTok': { url: 'https://www.tiktok.com/@makisantos_/video/7652011912963624213' },
  'IG no caption': { url: 'https://www.instagram.com/explore/tags/haivanpass/' }, // Instagram gives nothing → asks for the caption
  'IG + caption': { url: 'https://www.instagram.com/explore/tags/haivanpass/', caption: 'Hai Van Pass by scooter from Da Nang, stop at the old French bunkers' },
  'YT broken': { url: 'https://www.youtube.com/watch?v=zzzzzzzzzzz' },           // oEmbed 400 → error state
  'not a link': { url: 'ba na hills' },
  'other site': { url: 'https://www.klook.com/activity/1234-ba-na-hills/' },
};

const PASTE_FLIGHT = `AirAsia X — Booking confirmed
Booking number: D7K2QZ
Passenger: ROHIT B
D7 183 Delhi (DEL) T3 → Kuala Lumpur (KUL) T2  Fri 23 Oct 2026 23:20 → 07:35
AK 1512 Kuala Lumpur (KUL) → Da Nang (DAD)  Sat 24 Oct 2026 09:10 → 10:50
Cabin baggage 7 kg. No checked baggage.
Total paid: INR 14,072.00 (Visa ending 4421)`;

const PASTE_HOSTEL = `Hostelworld — your booking is confirmed!
Booking reference: 3421-88710
SacLo Villa & Hostel, Hoi An
Check-in Sat, 24 Oct 2026 (from 14:00) · Check-out Mon, 26 Oct 2026 · 2 nights
1 bed in 8-Bed Mixed Dorm, free cancellation until 21 Oct
Deposit paid ₹ 340 · Pay on arrival ₫ 400,000`;

const PRESETS = {
  'Solo shoestring': { travellers: 1, strategy: 'bus', bed: 500, food: 600, local: 150, buffer: 5, berth: '6' },
  'Couple, comfy': { travellers: 2, strategy: 'train', bed: 1400, food: 1200, local: 400, buffer: 10, berth: '4' },
  'Four, fast': { travellers: 4, strategy: 'fly', bed: 1000, food: 1000, local: 300, buffer: 10 },
};

export function mountDev(store) {
  const bar = $('#devbar');
  let open = IS_DEV;
  const allChecks = (on) => Object.fromEntries(CHECKLIST.map((c) => [c.id, on]));

  // Dev-only Split ledger so the page can be exercised without typing: three
  // people named as test rows, one row per trip day, all currency / split modes.
  const devLedger = () => {
    const now = Date.now();
    const ids = ['p-dev-me', 'p-dev-a', 'p-dev-b'];
    const people = [['Test me', 20, true], ['Test A', 140, false], ['Test B', 260, false]]
      .map(([name, hue, me], i) => ({ id: ids[i], name, hue, me, created: now }));
    const all = Object.fromEntries(ids.map((id) => [id, 1]));
    const row = (n, title, cat, inr, by, split, extra = {}) => ({
      id: `x-dev-${n}-${cat}`, kind: 'spend', iso: isoOf(n), title, cat, amount: inr, cur: 'INR', inr, by, split, note: '', receipt: null, created: now, updated: now, ...extra,
    });
    const expenses = [
      row(1, 'Test hostel', 'stay', 2550, ids[0], { mode: 'equal', parts: all }),
      row(1, 'Test dinner', 'food', 900, ids[1], { mode: 'equal', parts: all }),
      row(2, 'Test tickets', 'fun', 3300, ids[2], { mode: 'shares', parts: { [ids[0]]: 2, [ids[1]]: 1, [ids[2]]: 1 } }),
      row(3, 'Test Grab', 'ride', 415, ids[0], { mode: 'exact', parts: { [ids[0]]: 200, [ids[2]]: 215 } }),
      { ...row(4, 'Test night out', 'night', 1087, ids[1], { mode: 'equal', parts: all }), amount: 300000, cur: 'VND' },
      { ...row(5, 'Test paid back', 'other', 500, ids[2], { mode: 'equal', parts: {} }), kind: 'settle', to: ids[0] },
    ];
    const cash = [
      { id: 'c-dev-1', iso: isoOf(1), vnd: 3000000, inr: 11000, fee: 200, atm: 'Test ATM, Hoi An', created: now },
      { id: 'c-dev-2', iso: isoOf(4), vnd: 2000000, inr: 7350, fee: 0, atm: 'Test ATM, Hue', created: now },
    ];
    return { me: ids[0], people, expenses, cash };
  };

  const ACTIONS = {
    'Cycle route': () => store.set((s) => ({ strategy: STRATEGIES[(STRATEGIES.findIndex((x) => x.id === s.strategy) + 1) % STRATEGIES.length].id })),
    'All picks': () => store.setPicks(Object.fromEntries(ACTIVITIES.map((x) => [x.id, true]))),
    'No picks': () => store.setPicks(Object.fromEntries(ACTIVITIES.map((x) => [x.id, false]))),
    'Default picks': () => store.setPicks({ ...DEFAULT_PICKS }),
    'Parks + cruise': () => store.setPicks(Object.fromEntries(ACTIVITIES.filter((x) => x.tag === 'park' || x.id === 'halongOvernight').map((x) => [x.id, true]))),
    'Night owl': () => store.setPicks(Object.fromEntries(ACTIVITIES.filter((x) => x.tag === 'night' || x.must).map((x) => [x.id, true]))),
    'Brain: cheaper': () => document.dispatchEvent(new CustomEvent('brain:open', { detail: { prompt: 'Make the whole trip cheaper without touching flights.' } })),
    'Drop Gemini spots': () => store.set((s) => ({ custom: [], picks: Object.fromEntries(Object.entries(s.picks).filter(([k]) => !k.startsWith('ai-'))) })),
    'Tick all': () => store.set({ checklist: allChecks(true) }),
    'Untick all': () => store.set({ checklist: {} }),
    'Split: test ledger': () => store.set(devLedger()),
    'Split: clear': () => store.set({ me: null, people: [], expenses: [], cash: [], rate: 0, fxLive: null, hearts: {} }),
    // Test voters (from the test ledger's people) hearting a spread of picks so the
    // votes card, conflicts and Gemini resolve can be exercised without friends.
    'Votes: test hearts': () => {
      const s = store.get();
      const base = s.people.filter((p) => !p.deleted).length >= 3 ? {} : devLedger();
      const ppl = (base.people || s.people).filter((p) => !p.deleted).map((p) => p.id);
      const on = ACTIVITIES.filter((x) => !x.closed && s.picks[x.id]).map((x) => x.id);
      const off = ACTIVITIES.filter((x) => !x.closed && !s.picks[x.id] && (x.vnd || x.usd)).map((x) => x.id);
      const hearts = {};
      const add = (id, pid) => { hearts[id] = { ...(hearts[id] || {}), [pid]: true }; };
      on.slice(0, 4).forEach((id) => ppl.forEach((pid) => add(id, pid)));
      off.slice(0, 2).forEach((id) => ppl.slice(1).forEach((pid) => add(id, pid)));
      store.set({ ...base, hearts });
    },
    'Votes: clear': () => store.set({ hearts: {} }),
    // Ritual fixtures: a live 5-day streak ending today (on the pinned clock), or
    // everything ticked so the T-1 "ready" moment can be seen without waiting.
    'Ritual: streak 5': () => store.set((s) => ({ ritual: { ...s.ritual, dates: Array.from({ length: 5 }, (_, i) => shiftISO(today(), -i)) } })),
    'Ritual: all done': () => store.set({
      checklist: Object.fromEntries(CHECKLIST.map((c) => [c.id, true])),
      ritual: { dates: Array.from({ length: 5 }, (_, i) => shiftISO(today(), -i)), done: MICRO.map((m) => m.id) },
    }),
    'Ritual: clear': () => store.set({ ritual: { dates: [], done: [] } }),
    // Deterministic paste fixtures for the Manager reader (dev only, never stored).
    'Paste: flight': () => document.dispatchEvent(new CustomEvent('paste:read', { detail: PASTE_FLIGHT })),
    'Paste: hostel': () => document.dispatchEvent(new CustomEvent('paste:read', { detail: PASTE_HOSTEL })),
    'Paste: junk': () => document.dispatchEvent(new CustomEvent('paste:read', { detail: 'hey are we still on for saturday? bring the cable' })),
    // Link fixtures for the picker's "Saw it on Insta?" reader: real public clips,
    // read live through the same oEmbed / Commons calls (dev only, nothing stored).
    ...Object.fromEntries(Object.entries(LINKS).map(([k, detail]) => [`Link: ${k}`, () => document.dispatchEvent(new CustomEvent('link:read', { detail }))])),
    // Synthetic GPS trail along the planned route (two pins a day) so the map
    // overlay and the replay can be seen without being in Vietnam. Dev only.
    'Trail: demo pins': () => store.set({ trail: devTrail() }),
    'Trail: clear': () => store.set({ trail: [] }),
    'Clock: cycle': () => { const l = cyclePin(); $('[data-act="Clock: cycle"]', bar).textContent = `Clock: ${l}`; store.set({}); },
    'Fares: clear logs': () => store.set({ fares: {} }),
    'Dump budget': () => { $('pre', bar).hidden = !$('pre', bar).hidden; },
    Reset: () => store.reset(),
    ...Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, () => store.set(v)])),
  };

  bar.innerHTML = html`
    <span class="eyebrow">dev</span>
    ${Object.keys(ACTIONS).map((k) => html`<button type="button" data-act="${k}">${k}</button>`)}
    <pre hidden></pre>`;
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) ACTIONS[b.dataset.act](); });

  const paint = () => { bar.dataset.open = String(open); localStorage.setItem('IS_DEV', String(open)); };
  store.subscribe((s) => {
    const b = computeBudget(s);
    const placed = Object.fromEntries(b.plan.placed);
    $('pre', bar).textContent = JSON.stringify({ state: s, total: b.total, group: b.group, lines: Object.fromEntries(b.lines.map((l) => [l.id, l.amount])), placed, noRoom: b.plan.noRoom }, null, 1);
  });
  paint();
  return () => { open = !open; paint(); };
}
