import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { SLOT_LABEL } from '../../data/days.js';
import { WEATHER } from '../../data/trip.js';
import { SOURCES } from '../../data/sources.js';
import { picsFor, sized } from '../gallery.js';

// One day as a magazine spread: full-bleed hero with the folio number, then
// Do (fun picks by slot, "also see" as a footnote) beside Eat / Sleep.

const MEAL = ['Breakfast', 'Lunch', 'Dinner'];

export const srcLink = (key) => {
  const s = key && SOURCES[key];
  return s ? html`<a class="mg-src" href="${s.url}" target="_blank" rel="noopener" aria-label="Source: ${s.name}">${icon('link')}</a>` : '';
};

const thumb = (x) => {
  const im = picsFor(x)[0];
  return im
    ? html`<img src="${sized(im.u, 500)}" alt="" width="500" height="${Math.round((500 * im.h) / im.w)}" loading="lazy" decoding="async" title="${im.by} · ${im.lic}" />`
    : html`<span class="mg-ph">${icon(x.icon)}</span>`;
};

const price = (x) => (x.inr == null ? (x.free ? 'free' : 'in tour') : `${x.est ? '≈' : ''}${inr(x.inr)}`);

const doItem = (x) => html`
  <li class="mg-do ${x.cont ? 'is-cont' : ''}">
    ${x.cont ? '' : thumb(x.pic)}
    <span class="txt">
      <b>${x.cont ? icon(x.icon) : ''}${x.name}${x.must ? icon('star', 'must') : ''}</b>
      ${x.hint ? html`<span class="sub">${x.hint}</span>` : ''}
    </span>
    ${x.cont ? '' : html`<span class="amt num">${price(x)}</span>`}
  </li>`;

const slotBlock = (s) => html`
  <div class="mg-slot">
    <span class="lbl">${SLOT_LABEL[s.k]}</span>
    ${s.fixed
      ? html`<p class="mg-fixed">${icon(s.icon)}<span>${s.text}</span></p>`
      : html`${s.lead ? html`<p class="mg-lead">${s.lead}</p>` : ''}${s.items.length ? html`<ul class="mg-dos">${s.items.map(doItem)}</ul>` : html`<p class="mg-open">open</p>`}`}
  </div>`;

const meal = (m) => html`
  <li>
    <span class="lbl">${MEAL[m.i]}</span>
    <b>${m.name}</b>
    <span class="sub">${m.dish}</span>
    <span class="amt num">${m.inr != null ? `≈${inr(m.inr)}` : m.src ? 'incl.' : '—'}${srcLink(m.src)}</span>
  </li>`;

const sleep = (s) => html`
  <p class="mg-sleep">
    ${icon('bed')}
    <span><b>${s.name}</b><span class="sub">${s.area}</span></span>
    <span class="amt num">${s.inr != null ? `≈${inr(s.inr)}` : ''}${srcLink(s.src)}</span>
  </p>`;

export const spread = (d) => {
  const wx = WEATHER[d.weather];
  return html`
    <article class="mg-spread" id="day-${d.n}" aria-labelledby="mg-d${d.n}">
      <div class="mg-photo">
        <img src="${d.photo.src}" alt="${d.photo.alt}" width="${d.photo.w}" height="${d.photo.h}" style="object-position: ${d.photo.pos || '50% 50%'}" loading="lazy" decoding="async" />
        <span class="mg-n num" aria-hidden="true">${String(d.n).padStart(2, '0')}</span>
      </div>
      <div class="mg-body wrap">
        <header class="mg-head">
          <span class="eyebrow">Day ${d.n} · ${d.date} · ${d.where}</span>
          <h2 id="mg-d${d.n}">${d.title}</h2>
          <span class="chip ${wx.icon === 'sun' ? 'chip-sun' : 'chip-rain'}">${icon(wx.icon)} ${wx.temp} · ${wx.rain}</span>
        </header>
        <div class="mg-cols">
          <section class="mg-col" aria-label="Do">
            <h3 class="mg-h">Do${d.count ? html` <span class="num">· ${d.count}</span>` : ''}</h3>
            ${d.slots.map(slotBlock)}
            ${d.see.length ? html`<p class="mg-see">${icon('eye')}<span>Also see · ${d.see.map((x) => x.name).join(' · ')}</span></p>` : ''}
          </section>
          <section class="mg-col" aria-label="Eat and sleep">
            <h3 class="mg-h">Eat</h3>
            <ul class="mg-meals">${d.meals.map(meal)}</ul>
            <h3 class="mg-h">Sleep</h3>
            ${sleep(d.sleep)}
            ${d.tips.length ? html`<ul class="mg-tips">${d.tips.map((t) => html`<li>${t}</li>`)}</ul>` : ''}
          </section>
        </div>
      </div>
    </article>`;
};
