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
// Flipkart names its spec groups "<Area> Features" ("Power and Connectivity Features", "Camera Features",
// "Display Features"…); a row label of that shape starts with Other / Key / Special / Additional.
const GROUP_HEADING = /^(?!(?:Other|Key|Special|Additional)\b)[A-Z][A-Za-z&/,\- ]{2,40}\bFeatures$/;
const isHeading = (s) => (SECTIONS.has(s) && !FREE_TEXT.has(s)) || GROUP_HEADING.test(s);
// "Additional Features" is a group heading when what follows is a short label (then its value), a free-text
// row when the next line is prose.
const headsGroup = (k, v, next) => FREE_TEXT.has(k) && k === 'Additional Features' && v.length < 40 && next !== undefined && !isHeading(next) && !/[.,;]/.test(v);

// A Flipkart page's text runs on past the product's own tab into Q&A and "Similar Products" / "Trending" carousels
// (other products' titles, "42% OFF", prices). Everything from the first such block on belongs to other products.
const PAGE_TAIL = /^(?:Questions and Answers|Similar Products|Similar [A-Z][^\n]{0,60}|Trending|You might be interested in|Frequently Bought Together|Recently Viewed|Ratings & Reviews|Customers who (?:bought|viewed) this|Sponsored)$/;
const OFF_CARD = /^\d{1,2}% OFF$/;
function ownText(txt) {
  const lines = String(txt || '').split('\n');
  let cut = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (PAGE_TAIL.test(s)) { cut = i; break; }
    // a carousel card is "<rating>\n<title>\n<n>% OFF\n₹…": cut before the title line
    if (OFF_CARD.test(s) && i >= 1) { cut = Math.max(0, i - (/^\d(?:\.\d)?$/.test((lines[i - 2] || '').trim()) ? 2 : 1)); break; }
  }
  return lines.slice(0, cut).join('\n');
}

function parseSpecText(txt) {
  const lines = ownText(txt).split('\n').map((s) => s.trim()).filter(Boolean);
  const kv = {};
  const seller = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const k = lines[i];
    const v = lines[i + 1];
    if (isHeading(k) || headsGroup(k, v, lines[i + 2])) continue;
    if (isHeading(v)) continue;
    if (k.length >= 40 || v.length >= 400) continue;
    if (!/[a-z]/i.test(k)) continue;
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

module.exports = { parseSpecText, amazonSpecs, pick, ownText };
