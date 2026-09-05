// Flipkart "Specifications" tab → { label: value } (labels are lines followed by a value line, grouped under
// section headings). Only the structured table is read; free-text "Description" / "Features" blocks are kept
// separately as seller text and never treated as a specification.
const SECTIONS = new Set([
  'Specifications', 'Warranty', 'Manufacturer info', 'In the Box', 'General', 'Additional Features', 'Dimensions',
  'Other Dimensions', 'Power Features', 'Battery', 'Convenience Features', 'Body Features', 'Body & Design Features',
  'Performance Features', 'Cooking Features', 'Safety Features', 'Product Details', 'Material', 'Features',
  'See more', 'Show More', 'Description', 'Read More', 'Warranty Summary',
]);
const FREE_TEXT = new Set(['Features', 'Key Features', 'Other Features', 'Description', 'Sales Package', 'Additional Features']);

function parseSpecText(txt) {
  const lines = String(txt || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const kv = {};
  const seller = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const k = lines[i];
    const v = lines[i + 1];
    if (SECTIONS.has(k) && !FREE_TEXT.has(k)) continue;
    if (SECTIONS.has(v) && !FREE_TEXT.has(v)) continue;
    if (k.length >= 40 || v.length >= 400) continue;
    if (FREE_TEXT.has(k)) { seller.push(v); i++; continue; }
    if (kv[k] !== undefined) continue;
    kv[k] = v;
    i++;
  }
  return { kv, seller };
}

// Amazon page records carry a bullet list ("features"); some also carry a "Technical Details" table
// scraped as { label: value }. Both are normalised to the same shape.
function amazonSpecs(rec) {
  const kv = {};
  const tech = rec.tech || rec.specs || rec.details || null;
  if (tech && typeof tech === 'object' && !Array.isArray(tech)) for (const [k, v] of Object.entries(tech)) if (typeof v === 'string' && k.length < 40 && v.length < 400) kv[k.trim()] = v.trim();
  const seller = Array.isArray(rec.features) ? rec.features.map((s) => String(s).trim()).filter(Boolean) : [];
  return { kv, seller };
}

// Case/whitespace-insensitive lookup across several candidate labels.
function pick(kv, labels) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const map = new Map(Object.entries(kv).map(([k, v]) => [norm(k), v]));
  for (const l of labels) {
    const v = map.get(norm(l));
    if (v !== undefined && v !== '' && !/^(?:na|n\/a|-|none|nil)$/i.test(v)) return v;
  }
  return null;
}

module.exports = { parseSpecText, amazonSpecs, pick };
