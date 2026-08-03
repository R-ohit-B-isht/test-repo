// Weighted scoring for term life insurance (buyer age 24, cover till 60).
// Claims record weighted highest — a term plan is only as good as its payout.
const WEIGHTS = {
  claims: 0.30,
  protection: 0.22,
  trust: 0.20,
  flexibility: 0.16,
  value: 0.12,
};

const CRITERIA_LABELS = {
  claims: "Claim Settlement Record",
  protection: "Riders & Protection Options",
  trust: "Insurer Track Record",
  flexibility: "Term & Payout Flexibility",
  value: "Premium Value (₹1 Cr)",
};

function overallScore(s) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + s.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10;
}

function verdict(score) {
  if (score >= 72) return { label: "Outstanding", cls: "v-best" };
  if (score >= 64) return { label: "Excellent", cls: "v-great" };
  if (score >= 55) return { label: "Good", cls: "v-good" };
  return { label: "Average", cls: "v-avg" };
}

function formatINR(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}
