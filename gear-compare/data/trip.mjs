// The trip the Lakshadweep tab is built for, and the five needs the user approved for it. Each need points at one
// ranked category; the page shows that category's #1 listing with its evidence, and links to the full list. The
// "look for" / "not this" lines are what the category's classifier and fields actually credit or reject — copy for
// the reader, mirrored in scripts/sites/<category>.mjs — never a claim about a particular listing.
export default {
  id: 'lakshadweep',
  label: 'Lakshadweep',
  kicker: 'LAKSHADWEEP TRIP',
  where: 'Agatti · Bangaram · Thinnakara · Kavaratti — reef flats, coral rubble, boat transfers, lagoons, unlit island paths',
  lede: 'Five things the organiser set does not cover, each ranked the same way as everything else on this site: what the maker page or marketplace spec table states, not the title. Slippers and water shoes are two different needs — see why below.',
  needs: [
    {
      id: 'water-shoes', label: 'Beach water shoes', category: 'water-shoes',
      pick: { segments: ['shoe'], note: 'Picked from pairs whose spec row or maker page names a real outsole; aqua socks and unstated soles stay on the full list.' },
      why: 'Reef flats and coral rubble cut feet; boat steps, jetties and wet rock are slick. A closed-toe shoe with a real rubber sole that drains and dries is the footwear for the wet half of the trip.',
      lookFor: ['Closed toe or stated toe cover', 'Rubber / TPR outsole, wet-grip or anti-slip stated in a spec row', 'Drainage holes or quick-drain stated', 'Quick-dry mesh or neoprene upper'],
      notThis: ['“Waterproof” trekking shoes, sneakers or boots — a membrane keeps water out on a trail; in the sea it fills and never drains', 'Gumboots, rain boots, PVC safety shoes, shoe covers', 'Thin aqua socks with a fabric sole — listed separately as “aqua socks”, not as shoes', 'Slippers, sandals, floaters, Crocs, sliders'],
    },
    {
      id: 'swim-caps', label: 'Swimming cap', category: 'swim-caps',
      why: 'Keeps hair out of the mask strap and salt and sun off it on snorkel days. Silicone seals and lasts; lycra soaks through.',
      lookFor: ['Silicone stated as the material', 'Room for long / thick hair if you need it', 'Seamless or wrinkle-free moulding', 'Ear coverage'],
      notThis: ['Shower caps, hair-treatment / heating caps, bonnets, disposable caps', 'Kids-only caps', 'Cap + goggles combos (those are listed under goggles)'],
    },
    {
      id: 'swim-goggles', label: 'Swimming goggles', category: 'swim-goggles',
      why: 'For the lagoon and pool swims that do not need a snorkel mask. Anti-fog, UV protection and a silicone seal are what make a goggle usable in bright open water.',
      lookFor: ['Anti-fog coating stated', 'UV protection stated', 'Silicone gaskets / seal', 'Adjustable strap and nose bridge; mirrored or polarised lens for glare'],
      notThis: ['Snorkel masks, scuba masks, full-face masks — a different tool, not compared here', 'Ski, safety or motorcycle goggles', 'Cases, straps or spare parts sold alone'],
    },
    {
      id: 'headlamps', label: 'Headlight torch', category: 'headlamps',
      why: 'Island power cuts and unlit paths after dark; a head torch leaves both hands free on a boat deck. Rechargeable with a red mode is the useful spec, not a lumen number in a title.',
      lookFor: ['Lumens stated in a spec row (a title figure counts for nothing)', 'Rechargeable battery with stated capacity, or AAA', 'Water resistance rating (IPX4 and up)', 'Red light mode; weight'],
      notThis: ['Vehicle headlights — car / bike / scooter lamps, H4 / H7 bulbs, LED projector lamps', 'Lanterns, book lights, table lamps', 'Bulbs, mounts or straps sold alone'],
    },
    {
      id: 'flip-flops', label: 'Slippers / flip-flops', category: 'flip-flops',
      pick: { segments: ['thong', 'slider', 'slipper'], note: 'Picked from flip-flops, sliders and open slippers; closed-toe clogs stay on the full list.' },
      why: 'The dry-side shoe: room, shower, jetty walk, evenings once the water shoes are soaked and salty. Cheap, quick to dry, grippy sole.',
      lookFor: ['Rubber / EVA sole with anti-slip stated', 'Water-friendly strap material stated', 'Weight', 'Warranty from a named maker'],
      notThis: ['Water shoes, aqua shoes, swimming shoes — those are the water-shoes list', 'Fur / winter / indoor fuzzy slippers', 'Sports sandals with heel straps, heels, formal footwear', 'Kids-only pairs, hotel disposables'],
    },
  ],
  // The explicit answer to "can water shoes replace slippers?"
  shoesVsSlippers: {
    title: 'Water shoes are not slippers, and slippers are not water shoes.',
    body: 'On reef flats, coral rubble, boat steps and wet rock you want a closed-toe water shoe: a rubber sole that grips wet, a toe that takes a knock, and drainage so it empties and dries. That shoe is soaked and salty by afternoon. For the room, the shower, the jetty and the evening you want a slipper that dries in minutes and costs little. One pair of each; neither replaces the other. And “waterproof” is the opposite of what a beach shoe needs — a waterproof shoe fills with sea water and stays full.',
    wet: ['Reef flats and coral rubble', 'Snorkel entries over rock', 'Boat and kayak transfers', 'Wet jetties and slick steps'],
    dry: ['Room and bathroom', 'Evening walks on sand and paths', 'Drying off after the swim', 'Anything once the water shoes are wet'],
  },
  caveats: [
    'Rankings are read from what a maker page or marketplace spec table states. A listing that only says “anti-slip” or “waterproof” in its title earns nothing for it.',
    'Reference ceilings on these five lists are official products from makers that publish their specs; where the maker sells only outside India, the card says so and no in-list rank is claimed.',
    'None of this is lab-tested or worn on a reef by us.',
  ],
};
