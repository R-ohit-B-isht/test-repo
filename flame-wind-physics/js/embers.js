// Lightweight 2D-canvas ember sparks layered over the GPU fire.
// Embers are light particles: strong wind coupling, weak gravity, twinkle.

export class EmberField {
  constructor (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.max = 180;
    this.resize();
  }

  resize () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn (x, y, heat = 1) {
    if (this.particles.length >= this.max) return;
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 40,
      vy: -60 - Math.random() * 120 * heat,
      life: 1,
      decay: 0.25 + Math.random() * 0.35,
      r: 0.8 + Math.random() * 1.6,
      tw: Math.random() * Math.PI * 2,
    });
  }

  step (dt, wind) {
    const W = this.canvas.width, H = this.canvas.height;
    const wpx = wind * 160;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx += (wpx * (0.4 + 0.6 * (1 - p.y / H)) - p.vx) * 1.6 * dt;
      p.vy += (-40 - p.vy) * 0.7 * dt + 20 * dt;
      p.tw += dt * 11;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0 || p.y < -20 || p.x < -40 || p.x > W + 40) this.particles.splice(i, 1);
    }
  }

  render () {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const tw = 0.55 + 0.45 * Math.sin(p.tw);
      const a = p.life * tw;
      ctx.fillStyle = `rgba(255,${(170 + tw * 70) | 0},90,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,220,160,${a * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
