// Weighted scoring model (out of 100). Dust/water sealing weighted highest —
// the requester specifically wants to avoid mesh uppers that let sand and
// dirt in, and values looks, comfort and materials.
const WEIGHTS = {
  sealing: 0.25,
  comfort: 0.20,
  grip: 0.20,
  build: 0.15,
  looks: 0.10,
  value: 0.10,
};

const CRITERIA_LABELS = {
  sealing: "Dust & Water Sealing",
  comfort: "Comfort & Cushioning",
  grip: "Grip & Trail Traction",
  build: "Build & Materials",
  looks: "Looks & Design",
  value: "Value for Money",
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
