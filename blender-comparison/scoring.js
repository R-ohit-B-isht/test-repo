// Weighted scoring model (out of 100). Reliability weighted highest —
// the requester's previous blender (SUPERSTUD 360W) died twice despite
// spec-sheet-topping numbers.
const WEIGHTS = {
  reliability: 0.25,
  power: 0.20,
  battery: 0.15,
  value: 0.15,
  support: 0.15,
  capacity: 0.10,
};

const CRITERIA_LABELS = {
  reliability: "Reliability & Build",
  power: "Blending Power",
  battery: "Battery Life",
  value: "Value for Money",
  support: "Brand & Service (India)",
  capacity: "Jar Capacity",
};

function overallScore(b) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + b.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10; // out of 100, 1 decimal
}

function verdict(score) {
  if (score >= 80) return { label: "Outstanding", cls: "v-best" };
  if (score >= 70) return { label: "Excellent", cls: "v-great" };
  if (score >= 58) return { label: "Good", cls: "v-good" };
  return { label: "Average", cls: "v-avg" };
}

function formatINR(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}
