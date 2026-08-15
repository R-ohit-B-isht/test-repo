// Aurora borealis renderer — single-pass raymarched volume.
// Adapted from "Auroras" by nimitz 2017 (https://www.shadertoy.com/view/XtGGRt),
// CC BY-NC-SA 3.0; stars hash from Dave_Hoskins (shadertoy 4djSRW).
// Parameterised with runtime uniforms for the control panel.

import { Program } from './gl.js';

const vert = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const frag = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uBrightness;   // aurora emission gain
uniform float uScale;        // band/noise scale
uniform float uSpeed;        // ripple animation speed
uniform float uDetail;       // small-scale trail turbulence
uniform float uHueShift;     // shifts the green->purple palette
uniform float uSaturation;
uniform float uHeight;       // curtain height stretch
uniform float uStars;        // star brightness
uniform float uReflection;   // water reflection strength (0 = land)
uniform float uTilt;         // camera pitch
uniform float uPan;          // camera yaw
uniform float uDrift;        // auto camera sway amount
uniform float uFov;

mat2 mm2 (in float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);
float tri (in float x) { return clamp(abs(fract(x) - 0.5), 0.01, 0.49); }
vec2 tri2 (in vec2 p) { return vec2(tri(p.x) + tri(p.y), tri(p.y + tri(p.x))); }

float triNoise2d (in vec2 p, float spd) {
  float z = 1.8 / uBrightness;
  float z2 = uScale;
  float rz = 0.0;
  p *= mm2(p.x * 0.06);
  vec2 bp = p;
  for (float i = 0.0; i < 5.0; i++) {
    vec2 dg = tri2(bp * 1.85) * 0.75 * uDetail;
    dg *= mm2(uTime * spd);
    p -= dg / z2;
    bp *= 1.3;
    z2 *= 0.45;
    z *= 0.42;
    p *= 1.21 + (rz - 1.0) * 0.02;
    rz += tri(p.x + tri(p.y)) * z;
    p *= -m2;
  }
  return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
}

float hash21 (in vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

vec3 palette (float i) {
  vec3 c = sin(1.0 - vec3(2.15, -0.5, 1.2) + uHueShift + i * 0.043) * 0.5 + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, uSaturation);
}

vec4 aurora (vec3 ro, vec3 rd) {
  vec4 col = vec4(0.0);
  vec4 avgCol = vec4(0.0);
  for (float i = 0.0; i < 50.0; i++) {
    float of = 0.006 * hash21(gl_FragCoord.xy) * smoothstep(0.0, 15.0, i);
    float pt = ((0.8 + pow(i, 1.4) * 0.002 * uHeight) - ro.y) / (rd.y * 2.0 + 0.4);
    pt -= of;
    vec3 bpos = ro + pt * rd;
    float rzt = triNoise2d(bpos.zx, uSpeed);
    vec4 col2 = vec4(0.0, 0.0, 0.0, rzt);
    col2.rgb = palette(i) * rzt;
    avgCol = mix(avgCol, col2, 0.5);
    col += avgCol * exp2(-i * 0.065 - 2.5) * smoothstep(0.0, 5.0, i);
  }
  col *= clamp(rd.y * 15.0 + 0.4, 0.0, 1.0);
  return col * 1.8;
}

// stars hash from Dave_Hoskins (https://www.shadertoy.com/view/4djSRW)
vec3 hash33 (vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.27);
  return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
}

vec3 stars (in vec3 p) {
  vec3 c = vec3(0.0);
  float res = uRes.x;
  for (float i = 0.0; i < 4.0; i++) {
    vec3 q = fract(p * (0.15 * res)) - 0.5;
    vec3 id = floor(p * (0.15 * res));
    vec2 rn = hash33(id).xy;
    float c2 = 1.0 - smoothstep(0.0, 0.6, length(q));
    c2 *= step(rn.x, 0.0005 + i * i * 0.001);
    c += c2 * (mix(vec3(1.0, 0.49, 0.1), vec3(0.75, 0.9, 1.0), rn.y) * 0.1 + 0.9);
    p *= 1.3;
  }
  return c * c * 0.8;
}

vec3 bg (in vec3 rd) {
  float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd) * 0.5 + 0.5;
  sd = pow(sd, 5.0);
  vec3 col = mix(vec3(0.05, 0.1, 0.2), vec3(0.1, 0.05, 0.2), sd);
  return col * 0.63;
}

void main () {
  vec2 p = vUv - 0.5;
  p.x *= uRes.x / uRes.y;
  vec3 ro = vec3(0.0, 0.0, -6.7);
  vec3 rd = normalize(vec3(p, uFov));
  rd.yz *= mm2(uTilt);
  rd.xz *= mm2(uPan + sin(uTime * 0.05) * uDrift);

  vec3 col = vec3(0.0);
  float fade = smoothstep(0.0, 0.01, abs(rd.y)) * 0.1 + 0.9;
  col = bg(rd) * fade;

  if (rd.y > 0.0) {
    vec4 aur = smoothstep(0.0, 1.5, aurora(ro, rd)) * fade;
    col += stars(rd) * uStars;
    col = col * (1.0 - aur.a) + aur.rgb;
  } else {
    rd.y = abs(rd.y);
    col = bg(rd) * fade * 0.6;
    vec4 aur = smoothstep(0.0, 2.5, aurora(ro, rd)) * uReflection;
    col += stars(rd) * uStars * 0.3;
    col = col * (1.0 - aur.a) + aur.rgb;
    vec3 pos = ro + ((0.5 - ro.y) / rd.y) * rd;
    float nz2 = triNoise2d(pos.xz * vec2(0.5, 0.7), 0.0);
    col += mix(vec3(0.2, 0.25, 0.5) * 0.08, vec3(0.3, 0.3, 0.5) * 0.7, nz2 * 0.4) * uReflection;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class AuroraRenderer {
  constructor (gl) {
    this.gl = gl;
    this.program = new Program(gl, vert, frag);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const elems = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elems);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
  }

  render (time, s) {
    const { gl, program } = this;
    program.bind();
    const u = program.uniforms;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uBrightness, s.brightness);
    gl.uniform1f(u.uScale, s.scale);
    gl.uniform1f(u.uSpeed, s.speed);
    gl.uniform1f(u.uDetail, s.detail);
    gl.uniform1f(u.uHueShift, s.hueShift);
    gl.uniform1f(u.uSaturation, s.saturation);
    gl.uniform1f(u.uHeight, s.height);
    gl.uniform1f(u.uStars, s.stars);
    gl.uniform1f(u.uReflection, s.reflection);
    gl.uniform1f(u.uTilt, s.tilt);
    gl.uniform1f(u.uPan, s.pan);
    gl.uniform1f(u.uDrift, s.drift);
    gl.uniform1f(u.uFov, s.fov);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}
