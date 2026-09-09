import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { plannerUrl } from '../../mag.js';

// The issue's fixed pages: cover, contents, the numbers, back cover, and the
// one honest state for a link that does not decode.

const pad2 = (n) => String(n).padStart(2, '0');
const span = (s) => (s.days.length > 1 ? `Days ${s.days[0]}–${s.days[s.days.length - 1]}` : `Day ${s.days[0]}`);

export const cover = (m, from) => html`
  <section class="mg-cover" id="cover" aria-labelledby="mg-title">
    <img src="${m.cover.src}" alt="${m.cover.alt}" width="${m.cover.w}" height="${m.cover.h}" fetchpriority="high" />
    <div class="mg-cover-txt wrap">
      <span class="eyebrow">${from === 'link' ? 'A plan shared with you' : 'Your plan, as a magazine'} · ${m.dates}</span>
      <h1 id="mg-title">${m.title}</h1>
      <dl class="mg-props">
        <div><dt>Days</dt><dd class="num">${m.days.length}</dd></div>
        <div><dt>Travellers</dt><dd class="num">${m.travellers}</dd></div>
        <div><dt>Per person</dt><dd class="num">${inr(m.total)}</dd></div>
        <div><dt>Route</dt><dd>${m.strategy.name}</dd></div>
      </dl>
    </div>
  </section>`;

export const contents = (m) => html`
  <section class="mg-toc wrap" id="contents" aria-labelledby="mg-toc-title">
    <span class="eyebrow">Contents</span>
    <h2 id="mg-toc-title" class="sr-only">Contents</h2>
    <ol class="mg-toc-list">
      ${m.days.map((d) => html`
        <li><a href="#day-${d.n}"><span class="n num">${pad2(d.n)}</span><b>${d.title}</b><span class="dots" aria-hidden="true"></span><span class="where">${d.where}</span></a></li>`)}
      <li><a href="#numbers"><span class="n num">₹</span><b>The numbers</b><span class="dots" aria-hidden="true"></span><span class="where">${inr(m.total)} pp</span></a></li>
    </ol>
    <ol class="mg-route" aria-label="Route">
      ${m.route.map((s) => html`<li><b>${s.name}</b><span class="num">${span(s)}</span></li>`)}
    </ol>
  </section>`;

const line = (l, max) => html`
  <li>
    <span class="lbl">${icon(l.icon)}${l.label}</span>
    <i style="--w:${Math.max(2, Math.round((l.amount / max) * 100))}%"></i>
    <span class="amt num">${inr(l.amount)}</span>
  </li>`;

const flight = (f) => html`
  <li>
    ${icon('plane')}
    <span><b>${f.from} → ${f.to}</b><span class="sub">${f.note}${f.range ? ` · ${f.range}` : ''}</span></span>
    <span class="amt num">${inr(f.inr)}</span>
  </li>`;

export const numbers = (m) => {
  const max = Math.max(...m.lines.map((l) => l.amount), 1);
  return html`
    <section class="mg-numbers wrap" id="numbers" aria-labelledby="mg-num-title">
      <span class="eyebrow">The numbers · per person</span>
      <h2 id="mg-num-title"><span class="num">${inr(m.total)}</span><small>all in · ${m.strategy.name}</small></h2>
      <div class="mg-num-grid">
        <ul class="mg-lines">${m.lines.map((l) => line(l, max))}</ul>
        <div class="mg-facts">
          <p><b class="num">${inr(m.group)}</b><span>for ${m.travellers}</span></p>
          <p><b class="num">${m.fun}</b><span>fun picks · ${m.tickets} tickets</span></p>
          <p><b class="num">${inr(m.vsQuote)}</b><span>under the ${inr(m.quote)} quote on airfare</span></p>
        </div>
      </div>
      <ul class="mg-flights" aria-label="Flights">${m.flights.map(flight)}</ul>
      <p class="mg-note">${m.checked}. Fares move; these are planning figures, not live seats.${m.noRoom.length ? ` No room on these days for: ${m.noRoom.join(', ')}.` : ''}</p>
    </section>`;
};

export const back = (m, from, p) => html`
  <section class="mg-back wrap" id="back" aria-labelledby="mg-back-title">
    <span class="eyebrow">${from === 'link' ? 'Make it yours' : 'Take it with you'}</span>
    <h2 id="mg-back-title">${from === 'link' ? 'Open it in the planner.' : 'Send the magazine.'}</h2>
    <div class="row">
      ${from === 'link'
        ? html`<a class="btn btn-primary" href="${plannerUrl(p)}">${icon('sparkle')}Open in planner</a>`
        : html`<a class="btn btn-primary" href="days.html">${icon('grid')}Edit the plan</a>`}
      <button class="btn btn-ghost" type="button" data-mg="copy">${icon('link')}Copy link</button>
      ${navigator.share ? html`<button class="btn btn-ghost" type="button" data-mg="share">${icon('share')}Send…</button>` : ''}
      <button class="btn btn-ghost" type="button" data-mg="print">${icon('print')}Print / PDF</button>
      <output id="mg-out" aria-live="polite"></output>
    </div>
    <p class="mg-fine">${from === 'link'
      ? 'Opening it replaces the picks, route and travellers in your planner; your documents, money and people stay as they are.'
      : 'The link carries picks, route, travellers and hearts — never documents, money, GPS or keys.'}</p>
    <ul class="mg-credits" aria-label="Photo credits">
      ${m.credits.map((c) => html`<li><a href="${c.page}" target="_blank" rel="noopener">${c.credit}</a> · ${c.license}</li>`)}
    </ul>
  </section>`;

export const badLink = () => html`
  <section class="mg-cover mg-bad wrap" id="cover" aria-labelledby="mg-title">
    <span class="eyebrow">Shared link</span>
    <h1 id="mg-title">That link isn’t a plan we can read.</h1>
    <p class="mg-fine">Ask for a fresh one from Book › Share, or open your own plan below.</p>
    <a class="btn btn-primary" href="trip.html">${icon('grid')}Show my plan</a>
  </section>`;
