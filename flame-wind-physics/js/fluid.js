// Grid-based fire solver: stable-fluids velocity step (advect, forces,
// vorticity confinement, pressure projection) plus fuel/temperature
// transport and combustion.

import * as S from './shaders.js';
import { Program, createFBO, createDoubleFBO, makeBlit } from './gl.js';

export class FireSolver {
  constructor (gl, ext, config) {
    this.gl = gl;
    this.ext = ext;
    this.config = config;
    this.blit = makeBlit(gl);

    const p = (frag) => new Program(gl, S.baseVertex, frag);
    this.programs = {
      copy: p(S.copyFrag),
      clear: p(S.clearFrag),
      advection: p(S.advectionFrag),
      splat: p(S.splatFrag),
      forces: p(S.forcesFrag),
      combustion: p(S.combustionFrag),
      curl: p(S.curlFrag),
      vorticity: p(S.vorticityFrag),
      divergence: p(S.divergenceFrag),
      pressure: p(S.pressureFrag),
      gradient: p(S.gradientSubtractFrag),
      display: p(S.displayFrag),
    };

    this.initFramebuffers();
  }

  simRes () { return this.resolution(this.config.SIM_RESOLUTION); }

  resolution (base) {
    const gl = this.gl;
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(base);
    const max = Math.round(base * aspect);
    return gl.drawingBufferWidth > gl.drawingBufferHeight
      ? { width: max, height: min }
      : { width: min, height: max };
  }

  initFramebuffers () {
    const { gl, ext } = this;
    const sim = this.simRes();
    const texType = ext.halfFloatTexType;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filter = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    const mk = (fmt) => createDoubleFBO(gl, sim.width, sim.height, fmt.internalFormat, fmt.format, texType, filter);
    this.velocity = mk(rg);
    this.pressure = mk(r);
    this.temperature = mk(r);
    this.fuel = mk(r);
    this.density = mk(r);
    // single FBOs reused per-frame
    this.curl = createFBO(gl, sim.width, sim.height, r.internalFormat, r.format, texType, gl.NEAREST);
    this.divergence = createFBO(gl, sim.width, sim.height, r.internalFormat, r.format, texType, gl.NEAREST);
  }

  splat (target, x, y, dx, dy, dz, radius) {
    const { gl, programs, blit } = this;
    const prog = programs.splat;
    prog.bind();
    gl.uniform1i(prog.uniforms.uTarget, target.read.attach(0));
    gl.uniform1f(prog.uniforms.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
    gl.uniform2f(prog.uniforms.point, x, y);
    gl.uniform3f(prog.uniforms.color, dx, dy, dz);
    gl.uniform1f(prog.uniforms.radius, radius);
    blit(target.write);
    target.swap();
  }

  // inject fuel + heat + smoke + upward kick at a point
  ignite (x, y, power, radius) {
    this.splat(this.fuel, x, y, power, 0, 0, radius);
    this.splat(this.temperature, x, y, power * 0.8, 0, 0, radius);
    this.splat(this.density, x, y, power * 0.35, 0, 0, radius * 2.2);
    this.splat(this.velocity, x, y, 0, power * 18.0, 0, radius);
  }

  stir (x, y, dx, dy) {
    this.splat(this.velocity, x, y, dx, dy, 0, this.config.SPLAT_RADIUS / 100);
  }

  step (dt, windX, time) {
    const { gl, programs, blit, config } = this;
    gl.disable(gl.BLEND);
    const texel = [this.velocity.texelSizeX, this.velocity.texelSizeY];

    // advect velocity
    const adv = programs.advection;
    adv.bind();
    gl.uniform2f(adv.uniforms.texelSize, texel[0], texel[1]);
    let velId = this.velocity.read.attach(0);
    gl.uniform1i(adv.uniforms.uVelocity, velId);
    gl.uniform1i(adv.uniforms.uSource, velId);
    gl.uniform1f(adv.uniforms.dt, dt);
    gl.uniform1f(adv.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(this.velocity.write);
    this.velocity.swap();

    // advect scalar fields
    for (const [field, diss] of [
      [this.temperature, config.TEMPERATURE_DISSIPATION],
      [this.fuel, config.FUEL_DISSIPATION],
      [this.density, config.DENSITY_DISSIPATION],
    ]) {
      gl.uniform1i(adv.uniforms.uVelocity, this.velocity.read.attach(0));
      gl.uniform1i(adv.uniforms.uSource, field.read.attach(1));
      gl.uniform1f(adv.uniforms.dissipation, diss);
      blit(field.write);
      field.swap();
    }

    // buoyancy + wind
    const f = programs.forces;
    f.bind();
    gl.uniform1i(f.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(f.uniforms.uTemperature, this.temperature.read.attach(1));
    gl.uniform1f(f.uniforms.dt, dt);
    gl.uniform1f(f.uniforms.buoyancy, config.BUOYANCY);
    gl.uniform1f(f.uniforms.wind, windX);
    gl.uniform1f(f.uniforms.turbulence, config.TURBULENCE);
    gl.uniform1f(f.uniforms.time, time);
    blit(this.velocity.write);
    this.velocity.swap();

    // combustion
    const c = programs.combustion;
    c.bind();
    gl.uniform1i(c.uniforms.uTemperature, this.temperature.read.attach(0));
    gl.uniform1i(c.uniforms.uFuel, this.fuel.read.attach(1));
    gl.uniform1f(c.uniforms.dt, dt);
    gl.uniform1f(c.uniforms.cooling, config.COOLING);
    blit(this.temperature.write);
    this.temperature.swap();

    // vorticity confinement
    const curlP = programs.curl;
    curlP.bind();
    gl.uniform2f(curlP.uniforms.texelSize, texel[0], texel[1]);
    gl.uniform1i(curlP.uniforms.uVelocity, this.velocity.read.attach(0));
    blit(this.curl);

    const vort = programs.vorticity;
    vort.bind();
    gl.uniform2f(vort.uniforms.texelSize, texel[0], texel[1]);
    gl.uniform1i(vort.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(vort.uniforms.uCurl, this.curl.attach(1));
    gl.uniform1f(vort.uniforms.curl, config.CURL);
    gl.uniform1f(vort.uniforms.dt, dt);
    blit(this.velocity.write);
    this.velocity.swap();

    // projection
    const div = programs.divergence;
    div.bind();
    gl.uniform2f(div.uniforms.texelSize, texel[0], texel[1]);
    gl.uniform1i(div.uniforms.uVelocity, this.velocity.read.attach(0));
    blit(this.divergence);

    const clear = programs.clear;
    clear.bind();
    gl.uniform1i(clear.uniforms.uTexture, this.pressure.read.attach(0));
    gl.uniform1f(clear.uniforms.value, config.PRESSURE_DISSIPATION);
    blit(this.pressure.write);
    this.pressure.swap();

    const pr = programs.pressure;
    pr.bind();
    gl.uniform2f(pr.uniforms.texelSize, texel[0], texel[1]);
    gl.uniform1i(pr.uniforms.uDivergence, this.divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pr.uniforms.uPressure, this.pressure.read.attach(1));
      blit(this.pressure.write);
      this.pressure.swap();
    }

    const grad = programs.gradient;
    grad.bind();
    gl.uniform2f(grad.uniforms.texelSize, texel[0], texel[1]);
    gl.uniform1i(grad.uniforms.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(grad.uniforms.uVelocity, this.velocity.read.attach(1));
    blit(this.velocity.write);
    this.velocity.swap();
  }

  render () {
    const { gl, programs, blit } = this;
    const d = programs.display;
    d.bind();
    gl.uniform1i(d.uniforms.uTemperature, this.temperature.read.attach(0));
    gl.uniform1i(d.uniforms.uFuel, this.fuel.read.attach(1));
    gl.uniform1i(d.uniforms.uDensity, this.density.read.attach(2));
    blit(null);
  }
}
