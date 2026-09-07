import { html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { BY_ID, activityInr, isFun } from '../data/activities.js';
import { SOURCES } from '../data/sources.js';

// Shared bits for one activity: its price tag, its source link, a toggle chip.
// Used by the day cards (Do / Nearby rows) and by the picker grid.

export const priceTag = (x, travellers) => {
  if (x.closed) return html`<span class="tag tag-off">closed</span>`;
  const amt = activityInr(x, travellers);
  if (amt == null) return html`<span class="tag tag-free">${x.free ? 'free' : 'in tour'}</span>`;
  const title = [x.range, x.per === 'group' ? `split ${travellers} ways` : '', x.food ? 'comes out of the food dial' : ''].filter(Boolean).join(' · ');
  return html`<span class="tag ${x.food ? 'tag-food' : ''}" title="${title}">${inr(amt)}${x.per === 'group' ? '/pp' : ''}</span>`;
};

export const srcIcon = (x) => {
  const s = x.src && SOURCES[x.src];
  return s ? html`<a class="src" href="${s.url}" target="_blank" rel="noopener" aria-label="Source: ${s.name}" title="${s.name}">${icon('link')}</a>` : '';
};

export const includesText = (x) => (x.includes || []).map((id) => BY_ID[id]?.name).filter(Boolean).join(' · ');

// ★ on must-dos — pre-ticked and packed first, still one tap to drop.
export const mustMark = (x) => (x.must ? icon('star', 'must') : '');

// One toggle chip. `status`: 'on' | 'off' | 'noroom' | 'closed' | 'bundled'.
// data-pick carries the id; the section listener flips it in the store.
export const pickChip = (x, status, travellers, dayN) => {
  if (status === 'closed') return html`<span class="chip pick is-closed" title="${x.closed}">${icon(x.icon)}<s>${x.name}</s></span>`;
  if (status === 'bundled') return html`<span class="chip pick is-bundled" title="covered by a tour you switched on">${icon(x.icon)}${x.name}<span class="tag tag-free">in tour</span></span>`;
  const on = status === 'on' || status === 'noroom';
  const hint = status === 'noroom' ? 'on, but no room on these days — take something off' : x.note || '';
  return html`
    <button class="chip pick ${status === 'noroom' ? 'is-noroom' : ''} ${on ? 'is-on' : ''} ${isFun(x) ? '' : 'is-see'}" type="button" data-pick="${x.id}" aria-pressed="${String(on)}" title="${hint}">
      ${icon(on ? 'check' : x.icon)}<span class="nm">${x.name}</span>${mustMark(x)}
      ${dayN ? html`<span class="d num">D${dayN}</span>` : ''}
      ${priceTag(x, travellers)}
    </button>`;
};
