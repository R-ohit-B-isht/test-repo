const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Raw = trusted markup. html`` returns Raw, so nesting templates never double-escapes;
// plain strings interpolated into html`` are always escaped.
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);

const piece = (v) => {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(piece).join('');
  return v == null || v === false ? '' : esc(v);
};

export function html(strings, ...vals) {
  return new Raw(strings.reduce((out, str, i) => out + piece(vals[i - 1]) + str));
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
