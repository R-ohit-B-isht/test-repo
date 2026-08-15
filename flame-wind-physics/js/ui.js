// Control-panel bindings and pointer interaction.

import { config, state } from './config.js';
import { windLabel } from './wind.js';

const $ = (id) => document.getElementById(id);

export function bindControls () {
  const bind = (id, valId, fn, fmt = (v) => v) => {
    $(id).addEventListener('input', (e) => {
      fn(Number(e.target.value));
      $(valId).textContent = fmt(e.target.value);
    });
  };
  bind('wind', 'windVal', (v) => { state.wind = v / 100; }, (v) => (v / 10).toFixed(1));
  bind('gust', 'gustVal', (v) => { state.gust = v / 100; });
  bind('fuel', 'fuelVal', (v) => { state.fuelPower = v / 100; });
  bind('vort', 'vortVal', (v) => { config.CURL = v; });
  bind('cool', 'coolVal', (v) => { config.COOLING = v / 55 * 1.4; });

  $('btnEmbers').addEventListener('click', (e) => {
    state.embers = !state.embers;
    e.target.classList.toggle('active', state.embers);
  });
  $('btnStorm').addEventListener('click', (e) => {
    state.storm = !state.storm;
    e.target.classList.toggle('active', state.storm);
  });
  $('panelToggle').addEventListener('click', () => $('panel').classList.toggle('collapsed'));
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
