import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { estimateMb, MAX_TILES } from '../../gmap/tiles.js';
import { mb } from '../../gmap/cache.js';

// "Save this city" card. Honest states: unsupported · not saved · saving
// (progress) · saved (count, size, style, when) · failed. Tiles live in the
// browser's Cache Storage only; nothing is uploaded.

const ago = (t) => {
  const d = Math.round((Date.now() - t) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export const offlineCard = ({ city, n, saved, job, theme, quota, supported }) => {
  if (!supported) {
    return html`<div class="gm-off"><span class="ic-wrap">${icon('offline')}</span><div><b>Offline map</b><span class="sub">This browser can’t store map tiles. The list still works offline.</span></div></div>`;
  }
  const stale = saved && saved.theme !== theme;
  const status = job
    ? html`<span class="sub num">Saving ${job.done} / ${job.total}${job.failed ? ` · ${job.failed} missed` : ''}</span>`
    : saved
      ? html`<span class="sub"><span class="num">${saved.n}</span> tiles · ≈${mb(saved.bytes)} · ${saved.theme} map · saved ${ago(saved.at)}${stale ? html` · <em class="warn">you’re on the ${theme} map now — update to keep it offline</em>` : ''}${saved.failed ? html` · <em class="warn">${saved.failed} tiles missed</em>` : ''}</span>`
      : n > MAX_TILES
        ? html`<span class="sub"><em class="warn">Your ${city.name} pins are too spread out to save (${n} tiles) — drop a far-off pick and try again.</em></span>`
        : html`<span class="sub">${city.name} streets around your pins · <span class="num">${n}</span> tiles ≈ ${estimateMb(n)} MB on this phone</span>`;
  return html`
    <div class="gm-off ${job ? 'is-busy' : saved ? 'is-saved' : ''}" aria-live="polite">
      <span class="ic-wrap">${icon(saved && !job ? 'check' : 'download')}</span>
      <div class="gm-off-txt">
        <b>${job ? 'Saving…' : saved ? `${city.name} works offline` : `Save ${city.name} for offline`}</b>
        ${status}
        ${job ? html`<span class="gm-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${job.total}" aria-valuenow="${job.done}"><i style="width:${Math.round((100 * job.done) / Math.max(1, job.total))}%"></i></span>` : ''}
        ${quota && !job ? html`<span class="sub num muted">Site storage ${mb(quota.usage)} used</span>` : ''}
      </div>
      <span class="gm-off-act">
        ${job
          ? html`<button class="btn btn-sm" type="button" data-off="stop">${icon('x')}Stop</button>`
          : html`<button class="btn ${saved && !stale ? 'btn-ghost' : ''}" type="button" data-off="save" ${n > MAX_TILES ? 'disabled' : ''}>${icon('download')}${saved ? 'Update' : 'Save'}</button>
                 ${saved ? html`<button class="btn btn-sm" type="button" data-off="forget" aria-label="Forget saved tiles for ${city.name}">${icon('trash')}Forget</button>` : ''}`}
      </span>
    </div>
    <p class="gm-attr">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, tiles © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>. Saved tiles stay in this browser.</p>`;
};
