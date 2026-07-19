// Weighted scoring model (out of 100). Dust/water sealing weighted highest —
// the requester specifically wants to avoid mesh uppers that let sand and
// dirt in, and values looks, comfort and materials.
const WEIGHTS = {
  sealing: 0.28,
  comfort: 0.22,
  grip: 0.22,
  build: 0.17,
  looks: 0.11,
};

const CRITERIA_LABELS = {
  sealing: "Dust & Water Sealing",
  comfort: "Comfort & Cushioning",
  grip: "Grip & Trail Traction",
  build: "Build & Materials",
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
