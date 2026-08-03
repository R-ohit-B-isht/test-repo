// Weighted scoring model (out of 100). Comfort/back-support and build &
// reliability weighted highest — a trekking pack that hurts your back or
// fails on the trail is useless regardless of specs; weather protection
// (rain cover) next, per the requester's dust/water priorities.
const WEIGHTS = {
  comfort: 0.26,
  build: 0.24,
  weather: 0.20,
  capacity: 0.16,
  organisation: 0.14,
};

const CRITERIA_LABELS = {
  comfort: "Comfort & Back Support",
  build: "Build & Reliability",
  weather: "Rain & Weather Protection",
  capacity: "Capacity & Load",
  organisation: "Pockets & Organisation",
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
