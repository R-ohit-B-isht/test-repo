// Control-panel bindings, presets and pointer interaction.

import { state, PRESETS } from './config.js';

const $ = (id) => document.getElementById(id);

// slider spec: id → { state key, slider->state mapping, display format }
const SLIDERS = {
  brightness: { key: 'brightness', k: 100 },
  scale:      { key: 'scale', k: 100 },
  speed:      { key: 'speed', k: 1000 },
  detail:     { key: 'detail', k: 100 },
  height:     { key: 'height', k: 100 },
  hue:        { key: 'hueShift', k: 100 },
  sat:        { key: 'saturation', k: 100 },
  stars:      { key: 'stars', k: 100 },
  refl:       { key: 'reflection', k: 100 },
  tilt:       { key: 'tilt', k: 100 },
  drift:      { key: 'drift', k: 100 },
  fov:        { key: 'fov', k: 100 },
};

function syncSlider (id) {
  const { key, k } = SLIDERS[id];
  const el = $(id);
  el.value = state[key] * k;
  $(id + 'Val').textContent = Math.round(Number(el.value));
}

export function bindControls () {
  for (const [id, { key, k }] of Object.entries(SLIDERS)) {
    $(id).addEventListener('input', (e) => {
      const v = Number(e.target.value);
      state[key] = v / k;
      $(id + 'Val').textContent = Math.round(v);
    });
    syncSlider(id);
  }

  for (const name of Object.keys(PRESETS)) {
    $('preset-' + name).addEventListener('click', () => applyPreset(PRESETS[name], name));
  }

  $('panelToggle').addEventListener('click', (e) => {
    const collapsed = $('panel').classList.toggle('collapsed');
    e.target.setAttribute('aria-expanded', String(!collapsed));
  });

  const clock = $('clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); };
  tick();
  setInterval(tick, 1000);
}

// Apply a named preset: copy fields into state, resync sliders and chips.
export function applyPreset (preset, name) {
  Object.assign(state, preset);
  for (const id of Object.keys(SLIDERS)) syncSlider(id);
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.id === 'preset-' + name);
  });
}

// Activity meter: geomagnetic-style Kp readout derived from live settings.
const LABELS = ['quiet', 'unsettled', 'active', 'minor storm', 'major storm'];
export function updateActivityMeter () {
  const kp = Math.min(state.brightness * 0.5 + state.speed * 12 + state.detail * 0.3, 2.4);
  $('kpBar').style.width = `${(kp / 2.4) * 100}%`;
  $('kpText').textContent = LABELS[Math.min(Math.floor((kp / 2.4) * LABELS.length), LABELS.length - 1)];
}

// Pointer: drag pans/tilts the camera through the sky.
export function bindPointer (canvas) {
  const pointer = { down: false, px: 0, py: 0 };
  canvas.addEventListener('pointerdown', (e) => {
    pointer.down = true;
    pointer.px = e.clientX;
    pointer.py = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointer.down) return;
    state.pan -= (e.clientX - pointer.px) * 0.002;
    state.tilt = Math.max(-0.4, Math.min(1.2, state.tilt + (e.clientY - pointer.py) * 0.002));
    pointer.px = e.clientX;
    pointer.py = e.clientY;
  });
  window.addEventListener('pointerup', () => { pointer.down = false; });
  return pointer;
}
