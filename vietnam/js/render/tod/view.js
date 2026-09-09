import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { PHOTOS } from '../../data/photos.js';
import { dateOf } from '../../data/trip.js';
import { whereFor } from '../../data/days.js';
import { clock } from '../../timeline.js';
import { linkChips } from '../links.js';
import { brainCta } from '../brain.js';
import { fmtDate } from '../../export/dates.js';
import { goLinks, ticketFor, stopName } from '../../today.js';
import { stageLabel } from '../../vault/slots.js';
import { isWet } from '../../weather.js';

// Markup only. The controller (render/today.js) decides what to show.

const ICON = { eat: 'bowl', do: 'sparkle', hop: 'walk', free: 'clock', sleep: 'moon', fixed: 'train' };
const rowIcon = (r) => r.icon || ICON[r.kind] || 'pin';
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const price = (r) => (r.x?.inr ? inr(r.x.inr) : r.meal?.inr ? inr(r.meal.inr) : r.sleep?.usd ? `$${r.sleep.usd}` : '');

const goChips = (r) => {
  const go = r.kind === 'sleep' && !r.sleep ? null : goLinks(r, r.stop);
  if (!go) return '';
  const { maps, grab, pinned } = go;
  return html`
    <a class="go" href="${maps}" target="_blank" rel="noopener noreferrer" title="${pinned ? 'Directions in Google Maps' : 'Search Google Maps'}">${icon('pin')}Maps</a>
    <a class="go" href="${grab}" title="Opens the Grab app">${icon('car')}Grab</a>`;
};

const tixChip = (t) => (t ? html`<button class="go go-tix ${t.rec.status}" type="button" data-tix="${t.slot.id}" title="Open in Manager">${icon('ticket')}${t.files.length ? 'Ticket' : t.rec.ref ? t.rec.ref : 'No ticket yet'}</button>` : '');

const rowCard = (r, d, tickets, big = false) => html`
  <li class="tcard ${big ? 'is-big' : ''} is-${r.status} k-${r.kind} ${r.late ? 'is-late' : ''}">
    <span class="tcard-ic"><span class="ic-wrap">${icon(rowIcon(r))}</span></span>
    <span class="tcard-t num">${clock(r.start)}<em>${clock(r.end)}</em></span>
    <span class="tcard-body">
      <b>${r.label}</b>
      ${r.inside ? html`<span class="sub">${r.inside}</span>` : ''}
      ${r.see?.length ? html`<span class="sub">${icon('eye')}${r.see.map((x) => x.name).join(' · ')}</span>` : ''}
      ${r.x?.note ? html`<span class="sub">${r.x.note}</span>` : ''}
      ${r.late ? html`<span class="sub warn">${icon('info')}runs late</span>` : ''}
      <span class="tcard-go">${goChips(r)}${tixChip(ticketFor(tickets, r))}</span>
    </span>
    ${price(r) ? html`<span class="tcard-amt num">${price(r)}</span>` : ''}
  </li>`;

const wait = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}` : `${mins} min`);

const nowBlock = (d, tickets, ph) => {
  if (d.current) return html`<ul class="tstack">${rowCard(d.current, d, tickets, true)}</ul>`;
  if (d.next) return html`<div class="tgap card"><span class="ic-wrap">${icon('clock')}</span><div><b>Free for ${wait(d.gap)}</b><span class="sub">next is ${d.next.label} at ${clock(d.next.start)}</span></div></div>`;
  return html`<div class="tgap card is-end"><span class="ic-wrap">${icon('moon')}</span><div><b>${d.done.length ? 'Day done' : 'Nothing packed today'}</b><span class="sub">${d.tomorrow ? `Tomorrow · Day ${d.tomorrow.n} · ${d.tomorrow.title}` : 'Fly home tomorrow'}</span></div></div>`;
};

const dots = (rows) => html`<span class="tdots" aria-label="${rows.filter((r) => r.status === 'done').length} of ${rows.length} done">${rows.map((r) => html`<i class="is-${r.status}"></i>`)}</span>`;

export const hero = (d, ph, wx) => {
  const p = PHOTOS[d.day.photo];
  return html`
    <div class="thero">
      <img src="assets/photos/${d.day.photo}.jpg" alt="${p.alt}" width="${p.w}" height="${p.h}" style="object-position: ${p.pos || '50% 50%'}" decoding="async" />
      <div class="thero-txt">
        <span class="eyebrow">Day ${d.day.n} of 8 · ${dateOf(d.day.n)} · ${whereFor(d.day, d.transit) || stopName(d.stop)}</span>
        <h2>${d.day.title}</h2>
        <div class="row">
          ${dots(d.rows)}
          ${wx?.ok && wx.current ? html`<span class="chip ${isWet(wx.current.code) ? 'chip-rain' : 'chip-sun'}">${icon(wx.current.icon)} ${wx.current.temp}° · ${wx.current.label}</span>` : ''}
          <span class="chip chip-ink num">${clock(ph.mins)}</span>
        </div>
      </div>
    </div>`;
};

export const stack = (d, tickets, ph) => html`
  <section class="tsec" aria-labelledby="now-h">
    <h2 class="eyebrow" id="now-h">Now</h2>
    ${nowBlock(d, tickets, ph)}
  </section>
  ${d.upcoming.length ? html`
  <section class="tsec" aria-labelledby="next-h">
    <h2 class="eyebrow" id="next-h">Next up · ${d.upcoming.length}</h2>
    <ul class="tstack">${d.upcoming.map((r) => rowCard(r, d, tickets))}</ul>
  </section>` : ''}
  ${d.done.length ? html`
  <details class="tsec tdone">
    <summary class="eyebrow">Done · ${d.done.length}</summary>
    <ul class="tstack">${d.done.map((r) => rowCard(r, d, tickets))}</ul>
  </details>` : ''}
  <div class="row trow-actions">
    <button class="btn btn-ghost" type="button" data-open-day="${d.day.n}">${icon('grid')}Full day board</button>
    ${d.tomorrow ? html`<button class="btn btn-ghost" type="button" data-open-day="${d.tomorrow.n}">${icon('arrow')}Tomorrow</button>` : ''}
  </div>`;

const hourChip = (h, nowH) => html`<li class="${h.h === nowH ? 'is-now' : ''} ${isWet(h.code) ? 'is-wet' : ''}"><span class="num">${String(h.h).padStart(2, '0')}</span>${icon(h.icon)}<b class="num">${h.temp}°</b>${h.rain != null ? html`<em class="num">${h.rain}%</em>` : ''}</li>`;

export const weather = (wx, stopId, ph, dayN) => {
  const head = (body) => html`<section class="tsec twx card" aria-labelledby="wx-h"><h2 class="eyebrow" id="wx-h">${icon('umbrella')} Weather · ${stopName(stopId)}</h2>${body}</section>`;
  if (!wx) return head(html`<div class="twx-state" aria-busy="true"><span class="skl"></span><span class="skl"></span><span class="skl"></span></div>`);
  if (!wx.ok) return head(html`<p class="twx-state">${wx.opens ? `Forecast opens ${fmtDate(wx.opens)} · Open-Meteo reaches ~15 days ahead` : wx.reason}</p>`);
  const nowH = Math.floor(ph.mins / 60);
  const left = wx.hours.filter((h) => h.h >= nowH - 1 && h.h <= 23);
  return head(html`
    ${wx.current ? html`<p class="twx-now">${icon(wx.current.icon)}<b class="num">${wx.current.temp}°</b><span>${wx.current.label}</span></p>` : ''}
    ${wx.daily ? html`<p class="twx-day">
      <span>${icon(wx.daily.icon)}${wx.daily.label} · <span class="num">${wx.daily.lo}–${wx.daily.hi}°</span></span>
      <span>${icon('umbrella')}<span class="num">${wx.daily.rain ?? '–'}%</span></span>
      <span>${icon('sun')}<span class="num">${wx.daily.sunrise}–${wx.daily.sunset}</span></span>
    </p>` : ''}
    <ul class="twx-hours">${(left.length ? left : wx.hours).map((h) => hourChip(h, nowH))}</ul>
    ${wx.wetDay ? html`<div class="row">${brainCta(`It is a wet day on day ${dayN} in ${stopName(stopId)}. Swap outdoor picks on day ${dayN} for indoor ones (museums, tailor, cafés, shows) and keep the price similar.`, 'Wet day · swap picks')}</div>` : ''}
    <a class="twx-src" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo${icon('link')}</a>`);
};

const tixCard = (t) => html`
  <li class="tix ${t.rec.status}">
    <span class="ic-wrap">${icon(t.slot.icon)}</span>
    <span class="tix-body">
      <b>${t.slot.title}</b>
      <span class="sub">${t.rec.ref ? html`<span class="num">${t.rec.ref}</span> · ` : ''}${stageLabel(t.slot, t.rec.status)}${t.rec.date ? ` · ${fmtDate(t.rec.date)}` : ''}</span>
      <span class="tix-files">
        ${t.files.map((f) => html`<button class="go" type="button" data-peek="${t.slot.id}:${f.id}">${icon('file')}${f.name}</button>`)}
        ${!t.files.length ? linkChips(t.slot.links || []) : ''}
      </span>
    </span>
    <a class="btn-icon" href="manager.html#slot-${t.slot.id}" aria-label="Open ${t.slot.title} in Manager">${icon('folder')}</a>
  </li>`;

export const tickets = (list) => html`
  <section class="tsec" aria-labelledby="tix-h">
    <h2 class="eyebrow" id="tix-h">Tickets & papers today · ${list.length}</h2>
    ${list.length ? html`<ul class="tixs">${list.map(tixCard)}</ul>` : html`<p class="sub">Nothing to show at the door today.</p>`}
  </section>`;

const evRow = (e) => html`
  <li class="tcard k-${e.kind}">
    <span class="tcard-ic"><span class="ic-wrap">${icon(e.icon)}</span></span>
    <span class="tcard-t num">${fmtDate(e.iso)}${e.start != null ? html`<em>${clock(e.start)}</em>` : ''}</span>
    <span class="tcard-body"><b>${e.title}</b>${e.sub ? html`<span class="sub">${e.sub}</span>` : ''}</span>
  </li>`;

export const before = (ph, events) => html`
  <div class="tbefore card">
    <span class="eyebrow">${fmtDate(ph.iso)}</span>
    <span class="num big">${ph.left}</span>
    <span class="sub">${ph.left === 1 ? 'day · you fly tonight' : 'days to Vietnam'}</span>
    <div class="row"><a class="btn" href="days.html">${icon('check')}Today's task</a><a class="btn btn-ghost" href="book.html">${icon('ticket')}Book</a></div>
  </div>
  ${events.length ? html`<section class="tsec" aria-labelledby="up-h"><h2 class="eyebrow" id="up-h">Coming up</h2><ul class="tstack">${events.map(evRow)}</ul></section>` : ''}`;

export const after = (ph, done) => html`
  <div class="tbefore card is-after">
    <span class="eyebrow">${fmtDate(ph.iso)}</span>
    <span class="num big">8</span>
    <span class="sub">days done · ${done} picks lived</span>
    <div class="row"><a class="btn" href="split.html">${icon('wallet')}Settle up</a><a class="btn btn-ghost" href="book.html#share">${icon('share')}Share the plan</a></div>
  </div>`;
