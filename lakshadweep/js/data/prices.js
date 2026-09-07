// Every rupee figure is an observed fare or a published tariff from the linked
// source (see sources.js). Nothing is live. `amount` is the planning figure.
// id → { label, short, amount, status, date?, fares?, unit, range, source }
import { TRANSPORT_PRICES } from './prices/transport.js';
import { GROUND_PRICES } from './prices/ground.js';

export const PRICES = Object.fromEntries(
  Object.entries({ ...TRANSPORT_PRICES, ...GROUND_PRICES }).map(([id, p]) => [id, { ...p, id }]),
);

export const FARE_STATUS = {
  seen: { label: 'seen for date', hint: 'Fare read on Google Flights / the airline for this exact date' },
  nearby: { label: 'seen, other day', hint: 'Fare read for a nearby date; this leg falls on a day not checked' },
  tariff: { label: 'fixed tariff', hint: 'Published fare; no dynamic pricing' },
  estimate: { label: 'estimate', hint: 'Guide range; confirm locally' },
  unavailable: { label: 'price n/a', hint: 'No published price found' },
};
