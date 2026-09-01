// Weighted scoring model (out of 100). Brand trust & buyer rating weighted highest —
// a product from a brand with no track record and no reviews is a gamble regardless of
// its claims — then skin safety, actives/ingredients, value, format & experience.
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
  value: "Value (\u20B9/100g\u00B7ml)",
  experience: "Format & Experience",
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
