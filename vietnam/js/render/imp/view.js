import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { lookup } from '../../data/activities.js';
import { PROVIDER_NAME, STOP_IDS, STOP_NAME, SLOTS } from '../../brain/link.js';
import { strip, thumb } from '../gallery.js';

// Markup for the "Saw it on Insta?" card: the paste form, the review card
// (photo strip, what was read, editable fields, Add / Discard) and the list of
// links already saved. The controller in render/importer.js owns the state.

const SLOT_LABEL = { am: 'Morning', pm: 'Afternoon', night: 'Night', any: 'Any time', day: 'Full day' };
const needText = (link) => (link?.provider === 'instagram' ? 'Instagram keeps its captions to itself — paste what it said' : `We cannot read ${PROVIDER_NAME[link?.provider] || 'that site'} — paste what it said`);
const sure = (c) => (c >= 0.75 ? ['chip-jade', 'sure'] : c >= 0.4 ? ['chip-sun', 'check it'] : ['chip-lantern', 'unsure']);


export const impForm = (ui, hasKey) => html`
  <form class="imp card" id="imp-form" autocomplete="off" data-busy="${String(!!ui.busy)}">
    <h3>${icon('play')}Saw it on Insta?</h3>
    <p class="sub">Paste a YouTube, TikTok or Instagram link. ${hasKey ? 'Gemini names the place' : 'We guess the place from its title'}, find real photos of it, you tap Add.${hasKey ? ' Only the link and its title go to Gemini.' : ''}</p>
    <div class="imp-row">
      <input name="url" type="url" inputmode="url" placeholder="https://www.instagram.com/reel/…" required aria-label="Clip link" ${ui.busy ? 'disabled' : ''} />
      <button class="btn" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? html`<span class="imp-spin" aria-hidden="true"></span>${ui.busy}` : 'Read it'}</button>
    </div>
    <label class="fld imp-cap ${ui.need ? 'is-need' : ''}"><span>${ui.need ? needText(ui.link) : 'Caption or what it said (optional, helps a lot)'}</span>
      <textarea name="caption" rows="2" placeholder="e.g. Hai Van Pass by scooter from Da Nang" aria-label="Caption" ${ui.busy ? 'disabled' : ''}></textarea>
    </label>
    ${hasKey ? '' : html`<button class="btn-link" type="button" data-brain="">${icon('key')} Add a Gemini key for a sharper read</button>`}
    <p class="imp-err" role="alert" ${ui.error ? '' : 'hidden'}>${ui.error}</p>
  </form>`;

const opt = (v, label, cur) => html`<option value="${v}" ${v === cur ? 'selected' : ''}>${label}</option>`;

export const impReview = (ui, state) => {
  const g = ui.guess;
  const [cls, label] = sure(g.confidence);
  const match = g.match ? lookup(state, g.match) : null;
  const preview = { id: 'imp-preview', name: g.name || 'this place', pics: ui.pics, yt: ui.link.yt, by: ui.embed?.by, clip: ui.embed?.title };
  const photoNote = ui.pics.length ? `${ui.pics.length} photo${ui.pics.length > 1 ? 's' : ''} of it on Wikimedia Commons` : ui.link.yt ? 'no Commons photo of it yet — the clip\'s frame stands in' : 'no photo of it found';
  return html`
    <div class="imp-res card" role="group" aria-label="What was read">
      <div class="imp-strip">${strip(preview) || html`<div class="imp-nopic">${icon('lantern')}</div>`}</div>
      <div class="imp-head">
        <div class="imp-txt">
          <p class="sub imp-src">${icon('link')}${PROVIDER_NAME[ui.link.provider]}${ui.embed?.by ? ` · ${ui.embed.by}` : ''}${ui.embed?.title ? html` · <i>${ui.embed.title}</i>` : ''}</p>
          <p class="sub">${ui.via === 'gemini' ? 'Named by Gemini' : 'Guessed from the words, no Gemini'} · <span class="chip ${cls}">${label}</span> · ${photoNote}</p>
        </div>
      </div>
      ${match ? html`
        <div class="imp-match">
          ${thumb(match)}
          <span><b>${match.name}</b> is already in your catalog${state.picks[match.id] ? ' and switched on' : ''}.</span>
          <button class="btn btn-sm" type="button" data-imp-on="${match.id}">${state.picks[match.id] ? 'Show it' : `${icon('check')} Switch it on`}</button>
        </div>` : ''}
      <div class="imp-fields">
        <label class="fld imp-name"><span>Place</span><input name="name" value="${g.name}" maxlength="80" required /></label>
        <label class="fld"><span>Stop</span>
          <select name="stop">${opt('', '— where —', g.stop)}${STOP_IDS.map((id) => opt(id, STOP_NAME[id], g.stop))}</select></label>
        <label class="fld"><span>When</span>
          <select name="slot">${SLOTS.map((s) => opt(s, SLOT_LABEL[s] || s, g.slot))}</select></label>
        <label class="fld"><span>Hours</span><input name="hours" type="number" min="0.5" max="12" step="0.5" value="${g.hours}" inputmode="decimal" /></label>
        <label class="fld"><span>₹ per person</span><input name="inr" type="number" min="0" max="50000" step="10" value="${g.inr == null ? '' : g.inr}" placeholder="free" inputmode="numeric" /></label>
        <div class="fld"><span>Counts as</span>
          <div class="seg imp-kind" role="radiogroup" aria-label="Fun or see">
            <label><input type="radio" name="kind" value="fun" ${g.kind === 'fun' ? 'checked' : ''} />${icon('sparkle')}<span>Fun</span></label>
            <label><input type="radio" name="kind" value="see" ${g.kind === 'see' ? 'checked' : ''} />${icon('eye')}<span>See</span></label>
          </div></div>
        <label class="fld imp-note"><span>Note</span><input name="note" value="${g.note}" maxlength="120" placeholder="what you do there" /></label>
      </div>
      <div class="row imp-go">
        <button class="btn-link" type="button" data-imp-drop>Discard</button>
        <button class="btn" type="button" data-imp-add ${g.name && g.stop ? '' : 'disabled'}>${icon('plus')} Add ${match ? 'as a new pick' : 'to picks'}</button>
      </div>
    </div>`;
};

export const impSaved = (state) => {
  const list = (state.imports || []).filter((r) => !r.deleted).slice().reverse();
  if (!list.length) return '';
  return html`
    <div class="imp-saved">
      <span class="eyebrow">Saved from links</span>
      <ul class="imp-list">
        ${list.map((r) => {
          const x = lookup(state, r.act);
          return html`
            <li class="imp-item ${x && state.picks[x.id] ? 'is-on' : ''}">
              ${x ? thumb(x) || html`<span class="th is-blank">${icon('pin')}</span>` : html`<span class="th is-blank">${icon('pin')}</span>`}
              <span class="imp-itxt"><b>${x?.name || 'removed pick'}</b><small>${PROVIDER_NAME[r.provider]}${x ? ` · ${STOP_NAME[x.stop] || x.stop}` : ''}</small></span>
              <a class="src" href="${r.url}" target="_blank" rel="noopener noreferrer" aria-label="Open the clip">${icon('link')}</a>
              ${x ? html`<button class="btn-icon" type="button" data-imp-show="${x.id}" aria-label="Show ${x.name} in the picker">${icon('arrow')}</button>` : ''}
              <button class="btn-icon" type="button" data-imp-rm="${r.id}" aria-label="Forget this link${x?.id.startsWith('ai-') ? ' and its pick' : ''}">×</button>
            </li>`;
        })}
      </ul>
    </div>`;
};
