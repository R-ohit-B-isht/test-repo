// Weighted scoring model (out of 100). Insulation and lid seal weighted
// highest — a tumbler's job is keeping drinks at temperature without spills;
// build & material reliability next, per the requester's history with
// products that looked good on paper but failed early.
const WEIGHTS = {
  insulation: 0.26,
  lid: 0.22,
  build: 0.22,
  capacity: 0.16,
  convenience: 0.14,
};

const CRITERIA_LABELS = {
  insulation: "Insulation & Retention",
  lid: "Lid & Spill-proofing",
  build: "Build & Material",
  capacity: "Capacity",
  convenience: "Convenience & Cleaning",
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
