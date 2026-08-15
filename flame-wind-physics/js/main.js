// PYRE — real-time 2D fire & wind physics.
// Fluid core adapted from PavelDoGreat/WebGL-Fluid-Simulation (MIT);
// combustion + blackbody rendering after andrewkchan/fire-simulation.

import { config, state, DEV_MODE } from './config.js';
import { getWebGLContext } from './gl.js';
import { FireSolver } from './fluid.js';
import { WindModel } from './wind.js';
import { EmberField } from './embers.js';
import { bindControls, bindPointer, updateWindMeter } from './ui.js';

const canvas = document.getElementById('fluid');
const emberCanvas = document.getElementById('embers');

function resizeCanvas () {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();

const glCtx = getWebGLContext(canvas);
if (!glCtx) {
  document.getElementById('nogl').hidden = false;
  throw new Error('WebGL unsupported');
}
const { gl, ext } = glCtx;
const solver = new FireSolver(gl, ext, config);
const windModel = new WindModel(state);
const embers = new EmberField(emberCanvas);
const pointer = bindPointer(canvas);
bindControls();

// Fire sources along the ground: a main pyre and two side burners.
const sources = [
  { x: 0.5, y: 0.02, r: 0.003, s: 1.0 },
  { x: 0.24, y: 0.02, r: 0.0012, s: 0.65 },
  { x: 0.76, y: 0.02, r: 0.0012, s: 0.65 },
];

if (DEV_MODE) {
  // dev cheat: strong wind + storm preset for instant visual check
  state.wind = 0.5;
  state.storm = true;
  document.getElementById('wind').value = 50;
  document.getElementById('windVal').textContent = '5.0';
  const storm = document.getElementById('btnStorm');
  storm.classList.add('active');
  storm.setAttribute('aria-pressed', 'true');
}

window.addEventListener('resize', () => {
  resizeCanvas();
  solver.initFramebuffers();
  embers.resize();
});

let last = performance.now();
let time = 0;
let emberClock = 0;

function frame (now) {
  const dt = Math.min((now - last) / 1000, 0.0166);
  last = now;
  time += dt;

  const wind = windModel.sample(time);

  // continuous fuel injection at sources
  for (const src of sources) {
    const jitter = (Math.random() - 0.5) * 0.02 * src.s;
    solver.ignite(src.x + jitter, src.y, state.fuelPower * src.s * 0.7, src.r * state.fuelPower);
  }

  // pointer interaction
  if (pointer.down && pointer.moved) {
    const k = pointer.shift ? 1.6 : 1.0;
    solver.stir(pointer.x, pointer.y, pointer.dx * k, pointer.dy * k);
  }
  if (pointer.ignite) {
    pointer.ignite = false;
    solver.ignite(pointer.x, pointer.y, 0.9, 0.002);
    for (let i = 0; i < 8; i++) {
      embers.spawn(pointer.x * innerWidth, (1 - pointer.y) * innerHeight, 1.2);
    }
  }

  solver.step(dt, wind * 85, time);
  solver.render();

  // embers spawn from sources, driven by the same wind
  emberClock += dt;
  if (state.embers && emberClock > 0.05) {
    emberClock = 0;
    const src = sources[(Math.random() * sources.length) | 0];
    embers.spawn(
      (src.x + (Math.random() - 0.5) * 0.06) * innerWidth,
      innerHeight - 30,
      src.s * state.fuelPower * 1.6
    );
  }
  embers.step(dt, wind);
  embers.render();

  updateWindMeter(wind);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
