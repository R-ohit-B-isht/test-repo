import { html } from '../dom.js';
import { icon } from '../icons.js';
import { VIBE_STEPS, emptyVibe, vibeReady, vibePrompt, optionOf } from '../brain/vibe.js';

// Vibe strip inside the Brain sheet: three rows of chips, one tap each. When
// all three are set the caller sends `vibePrompt` to Gemini.

let sel = emptyVibe();
let sent = false;

const chip = (step, [value, label, ic]) => html`
  <button class="chip vchip" type="button" role="radio" aria-checked="${sel[step.id] === value}" data-vibe="${step.id}" data-value="${value}">${icon(ic)}${label}</button>`;

const rowOf = (step) => html`
  <div class="vrow" role="radiogroup" aria-label="${step.label}">
    <span class="vlabel mono">${step.label}</span>
    <div class="vchips">${step.options.map((o) => chip(step, o))}</div>
  </div>`;

const summaryOf = () => {
  const chosen = VIBE_STEPS.map((s) => optionOf(s.id, sel[s.id])?.[1]).filter(Boolean);
  return chosen.length === VIBE_STEPS.length ? chosen.join(' · ') : `${chosen.length}/${VIBE_STEPS.length} · vibe · budget · group`;
};

export const vibeBlock = () => html`
    <details class="vibe" ${sent ? '' : 'open'}>
      <summary>${icon('sparkle')}<b>Three taps</b><span class="sub">${summaryOf()}</span></summary>
      ${VIBE_STEPS.map(rowOf)}
      <div class="row vgo">
        <span class="sub">${vibeReady(sel) ? 'Tap Build, or change a chip.' : 'Pick one in each row — the third tap builds your picks.'}</span>
        <button class="btn btn-ghost" type="button" data-vibe-go ${vibeReady(sel) ? '' : 'disabled'}>${icon('brain')} Build</button>
      </div>
    </details>`;

// Returns the prompt to send when a tap completes the set (or Build is pressed), else null.
export const onVibeClick = (e) => {
  const go = e.target.closest('[data-vibe-go]');
  const b = e.target.closest('[data-vibe]');
  if (!go && !b) return undefined;
  const was = vibeReady(sel);
  if (b) sel = { ...sel, [b.dataset.vibe]: b.dataset.value };
  sent = false;
  return vibeReady(sel) && (go || !was) ? vibePrompt(sel) : null;
};

// Collapse the strip once its prompt has actually gone to Gemini.
export const vibeSent = () => { sent = true; };
