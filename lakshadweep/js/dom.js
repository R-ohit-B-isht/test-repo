// DOM helpers: escaping template tag, date formatting, tiny query wrappers.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Tagged template: interpolations are escaped unless wrapped with raw().
class Raw { constructor(s) { this.s = s; } }
export const raw = (s) => new Raw(s);
export function html(strings, ...vals) {
  return strings.reduce((out, str, i) => {
    const v = vals[i - 1];
    const piece = v instanceof Raw ? v.s : Array.isArray(v) ? v.map((x) => (x instanceof Raw ? x.s : esc(x))).join('') : v == null ? '' : esc(v);
    return out + piece + str;
  });
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const DAY_LONG = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtDate = (iso) => DAY.format(new Date(`${iso}T00:00:00`));
export const fmtDateLong = (iso) => DAY_LONG.format(new Date(`${iso}T00:00:00`));
export function fmtRange(a, b) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short' });
  if (da.getMonth() === db.getMonth()) return `${da.getDate()}–${db.getDate()} ${month.format(db)} ${db.getFullYear()}`;
  return `${DAY.format(da)} – ${DAY.format(db)} ${db.getFullYear()}`;
}

export function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
}
