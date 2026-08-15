# PYRE — Real-time 2D Fire & Wind Physics

A static website that simulates fire the way it actually behaves: a GPU
Navier–Stokes fluid solver with combustion, thermal buoyancy, vorticity
confinement, blackbody radiation rendering, and a turbulent, gusty wind
model that bends and tears the flames.

## Run

Any static server works (ES modules require http):

```
python3 -m http.server 8000
# open http://localhost:8000/flame-wind-physics/
```

Dev mode: append `?dev=1` for an instant storm/wind demo preset.

## Interactions

- **Drag** — stir the air (velocity splats into the fluid)
- **Click** — ignite a fuel pocket
- **Shift + drag** — stronger pure-wind strokes
- Panel sliders — wind strength, gustiness, fuel, vorticity, cooling
- **Storm** toggle — chaotic high-wind weather cycle

## Physics

- Stable-fluids velocity step: semi-Lagrangian advection → buoyancy +
  wind body force → vorticity confinement → pressure projection (Jacobi)
- Fuel & temperature fields advected with the flow; combustion keeps
  temperature at the burn point where fuel exists; Stefan–Boltzmann
  (T⁴) radiative cooling
- Wind: base flow with vertical shear profile, fractal-noise gust
  envelope with air-mass inertia, spatial turbulence in the force pass
- Display: temperature mapped through the Planckian (blackbody) locus,
  filmic tonemap; light ember sparks ride the same wind field

## Sources & attribution

- Fluid solver core adapted from
  [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
  (MIT © 2017 Pavel Dobryakov) — see `LICENSE`.
- Combustion / blackbody technique studied from
  [andrewkchan/fire-simulation](https://github.com/andrewkchan/fire-simulation)
  and GPU Gems' "Fast Fluid Dynamics Simulation on the GPU".
