// Simulation parameters. Tuned against reference values from
// andrewkchan/fire-simulation and PavelDoGreat/WebGL-Fluid-Simulation
// (whose dat.GUI exposes sim resolution, diffusion, pressure, vorticity,
// splat radius and bloom — mirrored and extended here).
export const config = {
  SIM_RESOLUTION: 192,
  VELOCITY_DISSIPATION: 0.985,
  TEMPERATURE_DISSIPATION: 0.985,
  FUEL_DISSIPATION: 0.955,
  DENSITY_DISSIPATION: 0.975,
  PRESSURE_DISSIPATION: 0.8,
  PRESSURE_ITERATIONS: 20,
  BUOYANCY: 75.0,
  COOLING: 1.4,
  CURL: 18,
  TURBULENCE: 16.0,
  SPLAT_RADIUS: 0.7,
};

// Runtime UI state (sliders / toggles).
export const state = {
  // wind
  wind: 0,        // -1..1 base wind
  gust: 0.4,      // 0..1 gust amount
  // fire sources
  sourceCount: 3,
  sourceSpread: 0.52,  // fraction of width the sources occupy
  sourceSize: 1.0,     // radius multiplier
  fuelPower: 0.65,     // intensity
  flicker: 0.5,        // positional jitter 0..1
  // smoke
  smokeAmount: 1.0,    // emission multiplier 0..2
  smokeOpacity: 1.0,   // display opacity 0..2
  smokeWarmth: 0.35,   // 0 cool grey .. 1 warm brown
  // render
  glow: 1.0,           // fire brightness gain
  embers: true,
  storm: false,
};

// Named presets — one-tap physics/looks (peak-moment states).
export const PRESETS = {
  campfire: {
    wind: 0.05, gust: 0.3, sourceCount: 1, sourceSpread: 0.2, sourceSize: 1.4,
    fuelPower: 0.8, flicker: 0.6, smokeAmount: 1.1, smokeOpacity: 1.0, smokeWarmth: 0.5,
    glow: 1.0, storm: false,
    cfg: { BUOYANCY: 70, CURL: 14, COOLING: 1.5, TURBULENCE: 10 },
  },
  torches: {
    wind: 0.1, gust: 0.25, sourceCount: 5, sourceSpread: 0.72, sourceSize: 0.6,
    fuelPower: 0.55, flicker: 0.35, smokeAmount: 0.5, smokeOpacity: 0.6, smokeWarmth: 0.3,
    glow: 1.15, storm: false,
    cfg: { BUOYANCY: 90, CURL: 20, COOLING: 1.9, TURBULENCE: 12 },
  },
  inferno: {
    wind: 0.2, gust: 0.5, sourceCount: 7, sourceSpread: 0.9, sourceSize: 1.3,
    fuelPower: 1.0, flicker: 0.8, smokeAmount: 1.5, smokeOpacity: 1.2, smokeWarmth: 0.55,
    glow: 1.3, storm: false,
    cfg: { BUOYANCY: 95, CURL: 26, COOLING: 1.1, TURBULENCE: 22 },
  },
  storm: {
    wind: 0.55, gust: 0.85, sourceCount: 3, sourceSpread: 0.55, sourceSize: 1.0,
    fuelPower: 0.75, flicker: 0.7, smokeAmount: 1.2, smokeOpacity: 1.0, smokeWarmth: 0.35,
    glow: 1.1, storm: true,
    cfg: { BUOYANCY: 65, CURL: 22, COOLING: 1.3, TURBULENCE: 26 },
  },
  smoulder: {
    wind: 0.08, gust: 0.35, sourceCount: 2, sourceSpread: 0.35, sourceSize: 1.1,
    fuelPower: 0.35, flicker: 0.4, smokeAmount: 2.0, smokeOpacity: 1.8, smokeWarmth: 0.2,
    glow: 0.75, storm: false,
    cfg: { BUOYANCY: 45, CURL: 12, COOLING: 2.2, TURBULENCE: 8 },
  },
};

// dev mode: ?dev=1 preloads an interesting demo state
export const DEV_MODE = new URLSearchParams(location.search).has('dev');
