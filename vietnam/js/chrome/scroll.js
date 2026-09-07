import { $, $$, html } from '../dom.js';

// Scroll chrome: progress bar, section rail + top nav current state, reveal-on-scroll.

const SECTIONS = ['hero', 'route', 'days', 'picker', 'budget', 'checklist', 'sources'];

export function mountScroll() {
  const bar = $('#progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#rail').innerHTML = SECTIONS.map((id) => html`<a href="#${id}" aria-label="Go to ${id}"></a>`).join('');
  const setCurrent = (id) => {
    $$('#rail a, .topnav a').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === `#${id}` ? 'true' : 'false'));
  };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  SECTIONS.forEach((id) => spy.observe($(`#${id}`)));

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => reveal.observe(el));
}
