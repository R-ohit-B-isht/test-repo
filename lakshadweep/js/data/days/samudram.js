// SPORTS Samudram cruise blocks. `pkg: true` = kayak, snorkel, glass-bottom
// boat and sightseeing on that shore day are inside the package (scuba is not).
export const SAMUDRAM_BLOCKS = {
  samudramBoard: {
    icon: 'ship', place: 'Kochi → at sea', nav: 'Ship', photo: 'ship', base: 'sea', at: ['Kochi', 'Minicoy'], free: ['night'],
    title: 'Board M.V. Kavaratti',
    fixed: [{ ic: 'permit', t: 'SPORTS check-in at the wharf' }, { ic: 'ship', t: 'Cabin, meals, transfers: all in the package' }, { ic: 'sun', t: 'Sail at dusk' }],
    meals: { b: 'fortKochi', l: 'samudram', d: 'samudram' },
    stay: 'cabin',
    spend: [{ key: 'kochiBus' }, { key: 'samudramGold', package: true }],
  },
  samudramMinicoy: {
    icon: 'island', place: 'Minicoy', nav: 'Minicoy', base: 'Minicoy', at: 'Minicoy', pkg: true,
    title: 'Southernmost atoll',
    fixed: [{ ic: 'boat', t: 'Tender ashore ~09:00; back aboard by 17:00' }],
    meals: { b: 'samudram', l: 'samudramShore', d: 'samudram' },
    stay: 'cabin',
    spend: [],
  },
  samudramKavaratti: {
    icon: 'glass', place: 'Kavaratti', nav: 'Kavaratti', photo: 'kavaratti', base: 'Kavaratti', at: 'Kavaratti', pkg: true,
    title: 'Capital for a day',
    fixed: [{ ic: 'boat', t: 'Shore day; sail north overnight' }],
    meals: { b: 'samudram', l: 'samudramShore', d: 'samudram' },
    stay: 'cabin',
    spend: [],
  },
  samudramKalpeni: {
    icon: 'wave', place: 'Kalpeni', nav: 'Kalpeni', base: 'Kalpeni', at: 'Kalpeni', pkg: true,
    title: 'Three islets, one lagoon',
    fixed: [{ ic: 'dance', t: 'Storm bank of coral debris · folk dance ashore' }],
    meals: { b: 'samudram', l: 'samudramShore', d: 'samudram' },
    stay: 'cabin',
    spend: [],
  },
  samudramReturn: {
    icon: 'ship', place: 'At sea → Kochi', nav: 'Kochi', photo: 'kochi', base: 'Kochi', at: 'Kochi', cap: 2, free: ['pm', 'night'],
    title: 'Back to Willingdon Island',
    fixed: [{ ic: 'ship', t: 'Dock by morning' }, { ic: 'bus', t: 'Bus to Fort Kochi' }],
    meals: { b: 'samudram', l: 'kayees', d: 'harbour' },
    stay: 'zostel',
    spend: [{ key: 'kochiBus' }],
  },
};
