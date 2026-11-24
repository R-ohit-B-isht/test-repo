// Raw storefront dumps -> data/catalogue.json (one common shape per product).
// Usage: node scripts/normalize.mjs <rawDir>   (rawDir holds puma/products.jsonl, nike/{list.json,pdp.jsonl}, adidas/{list.json,pdp.jsonl})
import fs from 'node:fs';
import path from 'node:path';

const RAW = process.argv[2] ?? '/home/ubuntu/work';
const OUT = new URL('../data/catalogue.json', import.meta.url);

const jsonl = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
const decode = (s) => s.replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&reg;/g, '®').replace(/&trade;/g, '™');
const text = (html = '') => decode(String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|h\d|div)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
/** Split an HTML blob into its lead paragraph(s) and every <li> bullet, keeping the <h3> section the bullet sat under. */
function htmlParts(html = '') {
  const bullets = [];
  let section = 'Details';
  const re = /<h\d[^>]*>([\s\S]*?)<\/h\d>|<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) section = text(m[1]).replace(/:$/, '') || section;
    else { const t = text(m[2]); if (t) bullets.push({ section, text: t }); }
  }
  const lead = text(html.replace(/<h\d[\s\S]*$/i, '').replace(/<ul[\s\S]*?<\/ul>/gi, ''));
  return { lead, bullets };
}
const uniq = (a) => [...new Set(a.filter(Boolean))];
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

const items = [];

// ---------- PUMA (in.puma.com, __NEXT_DATA__) ----------
// Only products still in Puma's live sitemap (puma/live.txt, one product id per line) when that file exists.
const pumaLive = fs.existsSync(path.join(RAW, 'puma/live.txt')) ? new Set(fs.readFileSync(path.join(RAW, 'puma/live.txt'), 'utf8').split('\n').filter(Boolean)) : null;
const pumaSeen = new Set();
for (const r of jsonl(path.join(RAW, 'puma/products.jsonl'))) {
  const p = r.product;
  if (!p || (pumaLive && !pumaLive.has(r.id)) || pumaSeen.has(r.id)) continue;
  pumaSeen.add(r.id);
  const vars = p.variations ?? [];
  const v = vars.find((x) => x.orderable) ?? vars[0] ?? {};
  const chain = [];
  for (let c = r.category; c; c = c.parentCategory) chain.unshift(c.name);
  const story = htmlParts(v.productStory?.longDescription ?? '');
  const mi = v.manufacturerInfo ?? {};
  items.push({
    id: `puma-${p.id}`,
    brand: 'Puma',
    name: decode(p.name ?? v.name ?? ''),
    sub: decode(p.subHeader ?? v.subHeader ?? '') || null,
    url: r.url.split('?')[0] + (v.colorValue ? `?swatch=${v.colorValue}` : ''),
    path: chain.filter(Boolean),
    division: p.productDivision ?? null,
    genderRaw: v.gender ?? null,
    desc: text(p.description ?? '') || story.lead,
    bullets: story.bullets,
    materials: (v.materialComposition ?? []).map((s) => decode(String(s)).trim()).filter(Boolean),
    attrs: {},
    style: v.styleNumber ?? null,
    colour: v.colorName ?? null,
    colours: (p.colors ?? vars).length || 1,
    images: uniq((v.images ?? []).map((i) => i.href ?? i.src ?? i.url ?? (typeof i === 'string' ? i : null)).concat(v.preview)).map((u) => u.replace('w_2000,h_2000', 'w_800,h_800')).slice(0, 8),
    origin: mi.countryOfOrigin?.content?.filter(Boolean).join(', ') || null,
    rating: num(p.amountOfReviews) ? num(p.averageRating) : null,
    ratingCount: num(p.amountOfReviews) || null,
    price: num(v.salePrice ?? v.productPrice?.salePrice ?? v.price),
    mrp: num(v.price ?? v.productPrice?.price),
    inStock: vars.some((x) => x.orderable) || !!p.orderable,
    source: 'in.puma.com',
  });
}

// ---------- NIKE (nike.in, Nykaa-run official store) ----------
{
  const listFile = path.join(RAW, 'nike/list.json');
  const list = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : {};
  for (const r of jsonl(path.join(RAW, 'nike/pdp.jsonl'))) {
    const d = r.product;
    const l = list[r.id];
    if (!d || !l) continue;
    const attrs = {};
    const walk = (w) => {
      if (!w || typeof w !== 'object') return;
      if (Array.isArray(w)) return w.forEach(walk);
      for (const a of w.attributes ?? []) if (a?.label && a.value) attrs[a.label] = attrs[a.label] ? uniq([...String(attrs[a.label]).split(' | '), a.value]).join(' | ') : String(a.value);
      if (w.widget_type === 'plain_widget' && w.title && w.value) attrs[w.title] = String(w.value);
      (w.child_widgets ?? []).forEach(walk);
    };
    walk(d.pdp_sections);
    for (const a of d.product_summary?.attributes ?? []) attrs[a.label] = a.value;
    const parts = htmlParts(d.view_product_details ?? '');
    const pc = d.primary_categories_json_all ?? {};
    const chain = ['l1_Category', 'l2_Category', 'l3_Category', 'l4_Category'].map((k) => pc[k]?.name).filter(Boolean);
    const materials = parts.bullets.map((b) => b.text).filter((t) => /\d+\s?%/.test(t) || /^(upper|outsole|midsole|lining|shell|body|fabric)\s*:/i.test(t));
    const country = attrs['Country of Origin'] ?? null;
    for (const k of ['Sold By', 'Country of Origin', 'Name of Manufacturer/ Packer/ Importer', 'Address of Manufacturer/ Packer/ Importer', 'Colour Shown', 'Style', 'Nike Color']) delete attrs[k];
    const sizes = d.sizeOptions?.options ?? [];
    items.push({
      id: `nike-${r.id}`,
      brand: 'Nike',
      name: decode(d.title ?? l.title ?? ''),
      sub: decode(d.subTitle ?? l.subTitle ?? '') || null,
      url: `https://www.nike.in${l.actionUrl ?? d.action_url}`,
      path: chain,
      division: null,
      genderRaw: pc.l1_Category?.name ?? null,
      desc: text(d.product_summary?.description ?? '') || parts.lead,
      bullets: parts.bullets.filter((b) => !/^net quantity/i.test(b.text)),
      materials,
      attrs,
      style: d.product_summary?.attributes?.find((a) => a.label === 'Style')?.value ?? null,
      colour: d.product_summary?.attributes?.find((a) => a.label === 'Colour Shown')?.value?.replace(/\|/g, ' / ') ?? d.color?.name ?? null,
      colours: 1 + (d.colorOptions?.length ?? 0),
      images: uniq((d.productMedia ?? []).filter((m) => m.mediaType === 'image').map((m) => m.url.split('?')[0])).slice(0, 8),
      origin: country,
      rating: null,
      ratingCount: null,
      price: num(l.discountedPrice),
      mrp: num(l.price),
      inStock: String(l.isOutOfStock) !== '1',
      sizesInStock: sizes.filter((s) => String(s.isOutOfStock ?? s.is_out_of_stock ?? '0') !== '1' && s.inStock !== false).map((s) => s.sizeName ?? s.title).filter(Boolean),
      popRank: l.rank_pop,
      source: 'nike.in',
    });
  }
}

// ---------- ADIDAS (official adidas store on Myntra; adidas.co.in blocks automated access) ----------
{
  const listFile = path.join(RAW, 'adidas/list.json');
  const list = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : {};
  for (const r of jsonl(path.join(RAW, 'adidas/pdp.jsonl'))) {
    const s = r.style;
    const l = list[r.id];
    if (!s || !l) continue;
    const an = s.analytics ?? {};
    const details = {};
    for (const pd of s.productDetails ?? []) if (pd.title) details[pd.title.toUpperCase()] = pd.description ?? '';
    const parts = htmlParts(details['PRODUCT DETAILS'] ?? '');
    const lead = parts.lead.split('\n');
    const bullets = [...parts.bullets, ...lead.slice(1).filter((t) => t.length > 2).map((t) => ({ section: 'Details', text: t }))];
    const matCare = text(details['MATERIAL & CARE'] ?? '').split('\n').map((t) => t.trim()).filter(Boolean);
    const attrs = { ...(s.articleAttributes ?? {}) };
    for (const [k, v] of Object.entries(attrs)) if (v === 'NA' || v === '' || /^(Net Quantity|Net Quantity Unit|Number of Items|Body or Garment Size|Main Trend|Personalization|Character|BIS .*|Package Contains)$/.test(k)) delete attrs[k];
    const imgs = [];
    for (const al of s.media?.albums ?? []) for (const im of al.images ?? []) if (im.imageURL) imgs.push(im.imageURL.replace(/^http:/, 'https:'));
    for (const im of l.images ?? []) imgs.push(im.src.replace(/^http:/, 'https:'));
    const sizes = s.sizes ?? [];
    items.push({
      id: `adidas-${r.id}`,
      brand: 'Adidas',
      name: decode(s.name ?? l.productName ?? '').replace(/^ADIDAS( Originals)?\s+/i, '').replace(/^(MEN|WOMEN|UNISEX|KIDS|BOYS|GIRLS)\s+/i, ''),
      nameGender: (decode(s.name ?? '').replace(/^ADIDAS( Originals)?\s+/i, '').match(/^(MEN|WOMEN|UNISEX|KIDS|BOYS|GIRLS)\b/i) ?? [])[1] ?? null,
      sub: s.brand?.name === 'ADIDAS Originals' || l.brand === 'ADIDAS Originals' ? 'adidas Originals' : null,
      url: `https://www.myntra.com/${l.landingPageUrl}`,
      path: [an.gender, an.masterCategory, an.subCategory, an.articleType].filter(Boolean),
      division: an.masterCategory ?? null,
      genderRaw: an.gender ?? null,
      articleType: an.articleType ?? null,
      desc: lead[0] ?? '',
      bullets,
      materials: matCare.filter((t) => !/wash|dry|iron|bleach|clean|care/i.test(t) || /\d+\s?%/.test(t)),
      care: matCare.filter((t) => /wash|dry|iron|bleach|clean|care/i.test(t) && !/\d+\s?%/.test(t)),
      attrs,
      style: s.id ? String(s.id) : null,
      colour: s.baseColour ?? null,
      colours: (l.colourVariants?.length ?? 0) || 1,
      images: uniq(imgs.filter((u) => !/\(\$/.test(u))).slice(0, 8),
      origin: s.countryOfOrigin ?? null,
      rating: num(s.ratings?.averageRating ?? l.rating),
      ratingCount: num(s.ratings?.totalCount ?? l.ratingCount),
      price: num(l.price),
      mrp: num(l.mrp ?? s.mrp),
      inStock: sizes.some((z) => z.available) || (l.inventoryInfo ?? []).some((z) => z.available),
      sizesInStock: sizes.filter((z) => z.available).map((z) => z.label),
      popRank: l.rank_pop,
      source: 'myntra.com (adidas store)',
    });
  }
}

// Adidas items whose Myntra product page could not be read (Myntra rate-limits the detail API): keep the listing data only.
{
  const listFile = path.join(RAW, 'adidas/list.json');
  const list = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : {};
  const have = new Set(items.filter((i) => i.brand === 'Adidas').map((i) => i.id));
  for (const [id, l] of Object.entries(list)) {
    if (have.has(`adidas-${id}`)) continue;
    const raw = decode(l.productName ?? l.product ?? '').replace(/^ADIDAS( Originals)?\s+/i, '');
    items.push({
      id: `adidas-${id}`, brand: 'Adidas', name: raw.replace(/^(MEN|WOMEN|UNISEX|KIDS|BOYS|GIRLS)\s+/i, ''), nameGender: (raw.match(/^(MEN|WOMEN|UNISEX|KIDS|BOYS|GIRLS)\b/i) ?? [])[1] ?? null,
      sub: l.brand === 'ADIDAS Originals' ? 'adidas Originals' : null, url: `https://www.myntra.com/${l.landingPageUrl}`,
      path: [l.gender, l.category, l.articleType?.typeName ?? l.articleType].filter((x) => typeof x === 'string'), division: null, genderRaw: l.gender ?? null,
      articleType: typeof l.articleType === 'string' ? l.articleType : l.articleType?.typeName ?? l.category ?? null,
      desc: '', bullets: [], materials: [], attrs: {}, style: String(id), colour: l.primaryColour ?? null, colours: (l.colourVariants?.length ?? 0) || 1,
      images: uniq((l.images ?? []).map((im) => im.src?.replace(/^http:/, 'https:'))).slice(0, 8), origin: null,
      rating: l.ratingCount ? num(l.rating) : null, ratingCount: num(l.ratingCount) || null, price: num(l.price), mrp: num(l.mrp),
      inStock: (l.inventoryInfo ?? []).some((z) => z.available), sizesInStock: (l.inventoryInfo ?? []).filter((z) => z.available).map((z) => z.label),
      popRank: l.rank_pop, source: 'myntra.com (adidas store)', listingOnly: true,
    });
  }
}

fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), items }));
const by = items.reduce((a, x) => ((a[x.brand] = (a[x.brand] ?? 0) + 1), a), {});
console.log('normalized', items.length, by);
