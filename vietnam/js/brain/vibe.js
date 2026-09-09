// Three-tap onboarding for the plan brain: vibe → budget → group. Each tap is a
// chip; the third one composes a single prompt and the Brain proposes a full
// pick set. Pure data + prompt builder — the sheet renders and wires it.

export const VIBE_STEPS = [
  {
    id: 'vibe',
    label: 'Vibe',
    options: [
      ['party', 'Party', 'beer', 'Nightlife first: beer street, bars, food walks, live music, night markets (#night picks). Keep the two must-do parks.'],
      ['adventure', 'Adventure', 'sparkle', 'Adrenaline first: theme parks, kayaking, cable cars, basket boats, caves. Drop slow temples and museums.'],
      ['nature', 'Nature', 'sun', 'Landscapes first: Ha Long, Ninh Binh boats, Marble Mountains, beaches, coconut forest. Skip theme parks unless must-do.'],
      ['chill', 'Chill', 'moon', 'Slow and easy: beach, cafés, one paid thing a day at most, early nights. Nothing before 09:00.'],
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    options: [
      ['tight', 'Tight', 'wallet', 'Money is tight: only free or cheap picks, dorm beds, bed ₹700, food ₹800 a day.'],
      ['okay', 'Okay', 'ticket', 'Normal budget: keep the good paid picks, skip anything over ₹3,000 a head unless it is a must-do.'],
      ['splash', 'Splash', 'star', 'Happy to spend: overnight Ha Long cruise, Ba Na, VinWonders, a show, bed ₹1,500.'],
    ],
  },
  {
    id: 'group',
    label: 'Group',
    options: [
      ['solo', 'Solo', 'users', 'One traveller. Set travellers to 1; group-priced boats and taxis are on me alone.'],
      ['duo', 'Two of us', 'users', 'Two travellers. Set travellers to 2.'],
      ['gang', 'Gang of 4', 'users', 'Four travellers. Set travellers to 4; group-priced boats and Grabs split four ways.'],
    ],
  },
];

export const emptyVibe = () => Object.fromEntries(VIBE_STEPS.map((s) => [s.id, '']));

export const vibeReady = (sel) => VIBE_STEPS.every((s) => sel[s.id]);

export const optionOf = (stepId, value) => VIBE_STEPS.find((s) => s.id === stepId)?.options.find((o) => o[0] === value);

// One prompt from the three taps. The Brain still only flips switches and dials;
// the packer decides where things land.
export const vibePrompt = (sel) => [
  'Build my whole pick set from scratch: switch OFF anything that does not fit, switch ON what does, across every stop.',
  ...VIBE_STEPS.map((s) => `${s.label}: ${optionOf(s.id, sel[s.id])[3]}`),
  'Fill each day up to the fun cap where it fits the vibe; leave "see" picks on when they are free and nearby.',
].join('\n');
