import { movableOf } from '../plan.js';
import { preview, shortest } from '../route.js';

// Order strip controller: up / down buttons, shortest-route and auto buttons,
// and grab-handle pointer drag. Writes state.order[day] = [ids]; the packer
// (plan.js applyOrder) turns that into slots on the next paint.

const ids = (list) => [...list.querySelectorAll('.oitem')].map((li) => li.dataset.oid);
const setOrder = (store, n, seq) => store.set((s) => ({ order: { ...(s.order || {}), [n]: seq } }));
// Persist the order the packer will actually show, so the list never lies.
const clearOrder = (store, n) => store.set((s) => { const o = { ...(s.order || {}) }; delete o[n]; return { order: o }; });
const key = (xs) => xs.map((x) => x.id).join();
const commit = (store, planFor, n, seq) => {
  const s = store.get();
  const planned = planFor(s).days[n - 1];
  const shown = preview(planned, seq);
  if (key(shown) === key(movableOf(planned))) return;
  const auto = planFor({ ...s, order: { ...(s.order || {}), [n]: undefined } }).days[n - 1];
  if (key(shown) === key(movableOf(auto))) return clearOrder(store, n);
  return setOrder(store, n, shown.map((x) => x.id));
};

// Click handling for the strip. Returns true when it consumed the event.
export const orderClick = (store, e, planFor) => {
  const t = e.target;
  const mv = t.closest('[data-omove]');
  if (mv) {
    const li = mv.closest('.oitem');
    const list = li.closest('.olist');
    const seq = ids(list);
    const i = seq.indexOf(li.dataset.oid);
    const j = i + Number(mv.dataset.omove);
    if (j < 0 || j >= seq.length) return true;
    [seq[i], seq[j]] = [seq[j], seq[i]];
    commit(store, planFor, Number(list.dataset.oday), seq);
    requestAnimationFrame(() => {
      const row = document.querySelector(`.oitem[data-oid="${li.dataset.oid}"]`);
      (row?.querySelector(`[data-omove="${mv.dataset.omove}"]:not([disabled])`) || row?.querySelector('[data-omove]:not([disabled])') || row?.querySelector('.ohandle'))?.focus();
    });
    return true;
  }
  const sh = t.closest('[data-oshort]');
  if (sh) {
    const n = Number(sh.dataset.oshort);
    const planned = planFor(store.get()).days[n - 1];
    setOrder(store, n, shortest(planned, movableOf(planned)).order.map((x) => x.id));
    return true;
  }
  const rs = t.closest('[data-oreset]');
  if (rs) { clearOrder(store, Number(rs.dataset.oreset)); return true; }
  return false;
};

// Pointer drag on the handle: the item follows the finger, siblings shift,
// release commits the order. Kept inside the board root.
export function mountOrderDrag(root, store, planFor) {
  if (root.dataset.orderDrag) return;
  root.dataset.orderDrag = '1';
  let drag = null;
  const rows = (list) => [...list.querySelectorAll('.oitem')];
  const move = (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    drag.li.style.transform = `translateY(${dy}px)`;
    const mid = e.clientY;
    const others = rows(drag.list).filter((r) => r !== drag.li);
    let to = others.findIndex((r) => { const b = r.getBoundingClientRect(); return mid < b.top + b.height / 2; });
    if (to < 0) to = others.length;
    if (to !== drag.to) {
      drag.to = to;
      others.forEach((r, i) => { r.style.transform = i >= to && i < drag.from ? `translateY(${drag.h}px)` : i < to && i >= drag.from ? `translateY(${-drag.h}px)` : ''; });
    }
  };
  const end = () => {
    if (!drag) return;
    const { list, li, from, to } = drag;
    rows(list).forEach((r) => { r.style.transform = ''; r.classList.remove('is-drag'); });
    list.classList.remove('is-dragging');
    drag = null;
    if (to == null || to === from) return;
    const seq = ids(list);
    seq.splice(from, 1);
    seq.splice(to, 0, li.dataset.oid);
    commit(store, planFor, Number(list.dataset.oday), seq);
  };
  root.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.ohandle');
    if (!h) return;
    e.preventDefault();
    const li = h.closest('.oitem');
    const list = li.closest('.olist');
    const [r0, r1] = rows(list);
    const gap = r1 ? r1.getBoundingClientRect().top - r0.getBoundingClientRect().top : li.getBoundingClientRect().height;
    drag = { li, list, y0: e.clientY, from: rows(list).indexOf(li), to: null, h: gap };
    li.classList.add('is-drag');
    list.classList.add('is-dragging');
    h.setPointerCapture?.(e.pointerId);
  });
  root.addEventListener('pointermove', move);
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
