import { html } from '../dom.js';
import { icon } from '../icons.js';
import { SLOT_LABEL } from '../data/days.js';
import { picsOf, sized } from './gallery.js';
import { pinOf } from '../data/geo.js';
import { movableOf } from '../plan.js';
import { slotOf, hopOf, routeMinutes, swapped, shortest } from '../route.js';

// Order strip in the day board (Wanderlog's drag list): the day's movable
// picks in sequence with the estimated hop between each pair, a grab handle,
// up / down buttons, a "shortest route" button when another feasible order
// beats the current one, and "auto" to hand the day back to the packer.
// Markup only; orderDrag.js handles the input.

const hop = (d, a, b) => {
  const h = hopOf(d, a, b);
  if (h.kind === 'transit') return html`<li class="ohop is-transit"><span class="oline"></span>${icon('train')}<span>${h.label}</span></li>`;
  if (h.kind === 'est') return html`<li class="ohop" aria-label="${h.km} km, about ${h.min} minutes"><span class="oline"></span>${icon('walk')}<span class="num">${h.km} km · ~${h.min} min</span></li>`;
  return html`<li class="ohop is-unknown"><span class="oline"></span>${icon('walk')}<span>no pin · flat ${h.min} min</span></li>`;
};

const item = (d, items, x, i) => {
  const im = picsOf(x.id)[0];
  const up = swapped(d, items, i, -1);
  const down = swapped(d, items, i, 1);
  return html`
    <li class="oitem" data-oid="${x.id}" data-idx="${i}">
      <button class="ohandle" type="button" aria-label="Drag to move ${x.name}" title="Drag">${icon('dots')}</button>
      <span class="onum num">${i + 1}</span>
      ${im ? html`<img class="othumb" src="${sized(im.u, 250)}" alt="" width="56" height="56" loading="lazy" decoding="async" />` : html`<span class="othumb is-blank">${icon('pin')}</span>`}
      <span class="otxt"><b>${x.name}</b><small>${SLOT_LABEL[slotOf(d, x)]}${x.at ? ` · from ${x.at}` : ''} · ${x.h} h${pinOf(x) ? '' : ' · no pin'}</small></span>
      <span class="omove">
        <button class="btn-icon" type="button" data-omove="-1" ${up ? '' : 'disabled'} aria-label="Move ${x.name} up">↑</button>
        <button class="btn-icon" type="button" data-omove="1" ${down ? '' : 'disabled'} aria-label="Move ${x.name} down">↓</button>
      </span>
    </li>`;
};

export const orderStrip = (planned, state) => {
  const items = movableOf(planned);
  if (items.length < 2) return '';
  const total = routeMinutes(planned, items);
  const { saves } = shortest(planned, items);
  const custom = planned.custom && !!state.order?.[planned.n]?.length;
  const hops = items.length - 1;
  const road = total ? ` · ~${total} min` : ' · by train / flight';
  return html`
    <section class="bsec bsec-order" aria-label="Order of the day">
      <h4 class="bh"><span class="ic-wrap">${icon('arrow')}</span>Order<span class="chip num">${hops} hop${hops > 1 ? 's' : ''}${road}</span>${custom ? html`<span class="chip chip-lantern">yours</span>` : ''}</h4>
      <ol class="olist" data-oday="${planned.n}">
        ${items.flatMap((x, i) => [item(planned, items, x, i), i < items.length - 1 ? hop(planned, x, items[i + 1]) : ''])}
      </ol>
      <div class="row orow">
        ${saves >= 5 ? html`<button class="btn btn-sm" type="button" data-oshort="${planned.n}">${icon('sparkle')}Shortest route · saves ~${saves} min</button>` : html`<span class="sub">${icon('check')} already the shortest road order</span>`}
        ${custom ? html`<button class="btn btn-sm" type="button" data-oreset="${planned.n}">${icon('undo')}Auto</button>` : ''}
      </div>
      <p class="sub onote">Hops are straight-line estimates, not Grab quotes. Drag the handle or use the arrows.</p>
    </section>`;
};
