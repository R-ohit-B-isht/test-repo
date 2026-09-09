import { STOP_GEO } from './data/geo.js';
import { isoLocal } from './clock.js';

// Open-Meteo adapter (no key, non-commercial). One call per stop + date:
// current conditions, the day's hourly temperature / rain chance and the
// daily summary, all in Vietnam time. Forecasts reach ~15 days ahead; for a
// later date the API answers with an error and we say so instead of guessing.

const API = 'https://api.open-meteo.com/v1/forecast';
const TZ = 'Asia/Ho_Chi_Minh';
const REACH = 15;

// WMO weather codes → icon + short label.
const CODES = [
  [[0], 'sun', 'Clear'], [[1], 'sun', 'Mostly clear'], [[2], 'cloud', 'Partly cloudy'], [[3], 'cloud', 'Overcast'],
  [[45, 48], 'fog', 'Fog'], [[51, 53, 55, 56, 57], 'rain', 'Drizzle'], [[61, 63, 65, 66, 67], 'rain', 'Rain'],
  [[71, 73, 75, 77, 85, 86], 'rain', 'Snow'], [[80, 81, 82], 'rain', 'Showers'], [[95, 96, 99], 'bolt', 'Thunderstorm'],
];
export const codeInfo = (code) => {
  const hit = CODES.find(([cs]) => cs.includes(code));
  return hit ? { icon: hit[1], label: hit[2] } : { icon: 'cloud', label: 'Unknown' };
};
export const isWet = (code) => code >= 51;

const shift = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoLocal(d);
};

const hourOf = (t) => Number(t.slice(11, 13));

const shape = (d, iso) => {
  const hours = (d.hourly?.time || []).map((t, i) => ({
    h: hourOf(t), temp: Math.round(d.hourly.temperature_2m[i]), rain: d.hourly.precipitation_probability[i] ?? null,
    ...codeInfo(d.hourly.weather_code[i]), code: d.hourly.weather_code[i],
  })).filter((_, i) => d.hourly.time[i].startsWith(iso));
  const cur = d.current;
  const day = d.daily;
  return {
    iso,
    current: cur ? { temp: Math.round(cur.temperature_2m), ...codeInfo(cur.weather_code), code: cur.weather_code, day: cur.is_day === 1, at: cur.time } : null,
    hours,
    daily: day ? {
      hi: Math.round(day.temperature_2m_max[0]), lo: Math.round(day.temperature_2m_min[0]), rain: day.precipitation_probability_max[0] ?? null,
      sunrise: day.sunrise[0].slice(11, 16), sunset: day.sunset[0].slice(11, 16), ...codeInfo(day.weather_code[0]),
    } : null,
    wetDay: (day?.precipitation_probability_max[0] ?? 0) >= 60 || hours.filter((h) => isWet(h.code)).length >= 4,
  };
};

// Resolves to { ok: true, ...forecast } or { ok: false, opens, reason }.
export async function fetchWeather(stopId, iso, signal) {
  const [lat, lon] = STOP_GEO[stopId] || STOP_GEO.hanoi;
  const live = iso === isoLocal(new Date());
  const q = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: TZ, start_date: iso, end_date: iso,
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    ...(live ? { current: 'temperature_2m,weather_code,is_day' } : {}),
  });
  const r = await fetch(`${API}?${q}`, { signal });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) {
    const range = /out of allowed range/.test(d.reason || '');
    return { ok: false, opens: range ? shift(iso, -REACH) : null, reason: d.reason || `Open-Meteo is not answering (${r.status})` };
  }
  return { ok: true, ...shape(d, iso) };
}
