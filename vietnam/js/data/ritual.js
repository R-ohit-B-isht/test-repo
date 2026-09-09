// Tiny pre-trip tasks that are not bookings (those live in checklist.js).
// `lead` = days before departure to have it done; the ritual serves the
// soonest-due open task, one a day. `href` opens a page or an official site,
// `day` opens that day's board instead.
export const MICRO = [
  { id: 'hearts', icon: 'heart', title: 'Everyone hearts their picks', hint: 'Send the plan link, each person taps ♥ on what they want. Brain sorts the fights.', lead: 35, href: 'picks.html' },
  { id: 'gcal', icon: 'calendar', title: 'Put the trip on Google Calendar', hint: 'Flights, train, tours land on the right days. Import all from the calendar page.', lead: 12, href: 'calendar.html' },
  { id: 'phrases', icon: 'music', title: 'Learn three words', hint: 'xin chào (hi) · cảm ơn (thanks) · bao nhiêu? (how much?)', lead: 10 },
  { id: 'split', icon: 'wallet', title: 'Set up Split', hint: 'Add the friends, agree who fronts the hostels. Everything else is a tap on the day.', lead: 9, href: 'split.html' },
  { id: 'bank', icon: 'shield', title: 'Tell the bank, load the forex card', hint: 'Set a travel notice so the first ATM in Hoi An does not freeze the card.', lead: 7 },
  { id: 'dong', icon: 'ticket', title: 'Know the notes', hint: '₫20,000 and ₫500,000 are both blue. Count zeros before you hand it over.', lead: 5 },
  { id: 'shots', icon: 'folder', title: 'Docs on the phone', hint: 'e-visa, passport, tickets into Manager. Works offline at the gate.', lead: 4, href: 'manager.html' },
  { id: 'typhoon', icon: 'rain', title: 'Check the typhoon map', hint: 'Central coast, late Oct. If a storm is named, look at Day 1–3 again.', lead: 3, href: 'https://www.windy.com/16.054/108.202?16.054,108.202,7' },
  { id: 'grab', icon: 'car', title: 'Install Grab, add a card', hint: 'Airport to Hoi An is a Grab, not a taxi queue. Sign up on home wifi.', lead: 3, href: 'https://www.grab.com/vn/en/download/' },
  { id: 'maps', icon: 'pin', title: 'Save the maps offline', hint: 'Google Maps → Offline maps → Hoi An, Hue, Hanoi. Night train has no signal.', lead: 2 },
  { id: 'hostel', icon: 'bed', title: 'Tell the hostels when you land', hint: 'Sat 10:50 into Da Nang; ask for early bag drop.', lead: 2 },
  { id: 'bag', icon: 'umbrella', title: 'Weigh the bag', hint: '7 kg cabin on AirAsia X. Shell jacket, sandals, dry bag on top.', lead: 1 },
  { id: 'checkin', icon: 'plane', title: 'Check in, pick seats', hint: 'AirAsia X opens 14 days out; VietJet 7. Screenshot the passes.', lead: 1 },
];
