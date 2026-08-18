// Weighted scoring model (out of 100). Build & reliability weighted highest —
// a lighter that stops sparking or whose battery dies is useless regardless of
// specs — then ignition (arc type/windproof), battery & charging, safety, features.
const WEIGHTS = {
  build: 0.26,
  ignition: 0.22,
  battery: 0.22,
  safety: 0.16,
  features: 0.14,
};

const CRITERIA_LABELS = {
  build: "Build & Reliability",
  ignition: "Ignition & Windproofing",
  battery: "Battery & Charging",
  safety: "Safety",
  features: "Features & Convenience",
};

function overallScore(s) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + s.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10; // out of 100, 1 decimal
}

function verdict(score) {
  if (score >= 74) return { label: "Outstanding", cls: "v-best" };
  if (score >= 66) return { label: "Excellent", cls: "v-great" };
  if (score >= 56) return { label: "Good", cls: "v-good" };
  return { label: "Average", cls: "v-avg" };
}

function formatINR(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}
