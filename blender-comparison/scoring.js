const WEIGHTS = {
  reliability: 0.30,
  power: 0.20,
  battery: 0.15,
  capacity: 0.10,
  value: 0.15,
  support: 0.10
};

const RELIABILITY = {
  "instacuppa-4000": 8.5,
  "agaro-galaxy": 8.5,
  "instacuppa-6000": 8.5,
  "blendjet2": 5.5,
  "butterfly-flash": 8.0,
  "wonderchef-nutricup": 7.5,
  "superstud-360": 2.5
};

const SUPPORT = {
  "instacuppa-4000": 8.5,
  "agaro-galaxy": 9.0,
  "instacuppa-6000": 8.5,
  "blendjet2": 5.0,
  "butterfly-flash": 9.0,
  "wonderchef-nutricup": 8.0,
  "superstud-360": 2.0
};

function clamp10(x) { return Math.max(0, Math.min(10, x)); }

function powerScore(b) {
  // Effective power; unbranded claims are discounted 50%
  const trusted = ["InstaCuppa", "AGARO", "Butterfly", "Wonderchef", "BlendJet (USA)"];
  const w = trusted.includes(b.brand) ? b.motorWatts : b.motorWatts * 0.5;
  let s = clamp10(w / 25);
  if (b.icecrush) s = clamp10(s + 1);
  return s;
}

function batteryScore(b) { return clamp10(b.batteryMah / 600); }
function capacityScore(b) { return clamp10(b.capacityMl / 70); }

function valueScore(b) {
  // Value is reliability-adjusted: specs on a unit that dies are worth nothing
  const perf = (powerScore(b) * 0.5 + batteryScore(b) * 0.25 + capacityScore(b) * 0.25) * (RELIABILITY[b.id] / 10);
  return clamp10((perf / (b.price / 1000)) * 2.6);
}

function overallScore(b) {
  const s =
    WEIGHTS.reliability * RELIABILITY[b.id] +
    WEIGHTS.power * powerScore(b) +
    WEIGHTS.battery * batteryScore(b) +
    WEIGHTS.capacity * capacityScore(b) +
    WEIGHTS.value * valueScore(b) +
    WEIGHTS.support * SUPPORT[b.id];
  return Math.round(s * 10) / 10;
}

function scoreBreakdown(b) {
  return {
    reliability: RELIABILITY[b.id],
    power: Math.round(powerScore(b) * 10) / 10,
    battery: Math.round(batteryScore(b) * 10) / 10,
    capacity: Math.round(capacityScore(b) * 10) / 10,
    value: Math.round(valueScore(b) * 10) / 10,
    support: SUPPORT[b.id],
    overall: overallScore(b)
  };
}

function rankedBlenders() {
  return [...BLENDERS].sort((a, b) => overallScore(b) - overallScore(a));
}

if (typeof module !== "undefined") module.exports = { overallScore, scoreBreakdown, rankedBlenders, WEIGHTS };
