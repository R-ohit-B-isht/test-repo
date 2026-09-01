// Weighted scoring model (out of 100). Brand trust & buyer rating weighted highest —
// a wash from a brand with no track record and no reviews is a gamble regardless of
// its claims — then skin safety (free-from / pH / derm-tested), ingredients, experience. Price is shown but not scored.
const WEIGHTS = {
  trust: 0.30,
  skin: 0.26,
  ingredients: 0.26,
  experience: 0.18,
};

const CRITERIA_LABELS = {
  trust: "Brand Trust & Rating",
  skin: "Skin Safety Claims",
  ingredients: "Ingredients",
  experience: "Shower Experience",
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
