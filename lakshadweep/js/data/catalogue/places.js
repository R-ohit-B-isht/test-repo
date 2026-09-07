// Islands and landmarks. Fields:
//   at     map point (PLACES id)        bases  day bases where this fits
//   reach  base | excursion | nolanding | portcall | overnight | noaccess
//   key    PRICES id charged when picked  slots  how much of a day it takes (of 4)
//   on     picked by default             pair   prefer the same day as this item
const inhabited = (id, name, at, hint, extra = {}) => ({ id, name, group: 'inhabited', icon: 'island', at, bases: [at], reach: 'base', hint, slots: 1, source: 'wikiLakshadweep', ...extra });
const portcall = (id, name, at, hint) => inhabited(id, name, at, hint, { reach: 'portcall', on: false, note: 'Only via the ship’s port call or a separate vessel; add nights' });

export const ISLANDS = [
  inhabited('agatti', 'Agatti Island', 'Agatti', 'Airstrip island · village walk', { on: true }),
  inhabited('kavaratti', 'Kavaratti Island', 'Kavaratti', 'Capital · only ATMs', { on: true }),
  inhabited('minicoy', 'Minicoy Island', 'Minicoy', 'Southernmost · Samudram stop', { on: true }),
  inhabited('kalpeni', 'Kalpeni Island', 'Kalpeni', 'Three islets · Samudram stop', { on: true }),
  portcall('kadmat', 'Kadmat Island', 'Kadmat', 'Long lagoon · dive centre'),
  portcall('andrott', 'Andrott Island', 'Andrott', 'Largest · east-west island'),
  portcall('amini', 'Amini Island', 'Amini', 'Coral-stone carving'),
  portcall('kiltan', 'Kiltan Island', 'Kiltan', 'Northern atoll'),
  portcall('chetlat', 'Chetlat Island', 'Chetlat', 'Northern atoll'),
  portcall('bitra', 'Bitra Island', 'Bitra', 'Smallest inhabited'),
  {
    id: 'bangaram', name: 'Bangaram Island', group: 'uninhabited', icon: 'boat', at: 'Bangaram', bases: ['Agatti'],
    reach: 'excursion', key: 'bangaramBoat', slots: 2, on: false, hint: 'Shared day boat from Agatti, ~1 h', source: 'dreamtrip',
  },
  {
    id: 'thinnakara', name: 'Thinnakara Island', group: 'uninhabited', icon: 'island', at: 'Thinnakara', bases: ['Agatti'],
    reach: 'excursion', key: 'bangaramBoat', pair: 'bangaram', slots: 1, on: false, hint: 'Same boat as Bangaram', source: 'dreamtrip',
  },
  {
    id: 'kalpitti', name: 'Kalpitti Island', group: 'uninhabited', icon: 'walk', at: 'Kalpitti', bases: ['Agatti'],
    reach: 'base', slots: 1, on: true, hint: 'Sandbank off Agatti’s south tip · low tide', source: 'wikiLakshadweep',
  },
  {
    id: 'cheriyam', name: 'Cheriyam Island', group: 'uninhabited', icon: 'island', at: 'Cheriyam', bases: ['Kalpeni'],
    reach: 'excursion', key: 'charter', slots: 1, on: false, hint: 'Islet off Kalpeni · short boat', note: 'Only if the Samudram shore day allows', source: 'wikiLakshadweep',
  },
  {
    id: 'tilakkam', name: 'Tilakkam Islets', group: 'uninhabited', icon: 'island', at: 'Tilakkam', bases: ['Kalpeni'],
    reach: 'excursion', key: 'charter', slots: 1, on: false, hint: 'Kalpeni lagoon islets', note: 'Only if the Samudram shore day allows', source: 'wikiLakshadweep',
  },
  {
    id: 'pitti', name: 'Pitti Island', group: 'uninhabited', icon: 'bird', at: 'Pitti', bases: ['Kavaratti'],
    reach: 'nolanding', key: 'charter', slots: 2, on: false, hint: 'Bird sanctuary 24 km north of Kavaratti · view from the boat', note: 'Landing prohibited: tern nesting sanctuary', source: 'wikiLakshadweep',
  },
  {
    id: 'suheli', name: 'Suheli Par', group: 'uninhabited', icon: 'ban', at: 'Suheli', bases: [],
    reach: 'noaccess', slots: 2, on: false, hint: 'Uninhabited atoll · no regular boats', note: 'No public service; not bookable', source: 'wikiLakshadweep',
  },
];

const mark = (id, name, at, icon, hint, extra = {}) => ({ id, name, group: 'landmark', icon, at, bases: [at], reach: 'base', slots: 1, on: true, hint, source: 'samudram', ...extra });

export const LANDMARKS = [
  mark('agattiBeach', 'Agatti Lagoon Beach', 'Agatti', 'sun', 'West shore · sunset side', { source: 'dreamtrip' }),
  mark('ujra', 'Ujra Mosque', 'Kavaratti', 'mosque', 'Driftwood ceiling · dress modestly'),
  mark('aquarium', 'Kavaratti Marine Aquarium', 'Kavaratti', 'aquarium', 'Near the jetty · small entry fee'),
  mark('thundi', 'Thundi Beach', 'Kavaratti', 'sun', 'Kavaratti’s white-sand lagoon beach'),
  mark('minicoyLight', 'Minicoy Lighthouse', 'Minicoy', 'light', '1885 · climb for the atoll view'),
  {
    id: 'pittiReefs', name: 'Pitti Bird Sanctuary reefs', group: 'landmark', icon: 'snorkel', at: 'Pitti', bases: ['Kavaratti'],
    reach: 'nolanding', key: 'charter', pair: 'pitti', slots: 1, on: false, hint: 'Snorkel off the boat, same trip as Pitti', note: 'No landing on the sandbank', source: 'wikiLakshadweep',
  },
];
