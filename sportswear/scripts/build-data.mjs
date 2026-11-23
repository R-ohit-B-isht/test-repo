// data/catalogue.json -> public/data/{manifest.json, rows.json, detail/<n>.json}
// Classifies every product into the shared taxonomy, tags it, and scores it on quality only. Price is carried for display, never scored.
import fs from 'node:fs';
import { CATEGORIES, DEPTS, FEATURES, LINES, MATERIALS, SPORTS, TEAMS, TECH, TIERS } from './taxonomy.mjs';

const SRC = new URL('../data/catalogue.json', import.meta.url);
const OUT = new URL('../public/data/', import.meta.url);
const SHARDS = 48;
const WEIGHTS = { tier: 35, tech: 25, materials: 20, buyers: 10, transparency: 10 };
const CRITERIA = {
  tier: 'Where the product sits on the maker’s own performance ladder (Elite › Pro › Performance › Entry), read from its name and line.',
  tech: 'Maker technologies named on the product page (foams, plates, membranes, knit uppers, Dri-FIT ADV / HEAT.RDY / dryCELL …), weighted by what they say about build.',
  materials: 'Premium materials named (leather, suede, merino, Gore-Tex, knit uppers, ripstop, organic/Pima cotton …) plus whether a full fibre composition is published.',
  buyers: 'Bayesian-smoothed star rating where the store shows one (Puma, Myntra). Nike India shows no ratings, so Nike items get the neutral prior — never a penalty.',
  transparency: 'How much the maker publishes: fibre %, country of origin, feature bullets, description length.',
};

const { items, generatedAt } = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const low = (s) => (s ?? '').toString().toLowerCase();
const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const uniq = (a) => [...new Set(a.filter(Boolean))];

function department(it, head) {
  const div = low(it.division);
  const at = low(it.articleType);
  if (/footwear|shoes|flip flops|sandals/.test(div + ' ' + at)) return 'footwear';
  if (/accessor|personal care|sporting goods|home|equipment/.test(div)) return /shoes?/.test(head) && !/socks|bag|lace/.test(head) ? 'footwear' : 'accessories';
  if (/\bsocks?\b/.test(low(it.name)) || /\b(football|basketball|ball)( v?\d+)?$/.test(low(it.name).trim())) return 'accessories';
  if (/\b(socks?|caps?|beanies?|bags?|backpacks?|wallets?|belts?|gloves?|face masks?|masks?|headbands?|wristbands?|bottles?|waterbottle)\b/.test(head) && !/\b(shoes?|sneakers?|jackets?|shirts?|tees?|pants|shorts|dress|hoodie|sweatshirt|jersey|bra|leggings|tights)\b/.test(low(it.name))) return 'accessories';
  if (/apparel|clothing/.test(div)) return 'apparel';
  if (/\b(shoes?|sneakers?|trainers?|boots?|cleats?|slides?|slippers?|flip[ -]?flops?|sandals?|clogs?|mules?|spikes|floaters)\b/.test(head) && !/\b(socks?|bag|laces?|shoe care|insoles?)\b/.test(head)) return 'footwear';
  if (/\b(socks?|caps?|hats?|beanies?|bags?|backpacks?|wallets?|belts?|gloves?|balls?|bottles?|headbands?|wristbands?|sunglasses|watch|deodorant|perfume|guards?|scarf|mat|towel|laces?|visor|pouch|duffel|sack|umbrella|mask)\b/.test(head)) return 'accessories';
  return 'apparel';
}

function genderAge(it, head) {
  const g = low(it.nameGender ?? '') + ' ' + low(it.genderRaw) + ' ' + head;
  let age = 'adult';
  if (/\b(baby|babies|toddler|infant|newborn|0-4|\(0 - 4)/.test(g)) age = 'baby';
  else if (/\b(kids?'?s?|boys?|girls?|junior|jr|youth|big kids?|older kids?|younger kids?|little kids?|children|8 -16|7 - 14|4 - 7)\b/.test(g)) age = 'kids';
  let gender;
  if (age !== 'adult') gender = /\bgirls?\b/.test(g) && !/\bboys?\b/.test(g) ? 'girls' : /\bboys?\b/.test(g) && !/\bgirls?\b/.test(g) ? 'boys' : 'kids-unisex';
  else if (/\bunisex\b/.test(g) || (/\bmen\b|men's|\bmale\b/.test(g) && /\bwomen\b|women's|\bfemale\b/.test(g))) gender = 'unisex';
  else if (/\bwomen\b|women's|\bfemale\b|\bwmns\b/.test(g)) gender = 'women';
  else if (/\bmen\b|men's|\bmale\b|\bmens\b/.test(g)) gender = 'men';
  else gender = 'unisex';
  return { gender, age };
}

const tagIndex = [];
const tagId = new Map();
const tag = (group, label) => {
  const k = `${group}:${label}`;
  if (!tagId.has(k)) { tagId.set(k, tagIndex.length); tagIndex.push([group, label]); }
  return tagId.get(k);
};
const GENDER = { men: 'Men', women: 'Women', unisex: 'Unisex', boys: 'Boys', girls: 'Girls', 'kids-unisex': 'Kids (unisex)' };
const AGE = { adult: 'Adults', kids: 'Kids', baby: 'Babies & toddlers' };

const rows = [];
const details = Array.from({ length: SHARDS }, () => ({}));
const ratingPrior = (() => {
  const r = items.filter((i) => i.rating && i.ratingCount);
  const n = r.reduce((a, i) => a + i.ratingCount, 0);
  return n ? r.reduce((a, i) => a + i.rating * i.ratingCount, 0) / n : 4;
})();

for (const it of items) {
  const attrVals = Object.entries(it.attrs ?? {}).filter(([k]) => !/BIS|URL|Address|Manufacturer|Sold By/i.test(k)).map(([, v]) => v).join(' ');
  const head = low([it.name, it.sub, (it.path ?? []).join(' '), it.articleType].join(' '));
  const body = low([it.desc, (it.bullets ?? []).map((b) => b.text).join(' '), (it.materials ?? []).join(' '), attrVals].join(' '));
  const all = head + ' ' + body;
  const dept = department(it, head);
  const nm = low(it.name + ' ' + (it.sub ?? ''));
  const forced = dept === 'accessories' && /\b(football|basketball|ball)( v?\d+)?$/.test(low(it.name).trim()) ? CATEGORIES.find(([id]) => id === 'balls') : null;
  const cat = forced ?? CATEGORIES.find(([id, , d, re]) => d === dept && re.test(head + ' ' + low(attrVals)) && !(id === 'jerseys-kits' && /\b(pants|shorts|trousers|leggings|tights|socks|jackets?|hoodie|sweatshirt|dress)\b/.test(nm)) && !(id === 'tanks' && /\bvest\b/.test(nm) && /\b(puffer|padded|jacket|gilet)\b/.test(nm))) ?? CATEGORIES.find(([, , d]) => d === dept);
  const { gender, age } = genderAge(it, head);
  const sportAttr = low([it.attrs?.['Nike Sports Type'], it.attrs?.['Sports Type'], it.attrs?.['Sport']].join(' '));
  let sports = SPORTS.filter(([, , re]) => re.test(head + ' ' + sportAttr)).map(([id]) => id);
  if (cat[0] === 'football-boots' || cat[0] === 'jerseys-kits' && /football|fc|club/.test(head)) sports.push('football');
  if (cat[0] === 'motorsport-shoes') sports.push('motorsport');
  if (cat[0] === 'running-shoes') sports.push('running');
  if (cat[0] === 'basketball-shoes') sports.push('basketball');
  if (cat[0] === 'golf-shoes') sports.push('golf');
  if (cat[0] === 'cricket-shoes') sports.push('cricket');
  if (cat[0] === 'trail-hiking') sports.push('trail');
  if (cat[0] === 'training-shoes') sports.push('training');
  if (cat[0] === 'swimwear') sports.push('swimming');
  sports = uniq(sports);
  if (!sports.length) sports = ['lifestyle'];
  const teams = TEAMS.filter(([, re]) => re.test(it.name + ' ' + (it.sub ?? ''))).map(([l]) => l);
  const lines = (LINES[it.brand] ?? []).filter((l) => new RegExp(`\\b${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(it.name + ' ' + (it.sub ?? '') + ' ' + (it.path ?? []).join(' ')));
  if (it.brand === 'Adidas' && it.sub === 'adidas Originals' && !lines.includes('adidas Originals')) lines.unshift('adidas Originals');
  if (it.brand === 'Nike' && /jordan/i.test(it.name + (it.path ?? []).join(' ')) && !lines.includes('Jordan')) lines.unshift('Jordan');
  const tech = TECH.filter(([, re]) => re.test(all));
  const techNike = low(it.attrs?.['Nike Technology']);
  const mats = MATERIALS.filter(([, re]) => re.test(low((it.materials ?? []).join(' ') + ' ' + (it.bullets ?? []).map((b) => b.text).join(' ') + ' ' + low(it.attrs?.Materials ?? it.attrs?.Fabrics ?? '') + ' ' + low(it.attrs?.['Upper Material'] ?? '') + ' ' + low(it.attrs?.['Sole Material'] ?? ''))));
  const feats = FEATURES.filter(([, re]) => re.test(all)).map(([l]) => l);
  const tier = TIERS.find(([, , , re]) => re.test(head)) ?? null;

  // ---------- quality score (0-100 per dimension) ----------
  const reasons = [];
  const sTier = tier ? tier[2] : 55;
  reasons.push(tier ? `${tier[1]} (maker line)` : 'No maker tier stated — neutral 55');
  const techW = tech.reduce((a, t) => a + t[2], 0) + (techNike && !tech.length ? 1 : 0);
  const sTech = clamp(25 + techW * 15);
  if (tech.length) reasons.push(`Technologies: ${tech.map((t) => t[0]).join(', ')}`);
  const matW = mats.reduce((a, m) => a + m[2], 0);
  const pct = /\d+\s?%/.test((it.materials ?? []).join(' ') + (it.bullets ?? []).map((b) => b.text).join(' '));
  const onlySynthetic = mats.length > 0 && mats.every((m) => m[0] === 'Synthetic');
  const sMat = clamp(35 + matW * 14 + (pct ? 15 : 0) - (onlySynthetic && !pct ? 10 : 0) - (mats.length ? 0 : 15));
  if (mats.some((m) => m[2] >= 1)) reasons.push(`Premium materials: ${mats.filter((m) => m[2] >= 1).map((m) => m[0]).join(', ')}`);
  if (pct) reasons.push('Full fibre composition published');
  const C = 20;
  const sBuy = it.rating && it.ratingCount ? clamp(((it.rating * it.ratingCount + ratingPrior * C) / (it.ratingCount + C) - 1) * 25) : clamp((ratingPrior - 1) * 25);
  if (it.rating && it.ratingCount) reasons.push(`Rated ${it.rating.toFixed(1)}★ by ${it.ratingCount} buyers`);
  const nb = (it.bullets ?? []).length;
  const sTr = clamp((pct ? 35 : (it.materials ?? []).length ? 15 : 0) + (it.origin ? 15 : 0) + Math.min(nb, 8) * 5 + Math.min((it.desc ?? '').length / 400, 1) * 10);
  const sc = { tier: Math.round(sTier), tech: Math.round(sTech), materials: Math.round(sMat), buyers: Math.round(sBuy), transparency: Math.round(sTr) };
  const raw = Object.entries(WEIGHTS).reduce((a, [k, w]) => a + sc[k] * w, 0) / 100;
  const s = Math.round((raw + nb * 0.01 + (it.images?.length ?? 0) * 0.002) * 10) / 10;

  const t = [
    tag('brand', it.brand), tag('dept', DEPTS[dept]), tag('cat', cat[1]),
    ...sports.map((x) => tag('sport', x === 'lifestyle' ? 'Lifestyle / Casual' : SPORTS.find((y) => y[0] === x)[1])),
    tag('gender', GENDER[gender]), tag('age', AGE[age]),
    ...teams.map((x) => tag('team', x)), ...lines.map((x) => tag('line', `${it.brand} · ${x}`)),
    ...tech.map((x) => tag('tech', x[0])), ...(techNike ? techNike.split(' | ').map((x) => tag('tech', x.replace(/\b\w/g, (c) => c.toUpperCase()).replace('Dri-Fit', 'Dri-FIT'))) : []),
    ...mats.map((x) => tag('material', x[0])), ...feats.map((x) => tag('feature', x)),
    tag('tier', tier ? tier[1] : 'No tier stated'), tag('stock', it.inStock ? 'In stock' : 'Out of stock'),
  ];
  rows.push({
    id: it.id, b: it.brand, n: it.name, u: it.sub ?? '', c: cat[0], d: dept, s, sc,
    img: it.images?.[0] ?? '', r: it.ratingCount ? it.rating : null, rc: it.ratingCount ?? null,
    p: it.price, m: it.mrp, k: it.inStock ? 1 : 0, t: uniq(t),
  });
  const h = [...it.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % SHARDS;
  details[h][it.id] = {
    url: it.url, source: it.source, path: it.path, desc: it.desc, bullets: it.bullets, materials: it.materials, care: it.care ?? [],
    attrs: Object.fromEntries(Object.entries(it.attrs ?? {}).filter(([k]) => !/BIS|URL/i.test(k))), style: it.style, colour: it.colour, colours: it.colours,
    images: it.images, origin: it.origin, sizes: it.sizesInStock ?? null, reasons,
  };
}

rows.sort((a, b) => b.s - a.s || a.id.localeCompare(b.id));
const facetCounts = {};
for (const r of rows) for (const ti of r.t) facetCounts[ti] = (facetCounts[ti] ?? 0) + 1;
const categories = CATEGORIES.map(([id, label, dept]) => {
  const inCat = rows.filter((r) => r.c === id);
  return { id, label, dept, count: inCat.length, top: inCat.slice(0, 3).map((r) => r.id), img: inCat[0]?.img ?? '', byBrand: Object.fromEntries(['Puma', 'Nike', 'Adidas'].map((b) => [b, inCat.filter((r) => r.b === b).length])) };
}).filter((c) => c.count);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(new URL('detail/', OUT), { recursive: true });
fs.writeFileSync(new URL('manifest.json', OUT), JSON.stringify({
  generatedAt, total: rows.length, weights: WEIGHTS, criteria: CRITERIA, depts: DEPTS, shards: SHARDS, categories,
  brands: Object.fromEntries(['Puma', 'Nike', 'Adidas'].map((b) => [b, rows.filter((r) => r.b === b).length])),
  sources: { Puma: 'in.puma.com', Nike: 'nike.in (official Nike India store)', Adidas: 'Official adidas store on Myntra (adidas.co.in blocks automated access)' },
}));
fs.writeFileSync(new URL('rows.json', OUT), JSON.stringify({ tagIndex, facetCounts, rows }));
details.forEach((d, i) => fs.writeFileSync(new URL(`detail/${i}.json`, OUT), JSON.stringify(d)));
console.log('rows', rows.length, 'tags', tagIndex.length, 'categories', categories.length);
