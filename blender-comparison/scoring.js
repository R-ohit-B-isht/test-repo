// Weighted scoring model (out of 100). Build & reliability weighted highest —
// a blender whose motor burns out or battery dies is useless regardless of
// specs — then blending power (motor/blades), battery & charging, usability, features.
const WEIGHTS = {
  build: 0.26,
  power: 0.22,
  battery: 0.22,
  usability: 0.16,
  features: 0.14,
};

const CRITERIA_LABELS = {
  build: "Build & Reliability",
  power: "Blending Power",
  battery: "Battery & Charging",
  usability: "Usability & Cleaning",
  features: "Features & Safety",
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
