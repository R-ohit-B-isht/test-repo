// Runtime state for the aurora renderer (all values are live uniforms).
export const state = {
  brightness: 1.0,   // emission gain
  scale: 2.5,        // band/noise scale (bigger = finer bands)
  speed: 0.06,       // ripple animation speed
  detail: 1.0,       // small-scale trail turbulence
  height: 1.0,       // curtain height stretch
  hueShift: 0.0,     // 0 = classic green->purple
  saturation: 1.0,
  stars: 1.0,        // star brightness
  reflection: 1.0,   // water reflection strength (0 = land horizon)
  tilt: 0.2,         // camera pitch
  pan: 0.0,          // camera yaw
  drift: 0.2,        // auto camera sway
  fov: 1.3,
};

// Named presets — one-tap sky states.
export const PRESETS = {
  quiet: {
    brightness: 0.7, scale: 2.0, speed: 0.03, detail: 0.8, height: 0.8,
    hueShift: 0.0, saturation: 0.9, stars: 1.2, reflection: 0.8,
    tilt: 0.15, drift: 0.1, fov: 1.3,
  },
  curtains: {
    brightness: 1.0, scale: 2.5, speed: 0.06, detail: 1.0, height: 1.2,
    hueShift: 0.0, saturation: 1.0, stars: 1.0, reflection: 1.0,
    tilt: 0.25, drift: 0.2, fov: 1.2,
  },
  storm: {
    brightness: 1.5, scale: 3.4, speed: 0.22, detail: 1.5, height: 1.5,
    hueShift: 0.25, saturation: 1.15, stars: 0.7, reflection: 1.2,
    tilt: 0.35, drift: 0.45, fov: 1.1,
  },
  dawn: {
    brightness: 1.1, scale: 2.2, speed: 0.08, detail: 0.9, height: 1.0,
    hueShift: 1.15, saturation: 1.05, stars: 0.5, reflection: 0.9,
    tilt: 0.2, drift: 0.15, fov: 1.35,
  },
  moonless: {
    brightness: 0.45, scale: 1.8, speed: 0.04, detail: 0.7, height: 0.9,
    hueShift: -0.35, saturation: 0.85, stars: 1.5, reflection: 0.5,
    tilt: 0.3, drift: 0.08, fov: 1.5,
  },
};

// dev mode: ?dev=1 preloads the solar-storm demo state
export const DEV_MODE = new URLSearchParams(location.search).has('dev');
