// Animate the first text node of an element from its previous value to `to`.
// Skipped entirely under prefers-reduced-motion.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function animateNumber(el, to, format, duration = 420) {
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const from = Number(el.dataset.prev ?? to);
  el.dataset.prev = String(to);
  if (reduced() || from === to) {
    node.textContent = format(to);
    return;
  }
  const t0 = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    node.textContent = format(from + (to - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
