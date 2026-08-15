// CPU-side wind model: slider base wind + fractal gust envelope + storm mode.
// Returns a signed scalar fed to the GPU forces pass each frame.

function hash (n) { return (Math.sin(n * 127.1) * 43758.5453) % 1; }
function noise1 (x) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = Math.abs(hash(i)), b = Math.abs(hash(i + 1));
  return a + (b - a) * u;
}
function fbm1 (x) {
  return 0.55 * noise1(x) + 0.28 * noise1(x * 2.17 + 13.7) + 0.17 * noise1(x * 4.31 + 41.3);
}

export class WindModel {
  constructor (state) {
    this.state = state;
    this.current = 0;
  }

  sample (t) {
    const s = this.state;
    // gusts: two fbm layers — slow weather cycle and faster gust cycle
    const gustEnv = (fbm1(t * 0.11) - 0.5) * 1.6 + (fbm1(t * 0.53 + 7.7) - 0.5) * 0.8;
    let target = s.wind * 3.0 + gustEnv * s.gust * 3.4;
    if (s.storm) {
      target += Math.sin(t * 0.4) * 1.6 + (fbm1(t * 0.23 + 99) - 0.5) * 6.0;
    }
    // inertia: air mass doesn't change speed instantly
    this.current += (target - this.current) * 0.04;
    return this.current;
  }
}

export function windLabel (w) {
  const m = Math.abs(w);
  if (m < 0.3) return 'calm';
  if (m < 1.2) return 'breeze';
  if (m < 2.6) return 'gusty';
  return 'storm';
}
