import { $, $$, html } from '../dom.js';

// Scroll chrome: progress bar, section rail (only when a page has more than one
// section), reveal-on-scroll. Sections are whatever <main> holds on this page.

export function mountScroll() {
  const bar = $('#progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const sections = $$('main > section[id]');
  const rail = $('#rail');
  if (rail && sections.length > 1) {
    rail.innerHTML = sections.map((s) => html`<a href="#${s.id}" aria-label="Go to ${s.id}"></a>`).join('');
    const setCurrent = (id) => $$('a', rail).forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === `#${id}` ? 'true' : 'false'));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => spy.observe(s));
  } else if (rail) rail.hidden = true;

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => reveal.observe(el));
}
