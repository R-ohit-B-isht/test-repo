// Value parsers for specification strings. Each returns a typed value or null — never a guess.
const num = (s) => {
  const m = /-?\d+(?:[.,]\d+)?/.exec(String(s || '').replace(/,(?=\d{3}\b)/g, ''));
  return m ? Number(m[0].replace(',', '.')) : null;
};

// "20000 mAh", "20,000mAh", "20K mAh" → 20000
function mah(s) {
  const t = String(s || '');
  const m = /(\d{1,3}(?:[,.]?\d{3})*|\d+(?:\.\d+)?)\s*(k)?\s*m\s*ah\b/i.exec(t);
  if (!m) return null;
  let v = Number(m[1].replace(/[,.](?=\d{3})/g, ''));
  if (m[2]) v *= 1000;
  return Number.isFinite(v) && v > 0 ? v : null;
}

// "22.5 W", "65W (MAX)", "Output 20W" → 22.5 (largest wattage mentioned).
// Spec tables that only print electrical ratings ("DC 5V/2.4A", "9V⎓2A") are converted: V × A, largest pair.
function watts(s) {
  const t = String(s || '');
  const re = /(\d+(?:\.\d+)?)\s*-?\s*w(?:atts?)?\b/gi;
  let best = null;
  let m;
  while ((m = re.exec(t))) { const v = Number(m[1]); if (v > 0 && (best === null || v > best)) best = v; }
  if (best !== null) return best;
  const va = /(\d+(?:\.\d+)?)\s*v\s*[/⎓=\-–]\s*(\d+(?:\.\d+)?)\s*a\b/gi;
  while ((m = va.exec(t))) { const v = Math.round(Number(m[1]) * Number(m[2]) * 10) / 10; if (v > 0 && (best === null || v > best)) best = v; }
  return best;
}

// "2x USB-A, 1x Type-C" → 3; "3" → 3; "Dual" → 2
function portCount(s) {
  const t = String(s || '');
  const xs = [...t.matchAll(/\b(\d)\s*(?:[x×]\s*)?(?=usb|type|micro|lightning|dc\b|port|output)/gi)].map((m) => Number(m[1]));
  if (xs.length) return xs.reduce((a, b) => a + b, 0);
  if (/\bdual\b|\btwo\b/i.test(t)) return 2;
  if (/\btriple\b|\bthree\b/i.test(t)) return 3;
  if (/\bsingle\b|\bone\b/i.test(t)) return 1;
  const n = num(t);
  return n !== null && Number.isInteger(n) ? n : null;
}

// "473 g", "0.45 kg", "1.2 Kg" → grams
function grams(s) {
  const t = String(s || '');
  const kg = /(\d+(?:\.\d+)?)\s*kg\b/i.exec(t);
  if (kg) return Math.round(Number(kg[1]) * 1000);
  const g = /(\d+(?:\.\d+)?)\s*(?:g|gm|gms|grams?)\b/i.exec(t);
  return g ? Math.round(Number(g[1])) : null;
}

// "1200 ml", "1.5 L", "750ML" → ml
function ml(s) {
  const t = String(s || '');
  const l = /(\d+(?:\.\d+)?)\s*(?:l|ltr|litres?|liters?)\b/i.exec(t);
  const m = /(\d+(?:\.\d+)?)\s*ml\b/i.exec(t);
  if (m) return Math.round(Number(m[1]));
  if (l) return Math.round(Number(l[1]) * 1000);
  return null;
}

// "45 L", "50 Litres" → litres (backpacks)
function litres(s) {
  const t = String(s || '');
  const m = /(\d+(?:\.\d+)?)\s*(?:l|ltr|ltrs|litres?|liters?)\b/i.exec(t);
  return m ? Number(m[1]) : null;
}

// "90 min", "1.5 hours", "120 minutes" → minutes
function minutes(s) {
  const t = String(s || '');
  const h = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i.exec(t);
  const m = /(\d+(?:\.\d+)?)\s*(?:min|mins|minutes?)\b/i.exec(t);
  if (h && m) return Math.round(Number(h[1]) * 60 + Number(m[1]));
  if (m) return Math.round(Number(m[1]));
  if (h) return Math.round(Number(h[1]) * 60);
  return null;
}

// "Yes" / "No" / "1" / "True" → boolean; anything else null
function yesNo(s) {
  const t = String(s || '').trim().toLowerCase();
  if (/^(?:yes|y|true|1|available|present|included)\b/.test(t)) return true;
  if (/^(?:no|n|false|0|not available|absent|none)\b/.test(t)) return false;
  return null;
}

// Enumerated value: first matching option wins; options = [[id, regex], ...]
function oneOf(s, options) {
  const t = String(s || '');
  for (const [id, re] of options) if (re.test(t)) return id;
  return null;
}

// Every matching option (multi-valued fields like ports / protections)
function allOf(s, options) {
  const t = String(s || '');
  const out = [];
  for (const [id, re] of options) if (re.test(t)) out.push(id);
  return out.length ? out : null;
}

// "1 Year", "12 months", "6 Months Manufacturer Warranty" → months
function warrantyMonths(s) {
  const t = String(s || '');
  const y = /(\d+(?:\.\d+)?)\s*-?\s*(?:years?|yrs?|yr)\b/i.exec(t);
  const m = /(\d+)\s*-?\s*months?\b/i.exec(t);
  const d = /(\d+)\s*-?\s*days?\b/i.exec(t);
  if (y) return Math.round(Number(y[1]) * 12);
  if (m) return Number(m[1]);
  if (d && Number(d[1]) >= 90 && !/extra|extended|additional|replacement|return/i.test(t)) return Math.round(Number(d[1]) / 30);
  return null;
}

module.exports = { num, mah, watts, portCount, grams, ml, litres, minutes, yesNo, oneOf, allOf, warrantyMonths };
