# BOREAL — Real-time Aurora Borealis Playground

A raymarched aurora borealis rendered in a single WebGL pass, with a full
control surface for experimenting with the look of the sky.

Open `index.html` via any static server (ES modules require http://).

## Technique

- **Volume raymarch** — 50 samples per ray with polynomially increasing
  stride, sample dithering and blending to remove banding.
- **Band noise** — layered rotated triangle-wave noise (`triNoise2d`)
  produces the large curtain bands and small trail turbulence, animated by
  rotating the domain-warp offsets over time.
- **Palette** — per-sample sinusoidal palette (classic green → violet with
  altitude), with runtime hue shift and saturation controls.
- **Stars** — multi-octave hashed point stars; **water reflection** — the
  lower hemisphere re-marches the volume with a fade plus a noise-lit sea.

## Controls

- **Presets** — quiet arc, curtains, solar storm, polar dawn, moonless
- **Aurora** — brightness, band scale, ripple speed, turbulence, curtain height
- **Colour** — hue shift, saturation
- **Sky & ground** — star brightness, water reflection strength
- **Camera** — tilt, drift (auto sway), field of view; drag the sky to look around

On mobile the panel becomes a bottom sheet with touch-sized controls.
`?dev=1` jumps straight to the solar-storm preset.

## Sources & attribution

- Aurora volume march and band noise adapted from **"Auroras" by nimitz**
  (https://www.shadertoy.com/view/XtGGRt), CC BY-NC-SA 3.0.
- Star hash from **Dave_Hoskins** (https://www.shadertoy.com/view/4djSRW).
- WebGL context/program helpers adapted from
  **PavelDoGreat/WebGL-Fluid-Simulation** (MIT).
