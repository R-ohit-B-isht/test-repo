// Swim caps — reference ceiling. Facts read off speedo.in (Speedo India product page + public product API) on `checked`.
export default {
  category: 'swim-caps',
  brand: 'Speedo',
  name: 'Long Hair Silicone Swim Cap',
  why: 'A one-piece silicone cap sold in India by the maker itself, with the material, latex-free construction, hair-protection purpose and long-hair volume stated on the maker’s own page rather than by a marketplace seller. Two independent tests pick the Speedo Long Hair cap — Good Housekeeping (best for long hair; Institute Textiles & Fitness Labs, Olympian-consulted) and Runner’s World UK (best for medium-length hair). Silicone is what this category credits: it does not tear like latex or soak like fabric, and it keeps salt water and sun off the hair on snorkel days.',
  checked: '2026-09-26',
  caution: 'Speedo India lists this cap under Women’s; it is a one-size stretch silicone cap and the independent tests do not restrict it by wearer. Any Speedo cap on Flipkart / Amazon.in is matched below only when the listing title names the Long Hair model. Combos (cap + goggles) and kids’ caps are not counted.',
  maker: {
    label: 'Speedo India — official product page',
    url: 'https://www.speedo.in/products/long-hair-cap-black-80616816681',
    title: 'Women’s Long Hair Silicone Swim Caps — Blue',
    region: 'IN',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0764/2808/3500/files/80616816681-01_3cbd15b6-a96f-476b-aee0-4ac2feb65884.webp?v=1777994020',
    source: 'speedo.in product gallery',
  },
  facts: [
    { k: 'Material', v: 'Lightweight, latex-free silicone' },
    { k: 'Fit', v: 'Extra volume for medium to long hair; snag-free' },
    { k: 'Purpose', v: 'Helps protect hair against chlorine (maker); rinse and wipe dry after each swim' },
    { k: 'Price', v: '₹999 on speedo.in (in stock on the check date)' },
  ],
  evidence: [
    { label: '7 Best Swim Caps, Recommended by Olympians — Speedo Silicone Long Hair Swim Cap, best for long hair', publisher: 'Good Housekeeping', url: 'https://www.goodhousekeeping.com/what-to-buy/g71071646/best-swim-cap-reviews/' },
    { label: 'Best swimming caps: our 8 top picks — Speedo Long Hair swim cap, best for medium-length hair', publisher: 'Runner’s World UK', url: 'https://www.runnersworld.com/uk/gear/clothes/g40240411/best-swimming-caps/' },
    { label: 'Long Hair Silicone Swim Cap — specifications', publisher: 'Speedo India', url: 'https://www.speedo.in/products/long-hair-cap-black-80616816681' },
  ],
  match: { brand: '^speedo$', model: 'long\\s*hair', note: 'Speedo Long Hair cap not found on Flipkart / Amazon.in in this dataset; other Speedo caps are not counted as this model.' },
};
