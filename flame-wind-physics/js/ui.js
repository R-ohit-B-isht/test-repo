// Control-panel bindings, presets and pointer interaction.

import { config, state, PRESETS } from './config.js';
import { windLabel } from './wind.js';

const $ = (id) => document.getElementById(id);

// slider spec: id → { get/set into state or config, display formatting }
const SLIDERS = {
  wind:    { get: () => state.wind * 100, set: (v) => { state.wind = v / 100; }, fmt: (v) => (v / 10).toFixed(1) },
  gust:    { get: () => state.gust * 100, set: (v) => { state.gust = v / 100; } },
  srcCount:  { get: () => state.sourceCount, set: (v) => { state.sourceCount = v; } },
  srcSpread: { get: () => state.sourceSpread * 100, set: (v) => { state.sourceSpread = v / 100; } },
  srcSize:   { get: () => state.sourceSize * 100, set: (v) => { state.sourceSize = v / 100; } },
  fuel:    { get: () => state.fuelPower * 100, set: (v) => { state.fuelPower = v / 100; } },
  flicker: { get: () => state.flicker * 100, set: (v) => { state.flicker = v / 100; } },
  buoy:    { get: () => config.BUOYANCY, set: (v) => { config.BUOYANCY = v; } },
  vort:    { get: () => config.CURL, set: (v) => { config.CURL = v; } },
  turb:    { get: () => config.TURBULENCE, set: (v) => { config.TURBULENCE = v; } },
  cool:    { get: () => config.COOLING / 1.4 * 55, set: (v) => { config.COOLING = v / 55 * 1.4; } },
  press:   { get: () => config.PRESSURE_DISSIPATION * 100, set: (v) => { config.PRESSURE_DISSIPATION = v / 100; } },
  iters:   { get: () => config.PRESSURE_ITERATIONS, set: (v) => { config.PRESSURE_ITERATIONS = v; } },
  drag:    { get: () => (1 - config.VELOCITY_DISSIPATION) * 1000, set: (v) => { config.VELOCITY_DISSIPATION = 1 - v / 1000; } },
  smokeAmt: { get: () => state.smokeAmount * 100, set: (v) => { state.smokeAmount = v / 100; } },
  smokeOp:  { get: () => state.smokeOpacity * 100, set: (v) => { state.smokeOpacity = v / 100; } },
  smokeLife: { get: () => (config.DENSITY_DISSIPATION - 0.9) * 1000, set: (v) => { config.DENSITY_DISSIPATION = 0.9 + v / 1000; } },
  smokeWarm: { get: () => state.smokeWarmth * 100, set: (v) => { state.smokeWarmth = v / 100; } },
  glow:    { get: () => state.glow * 100, set: (v) => { state.glow = v / 100; } },
};

function syncSlider (id) {
  const spec = SLIDERS[id];
  const el = $(id);
  el.value = spec.get();
  $(id + 'Val').textContent = (spec.fmt || ((v) => Math.round(v)))(Number(el.value));
}

export function bindControls () {
  for (const [id, spec] of Object.entries(SLIDERS)) {
    $(id).addEventListener('input', (e) => {
      const v = Number(e.target.value);
      spec.set(v);
      $(id + 'Val').textContent = (spec.fmt || ((x) => Math.round(x)))(v);
    });
    syncSlider(id);
  }

  const toggle = (id, fn) => {
    $(id).addEventListener('click', (e) => {
      const on = fn();
      e.target.classList.toggle('active', on);
      e.target.setAttribute('aria-pressed', String(on));
    });
  };
  toggle('btnEmbers', () => (state.embers = !state.embers));
  toggle('btnStorm', () => (state.storm = !state.storm));

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

// Apply a named preset: copy state fields + config overrides, resync UI.
export function applyPreset (preset, name) {
  for (const [k, v] of Object.entries(preset)) {
    if (k === 'cfg') Object.assign(config, v);
    else state[k] = v;
  }
  for (const id of Object.keys(SLIDERS)) syncSlider(id);
  const storm = $('btnStorm');
  storm.classList.toggle('active', state.storm);
  storm.setAttribute('aria-pressed', String(state.storm));
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.id === 'preset-' + name);
  });
}

export function updateWindMeter (wind) {
  const bar = $('windBar');
  const m = Math.min(Math.abs(wind) / 5, 1);
  bar.style.width = `${m * 50}%`;
  bar.classList.toggle('neg', wind < 0);
  $('windText').textContent = windLabel(wind);
}

// Pointer state: drag stirs the fluid, click ignites, shift-drag = pure wind.
export function bindPointer (canvas) {
  const pointer = { down: false, x: 0, y: 0, dx: 0, dy: 0, shift: false, ignite: false, moved: false };
  const pos = (e) => ({ x: e.clientX / window.innerWidth, y: 1 - e.clientY / window.innerHeight });

  canvas.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    Object.assign(pointer, { down: true, moved: false, shift: e.shiftKey, x: p.x, y: p.y, dx: 0, dy: 0 });
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointer.down) return;
    const p = pos(e);
    pointer.dx = (p.x - pointer.x) * 8;
    pointer.dy = (p.y - pointer.y) * 8;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.shift = e.shiftKey;
    if (Math.abs(pointer.dx) + Math.abs(pointer.dy) > 0.002) pointer.moved = true;
  });
  window.addEventListener('pointerup', () => {
    if (pointer.down && !pointer.moved) pointer.ignite = true;
    pointer.down = false;
  });
  return pointer;
}
