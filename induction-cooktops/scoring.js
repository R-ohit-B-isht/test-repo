// Weighted scoring model (out of 100). Build & reliability and safety weighted
// high — the requester has been burned by appliances that looked good on specs
// but died early; heating power decides real cooking speed.
const WEIGHTS = {
  power: 0.24,
  safety: 0.22,
  build: 0.22,
  usability: 0.14,
  features: 0.10,
  looks: 0.08,
};

const CRITERIA_LABELS = {
  power: "Heating Power & Speed",
  safety: "Safety & Protection",
  build: "Build & Reliability",
  usability: "Controls & Ease of Use",
  features: "Presets & Features",
  looks: "Looks & Design",
};

function overallScore(s) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + s.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10; // out of 100, 1 decimal
}

function verdict(score) {
  if (score >= 78) return { label: "Outstanding", cls: "v-best" };
  if (score >= 70) return { label: "Excellent", cls: "v-great" };
  if (score >= 60) return { label: "Good", cls: "v-good" };
  return { label: "Average", cls: "v-avg" };
}

function formatINR(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}
