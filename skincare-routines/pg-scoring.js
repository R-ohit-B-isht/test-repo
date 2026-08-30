// Transparent scoring model for pigmentation/old-tan fading products. All inputs
// come from real listing signals; nothing is invented.
const WEIGHTS = {
  trust: 0.26,
  skin: 0.22,
  ingredients: 0.22,
  value: 0.16,
  experience: 0.14,
};

const CRITERIA_LABELS = {
  trust: "Brand Trust & Rating",
  skin: "Skin Safety Claims",
  ingredients: "Actives & Ingredients",
  value: "Value (₹/100g·ml)",
  experience: "Format & Coverage",
};

function overallScore(s) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + s.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10;
}

function verdict(score) {
  if (score >= 74) return { label: "Outstanding", cls: "v-best" };
  if (score >= 66) return { label: "Excellent", cls: "v-great" };
  if (score >= 56) return { label: "Good", cls: "v-good" };
  return { label: "Average", cls: "v-avg" };
}

function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}
