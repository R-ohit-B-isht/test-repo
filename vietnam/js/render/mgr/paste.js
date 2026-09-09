import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { fmtDate } from '../../export/dates.js';
import { fmtAmount } from '../../vault/parse.js';

// "Paste a confirmation" card at the top of the Manager: textarea → read →
// review row (slot, ref, dates, amount) → fill. Markup only; the controller
// in render/manager.js owns the state machine.

const KIND_ICON = { flight: 'plane', train: 'train', bus: 'bus', cruise: 'boat', stay: 'bed', ticket: 'ticket', visa: 'passport', insurance: 'shield', esim: 'phone', other: 'file' };

const sure = (c) => (c >= 0.75 ? ['chip-jade', 'sure'] : c >= 0.4 ? ['chip-sun', 'check it'] : ['chip-lantern', 'unsure']);

export const pasteForm = (ui, hasKey) => html`
  <form class="ms-paste card" id="mgr-paste-form" autocomplete="off" data-busy="${String(ui.busy)}">
    <h3>${icon('sparkle')}Paste a confirmation</h3>
    <p class="sub">Airline email, hostel booking, Klook voucher, an SMS. ${hasKey ? 'Gemini reads it' : 'A quick read finds the ref and dates'} and fills the right slot. Text stays on this device${hasKey ? ' except the one call to Gemini' : ''}.</p>
    <textarea name="text" rows="3" placeholder="Paste the whole email or ticket text here…" required aria-label="Confirmation text"></textarea>
    <div class="row ms-pasterow">
      ${hasKey ? html`<span class="chip chip-brain">${icon('brain')}Gemini</span>` : html`<button class="btn-link" type="button" data-brain="">${icon('key')} Add a Gemini key for a sharper read</button>`}
      <button class="btn" type="submit" data-read ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Reading…' : 'Read it'}</button>
    </div>
    <p class="ms-err" role="alert" ${ui.error ? '' : 'hidden'}>${ui.error}</p>
  </form>`;

const slotPick = (fill, slots) => html`
  <label class="ms-pslot"><span>Goes into</span>
    <select name="slot" data-fill-slot>
      <option value="" ${fill.slot ? '' : 'selected'}>— pick a slot —</option>
      ${slots.map((s) => html`<option value="${s.id}" ${s.id === fill.slot ? 'selected' : ''}>${s.title}${s.when ? ` · ${fmtDate(s.when)}` : ''}</option>`)}
    </select>
  </label>`;

export const pasteResult = (fill, slots) => {
  const [cls, label] = sure(fill.confidence);
  const facts = [
    fill.ref ? html`<span class="chip">${icon('ticket')}<b>${fill.ref}</b></span>` : html`<span class="chip chip-lantern">no ref found</span>`,
    fill.date ? html`<span class="chip">${icon('calendar')}${fmtDate(fill.date)}${fill.till ? ` → ${fmtDate(fill.till)}` : ''}</span>` : '',
    fill.amount != null ? html`<span class="chip">${icon('wallet')}${fmtAmount(fill)}</span>` : '',
    ...fill.names.map((n) => html`<span class="chip">${icon('users')}${n}</span>`),
  ];
  return html`
    <div class="ms-pres" role="group" aria-label="What was read">
      <div class="ms-preshead">
        <span class="ms-ic">${icon(KIND_ICON[fill.kind] || 'file')}</span>
        <div class="ms-txt">
          <h3>${fill.kind === 'other' ? 'Confirmation' : fill.kind[0].toUpperCase() + fill.kind.slice(1)}</h3>
          <p class="sub">${fill.via === 'gemini' ? 'Read by Gemini' : 'Quick read, no Gemini'} · <span class="chip ${cls}">${label}</span></p>
        </div>
      </div>
      <div class="ms-meta">${facts}</div>
      ${fill.note ? html`<p class="sub ms-pnote">${fill.note}</p>` : ''}
      ${slotPick(fill, slots)}
      <div class="row ms-pasterow">
        <button class="btn-link" type="button" data-fill-drop>Discard</button>
        <button class="btn" type="button" data-fill-go ${fill.slot ? '' : 'disabled'}>${icon('check')} Fill ${slots.find((s) => s.id === fill.slot)?.title || 'slot'}</button>
      </div>
    </div>`;
};
