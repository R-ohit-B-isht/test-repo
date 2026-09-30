// Slippers / flip-flops — reference ceiling. Facts read off olukai.com (product page + public product API) on `checked`.
export default {
  category: 'flip-flops',
  brand: 'OluKai',
  name: '‘Ohana (men’s beach sandal)',
  why: 'A flip-flop whose maker states the things this category credits — water-resistant synthetic straps, a non-marking rubber outsole for grip, a quick-drying jersey-knit lining and a soft nylon toe post — and does not call it waterproof, premium or orthopaedic. OutdoorGearLab’s men’s flip-flop test names the ‘Ohana its best overall for arch support that does not pack out and traction across terrain. It is the dry-side shoe of this trip: room, shower, evening; the wet side belongs to the water-shoes list.',
  checked: '2026-09-26',
  caution: 'OluKai sells from a US storefront and no OluKai listing exists on Flipkart / Amazon.in in this dataset, so no in-list rank is shown. The women’s ‘Ohana is the same construction on a women’s last. Marketplace “orthopaedic” / “doctor” slipper claims are not credited.',
  maker: {
    label: 'OluKai — official product page (US)',
    url: 'https://olukai.com/products/ohana-mens-beach-sandals-blue-coral-black',
    title: '‘Ohana — Blue Coral / Black | Men’s Bestselling Beach Sandals',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0015/9229/5523/files/10110-QS40-001.png?v=1787674571',
    source: 'olukai.com product gallery (Blue Coral / Black)',
  },
  facts: [
    { k: 'Straps', v: 'Water-resistant synthetic straps; soft nylon toe post' },
    { k: 'Outsole', v: 'Non-marking rubber outsole for grip' },
    { k: 'Lining', v: 'Quick-drying jersey knit' },
    { k: 'Use', v: 'Beach and water activities; lightweight for prolonged outdoor use (maker)' },
    { k: 'Price', v: 'US$80' },
  ],
  evidence: [
    { label: 'Best Flip-Flops for Men — OluKai ‘Ohana, best overall (arch support, traction)', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/topics/shoes-and-boots/best-flip-flops-men' },
    { label: '‘Ohana — key features (water-resistant straps, non-marking rubber outsole, quick-dry lining)', publisher: 'OluKai', url: 'https://olukai.com/products/ohana-mens-beach-sandals-blue-coral-black' },
  ],
  match: { brand: '^olukai$', model: 'ohana', note: 'OluKai ‘Ohana was not found on Flipkart / Amazon.in in this dataset.' },
};
