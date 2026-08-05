// Weighted scoring model (out of 100). Build & reliability weighted highest —
// a power bank that dies or degrades fast is useless regardless of specs —
// followed by charging speed and capacity, then safety and features.
const WEIGHTS = {
  build: 0.26,
  speed: 0.22,
  capacity: 0.20,
  safety: 0.18,
  features: 0.14,
};

const CRITERIA_LABELS = {
  build: "Build & Reliability",
  speed: "Charging Speed",
  capacity: "Capacity (mAh)",
  safety: "Safety Protections",
  features: "Ports & Features",
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
