// Section 03: the catalogue as photo tiles. Every item stays visible; the tile
// shows where it lands (Day n), why it can't (off route…), its price and its
// exact photos (swipe strip → lightbox). Filter chips narrow by kind / island.
import { CATALOGUE, REACH, isExtra } from '../data/catalogue.js';
import { PRICES } from '../data/prices.js';
import { itemPhotos, photoSize } from '../data/photos.js';
import { itemReels } from '../data/reels.js';
import { SKIP_REASON } from '../grouping.js';
import { buildPlan } from '../plan.js';
import { fmt } from '../budget.js';
import { html, raw, $, $$ } from '../dom.js';
import { icon } from '../icons.js';

const KINDS = [
  { id: 'all', name: 'All' },
  { id: 'fun', name: 'Fun', ic: 'kayak', test: (c) => c.group === 'experience' && !isExtra(c) },
  { id: 'see', name: 'See', ic: 'camera', test: (c) => c.group === 'landmark' || (c.group === 'experience' && isExtra(c)) },
  { id: 'islands', name: 'Islands', ic: 'island', test: (c) => c.group === 'inhabited' || c.group === 'uninhabited' },
];
const WHERE = ['Agatti', 'Kavaratti', 'Kalpeni', 'Minicoy'];
const filter = { kind: 'all', where: '' };

function priceTag(item) {
  if (!item.key) return isExtra(item) ? 'free' : '';
  const p = PRICES[item.key];
  return p.status === 'unavailable' ? 'quote locally' : fmt(p.amount);
}

function media(item, photos) {
  if (!photos.length) return html`<span class="tile__none" title="No exact photo found">${raw(icon(item.icon))}<small>no exact photo</small></span>`;
  const shots = photos.slice(0, 4).map((p, i) => {
    const { w, h } = photoSize(p);
    return html`<button type="button" class="tile__shot" data-gallery="${item.id}" data-gallery-i="${i}" aria-label="Photo ${i + 1} of ${photos.length}: ${item.name}"><img src="${p.src}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async"></button>`;
  });
  return html`<div class="tile__scroll">${raw(shots.join(''))}</div>
    <button type="button" class="tile__pics" data-gallery="${item.id}" aria-label="All ${photos.length} photos of ${item.name}">${raw(icon('camera'))}${photos.length}</button>`;
}

function reelChip(item) {
  const n = itemReels(item.id).length;
  if (!n) return '';
  return html`<button type="button" class="tile__reel" data-reel="${item.id}" aria-haspopup="dialog" aria-controls="reel">${raw(icon('play'))}${n} clip${n > 1 ? 's' : ''}</button>`;
}

function tile(item) {
  const photos = itemPhotos(item.id);
  const kind = KINDS.find((k) => k.test && k.test(item)).id;
  return html`
    <article class="tile card" data-tile="${item.id}" data-kind="${kind}" data-bases="${item.bases.join(' ')}" data-state="off">
      <div class="tile__media">${raw(media(item, photos))}<span class="tile__day" data-pick-tag></span></div>
      <button type="button" class="tile__toggle" data-pick="${item.id}" aria-pressed="false" title="${item.hint} · ${item.note || REACH[item.reach].hint}">
        <span class="tile__check" aria-hidden="true">${raw(icon('check'))}</span>
        <span class="tile__name">${item.name}<small>${item.hint}</small></span>
        <span class="tile__price">${priceTag(item)}</span>
      </button>
      ${raw(reelChip(item))}
    </article>`;
}

const chip = (group, id, name, ic) => html`<button type="button" class="chip" data-filter="${group}" data-value="${id}" aria-pressed="false">${ic ? raw(icon(ic)) : ''}${name}</button>`;

function applyFilter() {
  const kind = KINDS.find((k) => k.id === filter.kind);
  for (const t of $$('[data-tile]')) {
    const okKind = !kind.test || t.dataset.kind === filter.kind;
    const okWhere = !filter.where || t.dataset.bases.split(' ').includes(filter.where);
    t.hidden = !(okKind && okWhere);
  }
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(filter[b.dataset.filter] === b.dataset.value)));
}

export function mountPicks(store) {
  $('#picks-grid').innerHTML = CATALOGUE.map(tile).join('');
  $('#picks-bar').innerHTML = html`
    <div class="mode-chips" role="group" aria-label="Kind">${raw(KINDS.map((k) => chip('kind', k.id, k.name, k.ic)).join(''))}</div>
    <div class="mode-chips" role="group" aria-label="Island">${raw([chip('where', '', 'Anywhere'), ...WHERE.map((w) => chip('where', w, w))].join(''))}</div>`;
  applyFilter();
  $('#picks').addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter[f.dataset.filter] = f.dataset.value; applyFilter(); return; }
    const btn = e.target.closest('[data-pick]');
    if (!btn) return;
    store.set((s) => ({ picks: { ...s.picks, [btn.dataset.pick]: !s.picks[btn.dataset.pick] } }));
  });
}

// State per item → { on, state: 'day' | 'skip' | 'off', text }
function status(item, plan, picks) {
  const on = Boolean(picks[item.id]);
  const dayIdx = plan.days.findIndex((d) => d.picks.includes(item));
  if (dayIdx >= 0) return { on, state: 'day', text: `Day ${dayIdx + 1}` };
  const skip = plan.skipped.find((s) => s.item === item);
  if (skip) return { on, state: 'skip', text: SKIP_REASON[skip.why] };
  const reach = plan.days.some((d) => item.bases.includes(d.base)) ? REACH[item.reach] : null;
  return { on, state: 'off', text: reach && item.reach !== 'base' ? reach.label : '' };
}

export function renderPicks(state) {
  const plan = buildPlan(state);
  for (const item of CATALOGUE) {
    const t = $(`[data-tile="${item.id}"]`);
    const s = status(item, plan, state.picks);
    $('[data-pick]', t).setAttribute('aria-pressed', String(s.on));
    t.dataset.state = s.state;
    $('[data-pick-tag]', t).textContent = s.text;
  }
  const strolls = plan.placedCount - plan.activityCount;
  $('#picks-note').innerHTML = html`<span class="chip chip-coral">${raw(icon('spark'))}${plan.activityCount} activities</span><span class="chip chip-jade">${raw(icon('walk'))}${strolls} strolls</span>${plan.skipped.length ? raw(html`<span class="chip chip-ghost">${plan.skipped.length} off route</span>`) : ''}`;
}
