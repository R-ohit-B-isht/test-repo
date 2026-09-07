// Where you sleep each night. `key` = PRICES id (perRoom splits it two ways);
// no key = included in a ticket or package. `conf` = how firm the lead is.
export const STAYS = {
  zostel: { name: 'Zostel Fort Kochi', sub: '4-bed AC dorm', icon: 'bunk', key: 'hostelKochi', conf: 'listed', source: 'zostel' },
  agattiHome: { name: 'Agatti homestay', sub: 'Al Fouz / Hira Residency lead', icon: 'home', key: 'homestayAgattiRoom', perRoom: true, conf: 'lead', source: 'homestays' },
  kavarattiHome: { name: 'Sithsyan Residency', sub: 'Kavaratti homestay lead', icon: 'home', key: 'homestayKavarattiRoom', perRoom: true, conf: 'lead', source: 'kavarattistays' },
  ship: { name: 'On board', sub: 'Bunk or cabin, in the ticket', icon: 'ship', conf: 'ticket', source: 'shipfares' },
  train: { name: 'Berth on 12626', sub: 'In the ticket', icon: 'train', conf: 'ticket', source: 'keralaexpress' },
  cabin: { name: 'Cabin, M.V. Kavaratti', sub: 'In the Samudram package', icon: 'ship', conf: 'package', source: 'samudram' },
  home: { name: 'Home', sub: 'Delhi', icon: 'moon', conf: 'ticket' },
};

export const STAY_CONF = {
  listed: 'Published rate',
  lead: 'Third-party listing; confirm dates',
  ticket: 'Included in the ticket',
  package: 'Included in the package',
};
