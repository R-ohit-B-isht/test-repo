import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { fmtDate } from '../../export/dates.js';
import { STATUS, recordOf, liveFiles, passportWarning } from '../../vault/slots.js';
import { isImage, fmtBytes } from '../../vault/files.js';
import { linkChips } from '../links.js';

// One Manager slot as a card: what it is, where it stands, the dates that
// matter, your ref / notes, the files you dropped in, and where to book it.
// Pure markup — the controller in render/manager.js wires the events.

const today = () => new Date().toISOString().slice(0, 10);

const dates = (slot, rec) => {
  const out = [];
  if (slot.when) out.push(html`<span class="chip">${icon('calendar')}${fmtDate(slot.when)}${slot.till ? html` → ${fmtDate(slot.till)}` : ''}</span>`);
  if (slot.by && rec.status !== 'done') {
    const late = slot.by < today();
    out.push(html`<span class="chip ${late ? 'chip-lantern' : 'chip-sun'}">${icon('clock')}${late ? 'Was due' : 'By'} ${fmtDate(slot.by)}</span>`);
  }
  if (slot.estimate) out.push(html`<span class="chip">Gemini estimate</span>`);
  return out;
};

const stage = (slot, rec) => html`
  <div class="seg ms-stage" role="radiogroup" aria-label="${slot.title} status">
    ${STATUS.map((s, i) => html`<label><input type="radio" name="stage-${slot.id}" value="${s}" ${rec.status === s ? 'checked' : ''} /><span>${i === 2 ? icon('check') : ''}${slot.stages[i]}</span></label>`)}
  </div>`;

const fields = (slot, rec) => html`
  <div class="ms-fields">
    <label><span>Ref / PNR</span><input type="text" data-field="ref" value="${rec.ref}" placeholder="—" autocomplete="off" spellcheck="false" /></label>
    ${slot.dateLabel ? html`<label><span>${slot.dateLabel}</span><input type="date" data-field="date" value="${rec.date}" /></label>` : ''}
    <label class="ms-note"><span>Notes</span><textarea data-field="note" rows="1" placeholder="Seat, gate, who paid…">${rec.note}</textarea></label>
  </div>`;

const fileRow = (f) => html`
  <li class="ms-file" data-fid="${f.id}" data-img="${String(isImage(f))}">
    <button class="ms-thumb" type="button" data-peek="${f.id}" aria-label="Preview ${f.name}">${isImage(f) ? html`<img alt="" />` : icon('file')}</button>
    <span class="ms-fname"><b>${f.name}</b><small>${f.type === 'application/pdf' ? 'PDF' : 'Photo'} · ${fmtBytes(f.size)}</small></span>
    <a class="btn-icon" href="#" download="${f.name}" data-dl aria-label="Download ${f.name}">${icon('download')}</a>
    <label class="btn-icon" aria-label="Replace ${f.name}" title="Replace">${icon('upload')}<input type="file" accept="application/pdf,image/*" data-replace="${f.id}" class="sr-only" /></label>
    <button class="btn-icon" type="button" data-rmfile="${f.id}" aria-label="Remove ${f.name}">${icon('trash')}</button>
  </li>`;

const files = (slot, rec) => {
  const live = liveFiles(rec);
  return html`
    <ul class="ms-files" aria-label="${slot.title} files">${live.map(fileRow)}</ul>
    <label class="ms-drop">
      <input type="file" accept="application/pdf,image/*" multiple data-upload class="sr-only" />
      ${icon('upload')}<span>${live.length ? 'Add another' : 'Drop the PDF or a photo'}</span><small>PDF · JPG · PNG · stays on this device</small>
    </label>`;
};

export const slotCard = (state, slot) => {
  const rec = recordOf(state, slot.id);
  const warn = slot.id === 'passport' ? passportWarning(rec) : null;
  return html`
    <article class="mslot card" id="slot-${slot.id}" data-slot="${slot.id}" data-status="${rec.status}">
      <header class="ms-head">
        <span class="ms-ic">${icon(slot.icon)}</span>
        <div class="ms-txt"><h3>${slot.title}</h3><p class="sub">${slot.hint}</p></div>
        ${slot.custom ? html`<button class="btn-icon" type="button" data-drop-slot="${slot.id}" aria-label="Remove ${slot.title}">${icon('trash')}</button>` : ''}
      </header>
      <div class="ms-meta">${dates(slot, rec)}</div>
      ${stage(slot, rec)}
      ${fields(slot, rec)}
      ${warn ? html`<p class="ms-warn">${icon('info')}${warn}</p>` : ''}
      ${files(slot, rec)}
      ${slot.links.length ? html`<div class="links">${linkChips(slot.links)}</div>` : ''}
      <p class="ms-err" role="alert" hidden></p>
    </article>`;
};
