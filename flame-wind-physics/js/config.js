// Simulation parameters. Tuned against reference values from
// andrewkchan/fire-simulation and PavelDoGreat/WebGL-Fluid-Simulation.
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
  wind: 0,        // -1..1 base wind
  gust: 0.4,      // 0..1 gust amount
  fuelPower: 0.65,
  embers: true,
  storm: false,
};

// dev mode: ?dev=1 preloads an interesting demo state
export const DEV_MODE = new URLSearchParams(location.search).has('dev');
