// PYRE — real-time 2D fire & wind physics.
// Fluid core adapted from PavelDoGreat/WebGL-Fluid-Simulation (MIT);
// combustion + blackbody rendering after andrewkchan/fire-simulation.

import { config, state, DEV_MODE, PRESETS } from './config.js';
import { getWebGLContext } from './gl.js';
import { FireSolver } from './fluid.js';
import { WindModel } from './wind.js';
import { EmberField } from './embers.js';
import { bindControls, bindPointer, updateWindMeter, applyPreset } from './ui.js';

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

// Fire sources along the ground, rebuilt from state each frame so the
// count / spread / size sliders take effect immediately.
function buildSources () {
  const n = state.sourceCount;
  const list = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = 0.5 + (t - 0.5) * state.sourceSpread;
    const center = 1 - Math.abs(t - 0.5) * 0.9;   // middle source burns bigger
    list.push({ x, y: 0.02, r: 0.0022 * state.sourceSize * center, s: 0.65 + 0.35 * center });
  }
  return list;
}

if (DEV_MODE) {
  // dev cheat: jump straight to the storm preset for instant visual check
  applyPreset(PRESETS.storm, 'storm');
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
  const sources = buildSources();
  for (const src of sources) {
    const jitter = (Math.random() - 0.5) * 0.04 * src.s * state.flicker;
    solver.ignite(
      src.x + jitter, src.y,
      state.fuelPower * src.s * 0.7,
      src.r * state.fuelPower,
      state.smokeAmount
    );
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
  solver.render(state);

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
