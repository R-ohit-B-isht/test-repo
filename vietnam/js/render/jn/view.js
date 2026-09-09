import { html, raw } from '../../dom.js';
import { icon } from '../../icons.js';
import { dateOf } from '../../data/trip.js';
import { whereFor } from '../../data/days.js';
import { stopName } from '../../today.js';
import { journalStats, canRecap, RECAP_MIN, fmtBytes, takenLabel, neighbours } from '../../journal.js';

// Markup only. Controller: render/journal.js · recap overlay: render/recap.js.
// Shape borrowed from Polarsteps' step page (one block per day, photos big,
// tap the middle to go full-screen and swipe) and Google Photos' Memories
// (a story player with a segmented bar, tap the edges to move).

const ACCEPT = 'image/*';

// <img> tags carry data-ph; the controller fills `src` from IndexedDB after
// paint so the markup itself never holds object URLs.
const thumb = (p, size = 't') => html`<img data-ph="${p.id}" data-size="${size}" alt="${p.caption || p.name}" width="${p.w}" height="${p.h}" decoding="async" loading="lazy" />`;

export const addInput = (day, label, cls = 'btn') => html`
  <label class="${cls} jn-add" data-day="${day ?? ''}">${icon('upload')}${label}<input type="file" accept="${ACCEPT}" multiple class="sr-only" data-add ${day != null ? raw(`data-add-day="${day}"`) : ''} /></label>`;

// ── Hero: what you have, add more, play it back ───────────────────────────
export const hero = (state, ui) => {
  const s = journalStats(state);
  const ok = canRecap(state);
  return html`
    <article class="card jn-hero ${ui.dragging ? 'is-drag' : ''}" data-dropzone>
      <div class="jn-hero-main">
        <span class="eyebrow">${icon('camera')}Photo journal</span>
        ${s.photos
          ? html`<p class="jn-big"><b class="num">${s.photos}</b><span>photo${s.photos === 1 ? '' : 's'}</span></p>
            <p class="sub num">${s.days} of ${s.of} days · ${fmtBytes(s.bytes)} on this phone${s.loose ? ` · ${s.loose} not sorted yet` : ''}</p>`
          : html`<p class="jn-big"><b>Nothing yet</b></p>
            <p class="sub">Drop the day's photos in and they sort themselves by date. They never leave this phone.</p>`}
      </div>
      <div class="jn-hero-side">
        <div class="row">
          ${addInput(null, 'Add photos', 'btn btn-primary')}
          <button class="btn" type="button" data-recap ${ok ? '' : 'disabled'} title="${ok ? 'Play the recap' : `Needs ${RECAP_MIN} sorted photos`}">${icon('play')}Play recap</button>
        </div>
        ${ui.busy ? html`<p class="sub jn-st" role="status" aria-live="polite">${icon('clock')} Reading ${ui.busy}…</p>` : ''}
        ${ui.error ? html`<p class="sub jn-st is-err" role="alert">${icon('info')} ${ui.error}</p>` : ''}
        ${!ok && s.photos ? html`<p class="sub">${RECAP_MIN - s.photos > 0 ? `${RECAP_MIN - s.photos} more` : 'Sort the loose ones'} and the recap unlocks.</p>` : ''}
      </div>
    </article>`;
};

// ── One block per trip day ────────────────────────────────────────────────
const tile = (p) => html`
  <li><button class="jn-tile" type="button" data-view="${p.id}" aria-label="${p.caption || p.name} · ${takenLabel(p)}">${thumb(p)}${p.caption ? html`<span class="jn-cap">${p.caption}</span>` : ''}</button></li>`;

export const dayBlock = (g, transit) => {
  const { n, day, photos } = g;
  return html`
    <section class="jn-day ${photos.length ? '' : 'is-empty'}" id="day-${n}" aria-labelledby="jn-d${n}" data-dropzone data-day="${n}">
      <header class="jn-day-head">
        <span class="jn-folio num">${String(n).padStart(2, '0')}</span>
        <div class="jn-day-txt">
          <h2 class="jn-day-title" id="jn-d${n}">${day.title}</h2>
          <span class="sub">${dateOf(n)} · ${whereFor(day, transit) || stopName(day.stop)}${photos.length ? ` · ${photos.length} photo${photos.length === 1 ? '' : 's'}` : ''}</span>
        </div>
        ${addInput(n, photos.length ? 'Add' : 'Add photos', 'btn btn-ghost btn-sm')}
      </header>
      ${photos.length
        ? html`<ol class="jn-grid" aria-label="Day ${n} photos">${photos.map(tile)}</ol>`
        : html`<p class="jn-drop sub">${icon('upload')} Drop day ${n} here</p>`}
    </section>`;
};

export const looseBlock = (photos) => (photos.length ? html`
  <section class="jn-day is-loose" id="day-loose" aria-labelledby="jn-loose" data-dropzone>
    <header class="jn-day-head">
      <span class="jn-folio">?</span>
      <div class="jn-day-txt">
        <h2 class="jn-day-title" id="jn-loose">Not sorted yet</h2>
        <span class="sub">${photos.length} without a trip date · open one and pick its day</span>
      </div>
    </header>
    <ol class="jn-grid" aria-label="Unsorted photos">${photos.map(tile)}</ol>
  </section>` : '');

// ── Lightbox: one photo, its facts, move / caption / remove ───────────────
export const viewer = (state, p, days) => {
  const nb = neighbours(state, p.id);
  return html`
    <div class="card jn-view-card">
      <div class="card-head">
        <h3 class="h3" id="jn-view-title">${p.day ? `Day ${p.day}` : 'Not sorted'}<small class="sub num"> · ${nb.i + 1} of ${nb.n}</small></h3>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      <figure class="jn-fig">
        <button class="jn-nav is-prev" type="button" data-nav="${nb.prev?.id || ''}" aria-label="Previous photo" ${nb.prev ? '' : 'disabled'}>‹</button>
        ${thumb(p, 'full')}
        <button class="jn-nav is-next" type="button" data-nav="${nb.next?.id || ''}" aria-label="Next photo" ${nb.next ? '' : 'disabled'}>›</button>
      </figure>
      <div class="jn-meta">
        <label class="field jn-caption"><span class="sr-only">Caption</span><input type="text" data-caption="${p.id}" value="${p.caption}" placeholder="Say something about it…" maxlength="120" /></label>
        <div class="row">
          <label class="field jn-move"><span class="eyebrow">Day</span>
            <select data-move="${p.id}">
              <option value="" ${p.day == null ? 'selected' : ''}>Not sorted</option>
              ${days.map((d) => html`<option value="${d.n}" ${p.day === d.n ? 'selected' : ''}>Day ${d.n} · ${dateOf(d.n)} · ${d.title}</option>`)}
            </select>
          </label>
          <span class="sub num jn-facts">${takenLabel(p)}${p.exif ? '' : p.taken ? ' (file time)' : ''} · ${p.w}×${p.h} · ${fmtBytes(p.size)}</span>
        </div>
        <div class="row jn-acts">
          <a class="btn btn-ghost btn-sm" data-dl="${p.id}" download="${p.name.replace(/\.[^.]+$/, '')}.jpg" href="#">${icon('download')}Save</a>
          <button class="btn btn-ghost btn-sm" type="button" data-remove="${p.id}">${icon('trash')}Remove</button>
        </div>
      </div>
    </div>`;
};

// ── Recap overlay (story player) ──────────────────────────────────────────
// `slides` from journal.recapSlides; `i` current index; `end` true after the last.
export const recapView = (slides, i, stats, playing, reduce, end, transit) => {
  const cur = slides[i];
  const still = reduce || !playing;
  const bars = slides.map((s, k) => html`<span class="${k < i || end ? 'is-done' : k === i ? 'is-cur' : ''} ${s.first ? 'is-first' : ''}" style="--ms: ${still ? 0 : 'var(--rc-step)'}"></span>`);
  return html`
    <div class="rc-stage" data-i="${i}">
      <div class="rc-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${slides.length}" aria-valuenow="${end ? slides.length : i + 1}" aria-label="Photo ${i + 1} of ${slides.length}">${bars}</div>
      <div class="rc-top">
        <span class="eyebrow">${end ? 'The whole trip' : `Day ${cur.f.n} · ${dateOf(cur.f.n)}`}</span>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      ${end
        ? html`<div class="rc-end">
            <span class="eyebrow">The end</span>
            <h3 class="rc-end-title" id="recap-title">That was Vietnam.</h3>
            <p class="rc-end-stat num">${stats.photos} photos · ${stats.days} of ${stats.of} days</p>
            <div class="row">
              <button class="btn" type="button" data-rc="replay">${icon('undo')}Watch again</button>
              <button class="btn btn-ghost" type="button" data-rc-share>${icon('share')}Share</button>
              <a class="btn btn-ghost" href="score.html">${icon('star')}Score</a>
            </div>
          </div>`
        : html`<figure class="rc-fig ${reduce ? '' : 'is-live'}">
            ${thumb(cur.p, 'full')}
            <figcaption class="rc-cap">
              <h3 class="rc-title" id="recap-title">${cur.f.day.title}</h3>
              <p class="sub">${whereFor(cur.f.day, transit) || stopName(cur.f.day.stop)}${cur.p.caption ? ` · ${cur.p.caption}` : ''}</p>
            </figcaption>
          </figure>`}
      <button class="rc-zone is-prev" type="button" data-rc="prev" aria-label="Previous photo" ${i === 0 && !end ? 'disabled' : ''}></button>
      <button class="rc-zone is-next" type="button" data-rc="next" aria-label="Next photo" ${end ? 'disabled' : ''}></button>
      <div class="rc-ctl">
        <button class="btn-icon" type="button" data-rc="prev" aria-label="Previous" ${i === 0 && !end ? 'disabled' : ''}>‹</button>
        ${reduce || end ? '' : html`<button class="btn-icon" type="button" data-rc="toggle" aria-label="${playing ? 'Pause' : 'Play'}" aria-pressed="${playing ? 'true' : 'false'}">${playing ? '❚❚' : icon('play')}</button>`}
        <button class="btn-icon" type="button" data-rc="next" aria-label="Next" ${end ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
};

// Small card for Today (live day and the after-trip recap).
export const todayCard = (state, n) => {
  const s = journalStats(state);
  const today = n ? (state.photos || []).filter((p) => !p.deleted && p.day === n).length : 0;
  return html`
    <section class="tsec" aria-labelledby="jn-today-h">
      <h2 class="eyebrow" id="jn-today-h">${n ? `Photos · day ${n}` : 'Your photos'}</h2>
      <div class="card jn-today">
        <span class="sub num">${n ? (today ? `${today} today · ${s.photos} in all` : 'Nothing from today yet') : `${s.photos} photos · ${s.days} days`}</span>
        <div class="row">
          ${n ? addInput(n, 'Add today\u2019s', 'btn btn-sm') : ''}
          ${canRecap(state) ? html`<button class="btn ${n ? 'btn-ghost ' : ''}btn-sm" type="button" data-recap>${icon('play')}Recap</button>` : ''}
          <a class="btn btn-ghost btn-sm" href="journal.html${n ? `#day-${n}` : ''}">${icon('camera')}Journal</a>
        </div>
      </div>
    </section>`;
};
