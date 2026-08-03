// Rendering + interaction. Strategy pattern for sorting; re-render on state change.
const SORT_STRATEGIES = {
  score: (a, b) => overallScore(b) - overallScore(a) || b.scores.claims - a.scores.claims || premOf(a) - premOf(b),
  claims: (a, b) => b.scores.claims - a.scores.claims || overallScore(b) - overallScore(a) || premOf(a) - premOf(b),
  protection: (a, b) => b.scores.protection - a.scores.protection || overallScore(b) - overallScore(a) || premOf(a) - premOf(b),
  trust: (a, b) => b.scores.trust - a.scores.trust || overallScore(b) - overallScore(a) || premOf(a) - premOf(b),
  priceAsc: (a, b) => premOf(a) - premOf(b) || overallScore(b) - overallScore(a),
  priceDesc: (a, b) => premOf(b) - premOf(a) || overallScore(b) - overallScore(a),
  brand: (a, b) => a.brand.localeCompare(b.brand) || overallScore(b) - overallScore(a),
};

function premOf(s) { return s.price || 9999; }

const state = { sort: "score", type: "all", maxPrice: 600 };

function filteredPacks() {
  return PACKS
    .filter((s) => !s.price || s.price <= state.maxPrice)
    .filter((s) => {
      if (state.type === "all") return true;
      if (state.type === "csr99") return parseFloat(s.fullSpec.csr) >= 99;
      if (state.type === "quoted") return s.price > 0;
      if (state.type === "till85") return parseInt(s.fullSpec.maxCoverAge) >= 85;
      if (state.type === "tierA") return /LIC|HDFC|ICICI|SBI|Axis Max|Tata AIA/.test(s.brand);
      return true;
    })
    .sort(SORT_STRATEGIES[state.sort]);
}

function barRows(s) {
  return Object.keys(WEIGHTS)
    .map((k) => {
      const v = s.scores[k];
      return `<div class="bar-row"><span>${CRITERIA_LABELS[k]}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${v * 10}%"></div></div>
        <span>${v.toFixed(1)}</span></div>`;
    })
    .join("");
}

const FULL_SPEC_SECTIONS = [
  {
    title: "Claims & Cost",
    fields: {
      csr: "Claim settlement ratio",
      startingPremium1Cr: "Starting premium (₹1 Cr)",
      insurer: "Insurer",
      planType: "Plan type",
    },
  },
  {
    title: "Term & Eligibility",
    fields: {
      entryAge: "Minimum entry age",
      maxCoverAge: "Max cover age",
      suitTill60: "Cover 24 → 60 possible",
      payoutOptions: "Payout options",
    },
  },
  {
    title: "Extras",
    fields: {
      riders: "Riders referenced",
      smokerRates: "Smoker rates",
      taxBenefit: "Tax benefit",
      source: "Source",
    },
  },
];

function fullSpecHtml(s) {
  if (!s.fullSpec) return "";
  const sections = FULL_SPEC_SECTIONS.map((sec) => {
    const rows = Object.keys(sec.fields)
      .filter((k) => s.fullSpec[k])
      .map((k) => `<div class="detail-row"><span class="detail-key">${sec.fields[k]}</span><span class="detail-val">${s.fullSpec[k]}</span></div>`)
      .join("");
    return rows ? `<div class="spec-section"><h4 class="spec-section-title">${sec.title}</h4>${rows}</div>` : "";
  }).join("");
  return `<details class="detail-specs full-specs"><summary>Full plan sheet (all details)</summary>${sections}</details>`;
}

function buyHtml(s) {
  if (!s.buyUrl) return "";
  return `<a class="buy-btn" href="${s.buyUrl}" target="_blank" rel="noopener noreferrer">View on ${s.buyStore} \u2197</a>`;
}

function cardHtml(s, i) {
  const score = overallScore(s);
  const v = verdict(score);
  const topPick = i === 0 && state.sort === "score";
  return `<article class="card ${topPick ? "top-pick" : ""}">
    <span class="rank ${topPick ? "gold" : ""}">#${i + 1}${topPick ? " Top Pick" : ""}</span>
    <div><span class="score-pill">${score}</span>
      <div class="brand">${s.brand}</div>
      <h2>${s.model}</h2>
    </div>
    <div class="price">${s.price ? formatINR(s.price) + "/mo (₹1 Cr, starting)" : "Quote required"}</div>
    <span class="verdict ${v.cls}">${v.label} \u2014 ${score}/100</span>
    <p class="highlight">${s.highlight}</p>
    <p class="specs"><strong>${s.capacityLine}</strong> \u00B7 ${s.materialLine}<br>
      ${s.featureLine}</p>
    <div class="bars">${barRows(s)}</div>
    ${fullSpecHtml(s)}
    <div class="pros-cons">
      <ul class="pros">${s.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
      <ul class="cons">${s.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
    ${buyHtml(s)}
  </article>`;
}

function tableHtml(items) {
  const specCols = FULL_SPEC_SECTIONS.flatMap((sec) =>
    Object.entries(sec.fields).map(([key, label]) => ({ key, label, section: sec.title }))
  );
  const groupRow = `<tr class="group-row"><th class="sticky-col" colspan="2"></th><th colspan="2"></th>${FULL_SPEC_SECTIONS.map((sec) => `<th colspan="${Object.keys(sec.fields).length}" class="group-head">${sec.title}</th>`).join("")}<th></th></tr>`;
  const head = `<tr>
    <th class="sticky-col" data-sort="score">Rank</th><th class="sticky-col sticky-col-2" data-sort="brand">Insurer / Plan</th>
    <th data-sort="priceAsc">Premium</th><th data-sort="score">Score</th>
    ${specCols.map((c) => `<th${c.key === "csr" ? ' data-sort="claims"' : ""}>${c.label}</th>`).join("")}
    <th>Link</th></tr>`;
  const rows = items
    .map((s, i) => `<tr><td class="sticky-col">#${i + 1}</td><td class="sticky-col sticky-col-2">${s.brand} ${s.model}</td>
      <td>${s.price ? formatINR(s.price) + "/mo" : "Quote req."}</td>
      <td class="score-cell">${overallScore(s)}</td>
      ${specCols.map((c) => `<td>${(s.fullSpec && s.fullSpec[c.key]) || "\u2014"}</td>`).join("")}
      <td>${s.buyUrl ? `<a class="buy-link" href="${s.buyUrl}" target="_blank" rel="noopener noreferrer">${s.buyStore}</a>` : "\u2014"}</td></tr>`)
    .join("");
  return `<table>${groupRow}${head}${rows}</table>`;
}

function render() {
  const items = filteredPacks();
  document.getElementById("cards").innerHTML = items.map(cardHtml).join("");
  document.getElementById("table").innerHTML = tableHtml(items);
  document.getElementById("count").textContent = `${items.length} plans`;
  document.querySelectorAll("#table th[data-sort]").forEach((th) =>
    th.addEventListener("click", () => setSort(th.dataset.sort))
  );
}

function setSort(key) {
  state.sort = key;
  document.getElementById("sort").value = key in SORT_STRATEGIES ? key : "score";
  render();
}

function initDevMode() {
  const params = new URLSearchParams(location.search);
  if (params.get("dev") === "1") {
    document.body.classList.add("dev");
    console.table(PACKS.map((s) => ({
      plan: `${s.brand} ${s.model}`,
      premium: s.price || null,
      score: overallScore(s),
      claims: s.scores.claims,
      csr: s.fullSpec.csr,
      maxCoverAge: s.fullSpec.maxCoverAge,
    })));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  document.getElementById("type").addEventListener("change", (e) => { state.type = e.target.value; render(); });
  document.getElementById("maxPrice").addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    document.getElementById("maxPriceLabel").textContent = formatINR(state.maxPrice);
    render();
  });
  initDevMode();
  render();
});
