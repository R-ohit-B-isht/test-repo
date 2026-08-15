// BOREAL — real-time aurora borealis playground.
// Volume raymarch adapted from nimitz's "Auroras" (shadertoy XtGGRt, CC BY-NC-SA 3.0).

import { state, DEV_MODE, PRESETS } from './config.js';
import { getWebGLContext } from './gl.js';
import { AuroraRenderer } from './aurora.js';
import { bindControls, bindPointer, updateActivityMeter, applyPreset } from './ui.js';

const canvas = document.getElementById('fluid');

function resizeCanvas () {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}
resizeCanvas();

const glCtx = getWebGLContext(canvas);
if (!glCtx) {
  document.getElementById('nogl').hidden = false;
  throw new Error('WebGL unsupported');
}
const { gl } = glCtx;
const renderer = new AuroraRenderer(gl);
bindPointer(canvas);
bindControls();

if (DEV_MODE) {
  // dev cheat: jump straight to the solar-storm preset for instant visual check
  applyPreset(PRESETS.storm, 'storm');
}

window.addEventListener('resize', resizeCanvas);

let last = performance.now();
let time = 0;

function frame (now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  time += dt;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  renderer.render(time, state);
  updateActivityMeter();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
