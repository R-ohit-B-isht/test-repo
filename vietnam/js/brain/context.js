import { TRIP, STOPS } from '../data/trip.js';
import { DAYS, SLOTS, slotFor, sleepFor, mealsFor } from '../data/days.js';
import { EXTRA_STOPS, catalogOf, activityInr, isExtra, isFun } from '../data/activities.js';
import { STRATEGIES } from '../strategies.js';
import { computeBudget, compareStrategies } from '../budget.js';
import { MAX_PER_DAY, dayOf } from '../plan.js';

// Everything Gemini needs to edit the plan, as compact text lines, plus the
// JSON shape it must answer with. No prose about Vietnam — the catalog is the
// source of truth, the model only flips switches and dials.

const STOP_IDS = [...STOPS, ...EXTRA_STOPS].map((s) => s.id);

const flag = (on, label) => (on ? label : '');

const actLine = (x, state, plan) => {
  const inr = activityInr(x, state.travellers);
  const where = x.closed ? 'closed' : isExtra(x) ? `needs +${EXTRA_STOPS.find((s) => s.id === x.stop).days}d` : dayOf(plan, x.id) != null ? `D${dayOf(plan, x.id)}` : plan.noRoom.includes(x.id) ? 'ON-NO-ROOM' : plan.bundled.has(x.id) ? 'in-tour' : 'off';
  return [x.id, x.name, x.stop, isFun(x) ? 'fun' : 'see', `${x.slot}/${x.h}h`, inr == null ? 'free' : `₹${inr}${x.est ? '~' : ''}`, state.picks[x.id] ? 'ON' : 'off', where, flag(x.must, '★must'), flag(x.tag, `#${x.tag}`), flag(x.est, 'gemini-added'), x.note || ''].filter(Boolean).join(' | ');
};

const dayLine = (d, transit, hops) => {
  const slots = SLOTS.map((k) => {
    const s = slotFor(d, k, transit, hops);
    return `${k}:${s.fixed ? `FIXED(${s.text})` : `${s.stops.join('/')} ${s.h}h`}`;
  }).join(' · ');
  const meals = mealsFor(d, transit).map((m) => m.name).join(', ');
  return `D${d.n} ${d.title} — ${slots} · eat: ${meals} · sleep: ${sleepFor(d, transit).name}`;
};

export function buildContext(state) {
  const b = computeBudget(state);
  const transit = b.strategy.transit;
  const totals = compareStrategies(state, STRATEGIES.map((s) => s.id)).map((c) => `${c.id}=₹${c.total}`).join(', ');
  return [
    `TRIP: ${TRIP.days} days ${TRIP.start} from ${TRIP.origin}. Route middle→north (Hoi An, Da Nang, Hue, Hanoi, Ninh Binh, Ha Long).`,
    `DIALS: travellers=${state.travellers} strategy=${state.strategy} berth=${state.berth} bed=₹${state.bed}/night food=₹${state.food}/day local=₹${state.local}/day buffer=${state.buffer}%`,
    `STRATEGIES (₹ per person, all-in): ${totals}. Ids: ${STRATEGIES.map((s) => `${s.id}=${s.name}`).join('; ')}.`,
    `BUDGET NOW: total ₹${b.total} pp · ${b.lines.map((l) => `${l.id}=₹${l.amount}`).join(' ')}`,
    `RULES: max ${MAX_PER_DAY} fun picks a day; 'see' picks never take a slot. Packing is automatic — you only switch ids ON/off.`,
    `DAYS:`,
    ...DAYS.map((d) => dayLine(d, transit, state.hops)),
    `CATALOG (id | name | stop | kind | slot/hours | ₹pp | state | placed | flags | note):`,
    ...catalogOf(state).map((x) => actLine(x, state, b.plan)),
  ].join('\n');
}

export const SYSTEM = [
  'You are the plan brain of a visual Vietnam trip planner for budget travellers from Delhi.',
  'You receive the current plan as text and the traveller\'s wish. Reply ONLY with the JSON shape requested.',
  'Edit by switching catalog ids ON or off ("on"/"off" arrays), moving dials ("set"), or adding a spot that is NOT in the catalog ("add", conservative ₹ per person estimate, exact place name).',
  'Only use ids that appear in the CATALOG. Never invent ids. Do not add a spot that already exists in the catalog — switch it on instead.',
  'Respect fixed slots and the 4-fun-a-day cap: when adding fun at a stop that is already full, switch something off at that stop or say it will show as no-room.',
  '★must items are strong recommendations, not locks — drop them if the traveller asks.',
  '"cheaper" means: lower bed/food/local dials within reason, prefer strategy bus over train over fly, switch off paid picks the traveller did not ask for; never touch flights (fixed).',
  'The traveller is fun-first: parks, boats, kayaks, cable cars, shows beat temples and museums unless asked.',
  'Keep "say" to at most two short plain sentences, no markdown, no emoji. Put one terse line per change in "why".',
  'If nothing should change, return empty arrays and explain in "say".',
].join(' ');

export const SCHEMA = {
  type: 'object',
  properties: {
    say: { type: 'string' },
    on: { type: 'array', items: { type: 'string' } },
    off: { type: 'array', items: { type: 'string' } },
    set: {
      type: 'object',
      nullable: true,
      properties: {
        travellers: { type: 'integer', nullable: true },
        strategy: { type: 'string', enum: STRATEGIES.map((s) => s.id), nullable: true },
        berth: { type: 'string', enum: ['4', '6'], nullable: true },
        bed: { type: 'integer', nullable: true },
        food: { type: 'integer', nullable: true },
        local: { type: 'integer', nullable: true },
        buffer: { type: 'integer', nullable: true },
      },
    },
    add: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          stop: { type: 'string', enum: STOP_IDS },
          slot: { type: 'string', enum: ['am', 'pm', 'night', 'any', 'day'] },
          hours: { type: 'number' },
          inr: { type: 'integer', nullable: true },
          kind: { type: 'string', enum: ['fun', 'see'] },
          note: { type: 'string', nullable: true },
        },
        required: ['name', 'stop', 'slot', 'hours', 'kind'],
      },
    },
    remove: { type: 'array', items: { type: 'string' } },
    why: { type: 'array', items: { type: 'string' } },
  },
  required: ['say', 'on', 'off', 'add', 'why'],
};
