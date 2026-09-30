// The bag the organiser plan is built for, read off the maker's own product page on `checked`, plus the packing
// roles the planner fills. Volumes are budgets, not guaranteed cavities: Tripole publishes filled outer dimensions
// (91 × 40 × 28 cm ≈ 102 L bounding box) and a 105 L rating that includes the 15 L detachable day pack, so the main
// body is budgeted at 90 L and the planner counts every organiser at its largest stated size. Nothing here is a fit
// guarantee — it is the arithmetic a careful packer would do with the maker's numbers.
export default {
  id: 'tripole-colonel-pro-105',
  brand: 'Tripole',
  name: 'Colonel Pro Metal Frame Rucksack — 105 L (with detachable day pack + rain cover)',
  checked: '2026-09-24',
  maker: {
    label: 'tripole.in — official product page',
    url: 'https://tripole.in/products/colonel-pro-metal-frame-rucksack-front-opening-detachable-bag-rain-cover-105-litres-army-green',
    title: 'Tripole Colonel Pro Metal Frame Rucksack with Detachable Day Pack and Rain Cover for Trekking and Travelling | 5 Year Warranty (105 Ltr)',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/2360/9367/files/Tripole-Colonel-Pro-105L-Green-SharkTank.jpg?v=1748090649',
    source: 'tripole.in product gallery (first image, Army Green)',
  },
  facts: [
    { k: 'Capacity', v: '105 L including the 15 L detachable day pack' },
    { k: 'Filled dimensions', v: '91 × 40 × 28 cm (maker figure, outer, "when filled fully")' },
    { k: 'Day pack', v: '15 L detachable backpack, holds a laptop up to 15 in' },
    { k: 'Weight', v: '2.9 kg' },
    { k: 'Fabric', v: '250 GSM water-repellent PU-coated polyester; Delrin buckles, polypropylene webbing' },
    { k: 'Frame', v: 'Internal frame — hard fibre back support + aluminium rods' },
    { k: 'Openings', v: 'Top loader + front (middle) opening + bottom compartment' },
    { k: 'Rain cover', v: 'Included, stowed in the base Velcro pocket' },
    { k: 'Warranty', v: '5 years' },
    { k: 'Maker’s own advice', v: 'Page recommends its Organizer packs (cylindrical + shirt organiser set of 6) for segregating luggage — listed here if found on the marketplaces, scored like everything else' },
    { k: 'Price seen', v: '₹4,499 Army Green · ₹4,599 Black / Indian Army (tripole.in, 2026-09-24)' },
  ],
  // Budgets the planner checks against. `usable` is the fraction of the rated volume a rectangular organiser can
  // realistically occupy in a tapered, framed rucksack body — a conservative planning factor, not a measurement.
  compartments: [
    { id: 'main', label: 'Main body (top + front opening + bottom)', litres: 90, usable: 0.8, note: 'Rated 105 L minus the 15 L day pack. Tapered, framed body: budget 80 % of it for rigid-shaped organisers; the rest is for soft items, rain cover and the frame.' },
    { id: 'daypack', label: 'Detachable day pack', litres: 15, usable: 0.8, note: 'Carry-on / walk-around pack: documents, tech, one toiletry kit.' },
  ],
  // What goes where. `category` is the organiser site the pick is drawn from; `qty` is the default number of sets;
  // `into` is the compartment budget the pick counts against.
  roles: [
    { id: 'clothes', label: 'Clothes', what: 'Shirts, tees, trousers, innerwear — one cube per clothing type', category: 'packing-cubes', qty: 1, into: 'main' },
    { id: 'shoes', label: 'Shoes', what: 'One pair of shoes, soles away from clothes', category: 'shoe-bags', qty: 1, into: 'main' },
    { id: 'slippers', label: 'Slippers / sandals', what: 'Flip-flops or sandals in their own bag', category: 'shoe-bags', qty: 1, into: 'main' },
    { id: 'skincare', label: 'Skincare & toiletries', what: 'Cleanser, sunscreen, moisturiser, razor, toothbrush — leak-resistant', category: 'toiletry-bags', qty: 1, into: 'daypack' },
    { id: 'accessories', label: 'Accessories & tech', what: 'Charger, cables, power bank, earphones, watch, small accessories', category: 'tech-pouches', qty: 1, into: 'daypack' },
    { id: 'laundry', label: 'Laundry', what: 'Worn clothes, kept apart from clean ones', category: 'laundry-bags', qty: 1, into: 'main' },
    { id: 'documents', label: 'Documents', what: 'Passport, tickets, cards, cash', category: 'travel-wallets', qty: 1, into: 'daypack' },
  ],
  // Shown next to every fit verdict. The planner is arithmetic on stated sizes, nothing more.
  caveats: [
    'Volumes are rectangular boxes from each organiser’s stated outer size. A set states one size (its largest piece), so the set is estimated as that piece plus a graded tail — each further piece at 0.6× the previous, never below 0.1× — so a 7-piece set counts ≈ 2.5× its largest cube. No organiser is measured by us.',
    'The 90 L / 15 L budgets come from Tripole’s 105 L rating and filled outer dimensions; the bag’s cavity is tapered and framed, so only 80 % of each budget is treated as usable by rigid shapes.',
    'A plan that fits by volume can still fail on shape (a long cube against the frame, a boxy toiletry kit in the day pack). Treat “fits” as “worth ordering”, not as a guarantee.',
    'Sizes read from a marketplace spec table were typed by the seller; sizes that only appear in a title are shown but flagged and never treated as verified.',
  ],
};
