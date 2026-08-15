// GLSL sources for the fire/fluid solver.
// Fluid solver shaders adapted from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT).
// Combustion / blackbody technique after Nguyen et al. and andrewkchan/fire-simulation.

export const baseVertex = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const copyFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
void main () { gl_FragColor = texture2D(uTexture, vUv); }`;

export const clearFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

export const advectionFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
  gl_FragColor.a = 1.0;
}`;

export const splatFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

// Buoyancy (hot air rises) + wind body force.
// Wind: horizontal base flow with vertical shear profile (weaker near the
// ground due to drag) plus procedural turbulence that swirls the flow.
export const forcesFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uTemperature;
uniform float dt;
uniform float buoyancy;
uniform float wind;
uniform float turbulence;
uniform float time;

float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise (vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm (vec2 p) {
  return 0.55 * noise(p) + 0.28 * noise(p * 2.13 + 17.0) + 0.17 * noise(p * 4.41 + 47.0);
}

void main () {
  vec2 vel = texture2D(uVelocity, vUv).xy;
  float temp = texture2D(uTemperature, vUv).x;
  // thermal buoyancy
  vel.y += dt * buoyancy * temp;
  // wind shear profile: stronger higher above the ground
  float shear = 0.45 + 0.55 * smoothstep(0.0, 0.6, vUv.y);
  float gust = fbm(vec2(time * 0.35, vUv.y * 2.0)) * 2.0 - 1.0;
  float wx = wind * shear * (1.0 + 0.55 * gust);
  // spatial turbulence: divergence-ish swirls advected with time
  vec2 tp = vUv * 6.0 + vec2(time * 0.6, -time * 0.22);
  vec2 turb = vec2(fbm(tp) - 0.5, fbm(tp + 31.7) - 0.5) * turbulence * shear;
  vel += dt * (vec2(wx, 0.0) + turb);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`;

// Combustion: fuel sustains temperature at burn point; heat radiates away
// following Stefan-Boltzmann (T^4) cooling. (After andrewkchan/fire-simulation.)
export const combustionFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTemperature;
uniform sampler2D uFuel;
uniform float dt;
uniform float cooling;
void main () {
  float temp = texture2D(uTemperature, vUv).x;
  float fuel = texture2D(uFuel, vUv).x;
  temp = max(0.0, temp - dt * cooling * pow(max(temp, 0.0), 4.0));
  temp = max(temp, min(fuel, 1.0));
  gl_FragColor = vec4(temp, 0.0, 0.0, 1.0);
}`;

export const curlFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

export const vorticityFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

export const divergenceFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

export const pressureFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

export const gradientSubtractFrag = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

// Display: map temperature through the Planckian (blackbody) locus,
// modulate by fuel visibility, add faint smoke from the density field.
export const displayFrag = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTemperature;
uniform sampler2D uFuel;
uniform sampler2D uDensity;

vec3 blackbody (float t) {
  t *= 3000.0;
  float cx = (0.860117757 + 1.54118254e-4 * t + 1.28641212e-7 * t * t)
           / (1.0 + 8.42420235e-4 * t + 7.08145163e-7 * t * t);
  float cy = (0.317398726 + 4.22806245e-5 * t + 4.20481691e-8 * t * t)
           / (1.0 - 2.89741816e-5 * t + 1.61456053e-7 * t * t);
  float d = 2.0 * cx - 8.0 * cy + 4.0;
  vec3 XYZ = vec3(3.0 * cx / d, 2.0 * cy / d, 1.0 - (3.0 * cx + 2.0 * cy) / d);
  vec3 RGB = mat3(3.240479, -0.969256, 0.055648,
                  -1.537150, 1.875992, -0.204043,
                  -0.498535, 0.041556, 1.057311)
           * vec3(XYZ.x / XYZ.y, 1.0, XYZ.z / XYZ.y);
  return max(RGB, 0.0) * pow(t * 0.0004, 4.0);
}

void main () {
  float temp = texture2D(uTemperature, vUv).x;
  float fuel = texture2D(uFuel, vUv).x;
  float smoke = texture2D(uDensity, vUv).x;
  float e = exp(-20.0 * max(fuel, 0.0));
  float visibility = ((1.0 - e) / (1.0 + e)) * 0.65 + 0.35;
  vec3 fire = visibility * blackbody(clamp(temp, 0.0, 1.2));
  vec3 smokeCol = vec3(0.23, 0.22, 0.24) * clamp(smoke, 0.0, 1.0) * (1.0 - clamp(temp * 2.0, 0.0, 1.0));
  vec3 col = fire + smokeCol + vec3(0.0035, 0.004, 0.008);
  // filmic-ish tonemap
  col = col / (1.0 + col);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(col, 1.0);
}`;
