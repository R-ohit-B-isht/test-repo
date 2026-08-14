// Weighted scoring model (out of 100). Evidence weighted highest — a routine
// is only as good as who's behind it — then coverage of the fundamentals
// (cleanse / SPF / moisturize / treat), then realistic adherence, skin-type
// flexibility, and daily time cost.
const WEIGHTS = {
  evidence: 0.30,
  coverage: 0.24,
  adherence: 0.20,
  fit: 0.14,
  time: 0.12,
};

const CRITERIA_LABELS = {
  evidence: "Evidence & Authorship",
  coverage: "Coverage of Fundamentals",
  adherence: "Simplicity & Adherence",
  fit: "Skin-Type Flexibility",
  time: "Time Cost",
};

function overallScore(s) {
  const total = Object.keys(WEIGHTS).reduce(
    (sum, k) => sum + s.scores[k] * WEIGHTS[k],
    0
  );
  return Math.round(total * 100) / 10; // out of 100, 1 decimal
}

function verdict(score) {
  if (score >= 85) return { label: "Outstanding", cls: "v-best" };
  if (score >= 78) return { label: "Excellent", cls: "v-great" };
  if (score >= 70) return { label: "Good", cls: "v-good" };
  return { label: "Situational", cls: "v-avg" };
}
