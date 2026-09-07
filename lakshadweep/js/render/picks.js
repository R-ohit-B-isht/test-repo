// Section 02a: the catalogue as toggles, grouped, with a live "where it lands"
// badge per item. Nothing is hidden: items the route cannot reach stay visible
// with the reason, so switching route shows what opens up.
import { CATALOGUE, CATALOGUE_GROUPS, REACH } from '../data/catalogue.js';
import { PRICES } from '../data/prices.js';
import { itemPhotos, photoSize } from '../data/photos.js';
import { SKIP_REASON } from '../grouping.js';
import { buildPlan } from '../plan.js';
import { fmt } from '../budget.js';
import { html, raw, $ } from '../dom.js';
import { icon } from '../icons.js';

function priceTag(item) {
  if (!item.key) return '';
  const p = PRICES[item.key];
  return p.status === 'unavailable' ? 'quote locally' : fmt(p.amount);
}

// Leading visual: the first exact photo of the item, or its icon in a dashed
// box when no photo of that exact place/activity exists.
function thumb(item, photos) {
  if (!photos.length) return html`<span class="pick__thumb pick__thumb--none" title="No exact photo found">${raw(icon(item.icon))}</span>`;
  const p = photos[0];
  const { w, h } = photoSize(p);
  return html`<span class="pick__thumb"><img src="${p.src}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async">${raw(icon(item.icon))}</span>`;
}

function pick(item) {
  const photos = itemPhotos(item.id);
  const pics = photos.length
    ? html`<button type="button" class="pick__pics" data-gallery="${item.id}" aria-label="${photos.length} photo${photos.length > 1 ? 's' : ''} of ${item.name}" title="${item.hint}">${raw(icon('camera'))}<span>${photos.length}</span></button>`
    : html`<span class="pick__pics pick__pics--none" title="No exact photo found" aria-hidden="true">${raw(icon('camera'))}<span>–</span></span>`;
  return html`
    <div class="pickrow">
      <button type="button" class="pick" data-pick="${item.id}" aria-pressed="false" title="${item.hint} · ${item.note || REACH[item.reach].hint}">
        ${raw(thumb(item, photos))}
        <span class="pick__name"><span>${item.name}</span><small class="pick__meta"><span class="pick__tag" data-pick-tag></span><span class="pick__price">${priceTag(item)}</span></small></span>
      </button>
      ${raw(pics)}
    </div>`;
}

function group(g) {
  const items = CATALOGUE.filter((c) => c.group === g.id);
  return html`
    <details class="fold picks__group" open data-group="${g.id}">
      <summary class="fold__sum"><span>${g.name} <small class="picks__hint">${g.hint}</small></span><span class="picks__count" data-group-count></span></summary>
      <div class="picks__grid">${raw(items.map(pick).join(''))}</div>
    </details>`;
}

export function mountPicks(store) {
  const root = $('#picks');
  root.innerHTML = CATALOGUE_GROUPS.map(group).join('');
  root.addEventListener('click', (e) => {
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
  const counts = {};
  for (const item of CATALOGUE) {
    const btn = $(`[data-pick="${item.id}"]`);
    const s = status(item, plan, state.picks);
    btn.setAttribute('aria-pressed', String(s.on));
    btn.dataset.state = s.state;
    $('[data-pick-tag]', btn).textContent = s.text;
    if (s.state === 'day') counts[item.group] = (counts[item.group] || 0) + 1;
  }
  for (const g of CATALOGUE_GROUPS) {
    const n = counts[g.id] || 0;
    $(`[data-group="${g.id}"] [data-group-count]`).textContent = n ? `${n} on the plan` : '';
  }
  const skipped = plan.skipped.length;
  $('#picks-note').textContent = `${plan.activityCount} activities + ${plan.placedCount - plan.activityCount} strolls · ${plan.length} days · ≤4 activities a day, strolls ride along` + (skipped ? ` · ${skipped} off route` : '');
}
