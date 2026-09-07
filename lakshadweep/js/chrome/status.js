// Live IST clock, scroll-progress hairline, rail + topnav active state, scroll reveal.
import { $, $$ } from '../dom.js';

const IST = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

export function mountClock() {
  const el = $('#clock');
  const tick = () => {
    const now = new Date();
    el.textContent = `${IST.format(now)} IST`;
    el.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 1000);
}

export function mountProgress() {
  const bar = $('#progress-bar');
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}

export function mountRail() {
  const links = [...$$('.rail a'), ...$$('.topnav a')];
  const targets = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    const hit = entries.find((e) => e.isIntersecting);
    if (!hit) return;
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${hit.target.id}`));
  }, { rootMargin: '-40% 0px -55% 0px' });
  targets.forEach((t) => io.observe(t));
}

export function mountReveal() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
}
