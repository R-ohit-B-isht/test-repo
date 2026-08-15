// Rendering + interaction. Strategy pattern for sorting; re-render on state change.
const SORT_STRATEGIES = {
  score: (a, b) => overallScore(b) - overallScore(a) || b.scores.evidence - a.scores.evidence,
  evidence: (a, b) => b.scores.evidence - a.scores.evidence || overallScore(b) - overallScore(a),
  coverage: (a, b) => b.scores.coverage - a.scores.coverage || overallScore(b) - overallScore(a),
  adherence: (a, b) => b.scores.adherence - a.scores.adherence || overallScore(b) - overallScore(a),
  timeAsc: (a, b) => a.stepsPerDay - b.stepsPerDay || overallScore(b) - overallScore(a),
  timeDesc: (a, b) => b.stepsPerDay - a.stepsPerDay || overallScore(b) - overallScore(a),
};

const state = { sort: "score", type: "all", category: "all", maxSteps: 19 };

const CATEGORY_LABELS = {
  core: "CORE DAILY",
  global: "WORLD STYLE",
  method: "NAMED METHOD",
  occasion: "OCCASION",
  concern: "CONCERN-DRIVEN",
};

// Phase classifier (Strategy-style lookup), 15-phase model. Name-based rules run
// first (most specific wins); a step's broad explicit tag (the old 7-phase set)
// is the fallback when no granular rule matches.
const PHASE_RULES = [
  ["SHAVE", /shav|razor|beard-area/i],
  ["TONE", /rose-water/i],
  ["PROTECT", /sunscreen|spf|sun protection|slip:|slop:|slap:|seek:|slide:|thanaka/i],
  ["COLD", /\bice|icing|plunge|cold bath|cold eye|cool cloth|cool care|de-puff/i],
  ["STEAM", /steam|sauna|banya|hammam|heating room/i],
  ["MASSAGE", /massage|gua sha|roller|roll upward|kobido|venik|abhyanga|lymphatic|acupressure|face yoga|cheek puff|fish face|frown preventer|eye rejuvenator|upward strokes/i],
  ["EYE", /\beye\b|eye cream|eye care|under-?eye|eye mask/i],
  ["MASK", /mask(?:s|ing)?\b|sheet mask|clay|mud|detox mask|purifying mask/i],
  ["EXFOLIATE", /exfoli|scrub|peel|kese|lulur|ubtan|dry-brush|polish|salicylic|glycolic|\bAHA\b|\bBHA\b|lactic|keratolytic|gentle file/i],
  ["TONE", /toner|tone\b|vinegar rinse|rose water|rosewater|floral|orange-blossom|astringent/i],
  ["ESSENCE", /essence|7-skin|toner layers|keshousui|hydrating lotion|mist|humectant layer|hydration loading|load hydration|light hydrator|break-time hydration|go minimal|top-ups/i],
  ["OIL", /face oil|body oil|beard oil|argan|jojoba oil seal|olive-oil seal|night oil|oil nourish|oil lock-in|oil on top/i],
  ["MASK", /masque/i],
  ["TREAT", /retino|tretinoin|adapalene|serum|treat|spot|vitamin|niacinamide|active|antioxidant|peptide|cica|red-light|extraction|saffron|turmeric|tepezcohuite/i],
  ["CLEANSE", /cleanse|wash|micellar|remover|scrap|rinse|oil pull|bathe|shower|soap|bath\b/i],
  ["SEAL", /moistur|cream|emulsion|balm|slug|occlusive|seal|lotion|hydrate|nopal|aloe|shea|butter/i],
];
function phaseOf(st) {
  for (const [label, re] of PHASE_RULES) if (re.test(st.name)) return label;
  if (st.phase) return st.phase;
  return "CARE";
}

function filteredRoutines() {
  return ROUTINES
    .filter((s) => s.stepsPerDay <= state.maxSteps)
    .filter((s) => state.category === "all" || s.category === state.category)
    .filter((s) => {
      if (state.type === "all") return true;
      if (state.type === "aad") return /AAD/.test(s.brand);
      if (state.type === "spf") return /SPF/i.test(s.fullSpec.spf) && !/not stated/i.test(s.fullSpec.spf);
      if (state.type === "exfoliation") return !/not part|not stated|discouraged|avoid/i.test(s.fullSpec.exfoliation);
      if (state.type === "actives") return !/^none/i.test(s.fullSpec.activeIngredients);
      if (state.type === "quick") return s.stepsPerDay <= 6;
      if (state.type === "shaving") return /shave|shaving|razor/i.test(JSON.stringify(s.steps));
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
    title: "Daily Structure",
    fields: {
      am: "Morning steps",
      pm: "Evening steps",
      weekly: "Weekly / cadence",
      complexity: "Steps per day",
      timeCost: "Time cost",
    },
  },
  {
    title: "What Goes On Your Skin",
    fields: {
      exfoliation: "Exfoliation",
      activeIngredients: "Active ingredients",
      spf: "Sun protection",
    },
  },
  {
    title: "Fit & Safety",
    fields: {
      skinTypes: "Best for skin types",
      cautions: "Cautions",
    },
  },
  {
    title: "Source",
    fields: {
      authorType: "Who wrote it",
      costTier: "Cost tier",
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
  return `<details class="detail-specs full-specs"><summary>Full routine sheet (all details)</summary>${sections}</details>`;
}

function stepListHtml(title, steps) {
  if (!steps || !steps.length) return "";
  return `<div class="spec-section"><h4 class="spec-section-title">${title}</h4>
    ${steps.map((st) => `<div class="detail-row"><span class="detail-key"><span class="phase-badge phase-${phaseOf(st).toLowerCase()}">${phaseOf(st)}</span>${st.name}</span><span class="detail-val">${st.how}</span></div>`).join("")}</div>`;
}

function stepsHtml(s) {
  return `<details class="detail-specs full-specs" open><summary>Step-by-step (what to do, when)</summary>
    ${stepListHtml("Morning", s.steps.morning)}
    ${stepListHtml("Evening", s.steps.evening)}
    ${stepListHtml("Weekly / cadence", s.steps.weekly)}
  </details>`;
}

function sourceHtml(s) {
  const second = s.sourceUrl2 ? ` \u00b7 <a class="buy-btn" href="${s.sourceUrl2}" target="_blank" rel="noopener noreferrer">Companion source \u2197</a>` : "";
  return `<a class="buy-btn" href="${s.sourceUrl}" target="_blank" rel="noopener noreferrer">Read the source \u2197</a>${second}`;
}

function cardHtml(s, i) {
  const score = overallScore(s);
  const v = verdict(score);
  const topPick = i === 0 && state.sort === "score";
  return `<article class="card ${topPick ? "top-pick" : ""}">
    <span class="rank ${topPick ? "gold" : ""}">#${i + 1}${topPick ? " Top Pick" : ""}</span>
    <div><span class="score-pill">${score}</span>
      <span class="cat-tag">${CATEGORY_LABELS[s.category] || ""}</span>
      <div class="brand">${s.brand}</div>
      <h2>${s.model}</h2>
    </div>
    <div class="price">${s.timePerDay} / day \u00b7 ${s.stepsPerDay} steps</div>
    <span class="verdict ${v.cls}">${v.label} \u2014 ${score}/100</span>
    <p class="highlight">${s.highlight}</p>
    <p class="specs"><strong>${s.source}</strong><br>${s.author}</p>
    <div class="bars">${barRows(s)}</div>
    ${stepsHtml(s)}
    ${fullSpecHtml(s)}
    <div class="pros-cons">
      <ul class="pros">${s.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
      <ul class="cons">${s.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
    ${sourceHtml(s)}
  </article>`;
}

function tableHtml(items) {
  const specCols = FULL_SPEC_SECTIONS.flatMap((sec) =>
    Object.entries(sec.fields).map(([key, label]) => ({ key, label, section: sec.title }))
  );
  const groupRow = `<tr class="group-row"><th class="sticky-col" colspan="2"></th><th colspan="3"></th>${FULL_SPEC_SECTIONS.map((sec) => `<th colspan="${Object.keys(sec.fields).length}" class="group-head">${sec.title}</th>`).join("")}<th></th></tr>`;
  const head = `<tr>
    <th class="sticky-col" data-sort="score">Rank</th><th class="sticky-col sticky-col-2" data-sort="evidence">Routine</th>
    <th>Category</th><th data-sort="timeAsc">Time/day</th><th data-sort="score">Score</th>
    ${specCols.map((c) => `<th>${c.label}</th>`).join("")}
    <th>Source</th></tr>`;
  const rows = items
    .map((s, i) => `<tr><td class="sticky-col">#${i + 1}</td><td class="sticky-col sticky-col-2">${s.brand} \u2014 ${s.model}</td>
      <td>${CATEGORY_LABELS[s.category] || "\u2014"}</td>
      <td>${s.timePerDay}</td>
      <td class="score-cell">${overallScore(s)}</td>
      ${specCols.map((c) => `<td>${(s.fullSpec && s.fullSpec[c.key]) || "\u2014"}</td>`).join("")}
      <td><a class="buy-link" href="${s.sourceUrl}" target="_blank" rel="noopener noreferrer">Source</a></td></tr>`)
    .join("");
  return `<table>${groupRow}${head}${rows}</table>`;
}

function render() {
  const items = filteredRoutines();
  document.getElementById("cards").innerHTML = items.map(cardHtml).join("");
  document.getElementById("table").innerHTML = tableHtml(items);
  document.getElementById("count").textContent = `${items.length} routines`;
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
    console.table(ROUTINES.map((s) => ({
      routine: `${s.brand}: ${s.model}`,
      score: overallScore(s),
      evidence: s.scores.evidence,
      coverage: s.scores.coverage,
      steps: s.stepsPerDay,
      time: s.timePerDay,
    })));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  document.getElementById("type").addEventListener("change", (e) => { state.type = e.target.value; render(); });
  document.getElementById("category").addEventListener("change", (e) => { state.category = e.target.value; render(); });
  document.getElementById("maxSteps").addEventListener("input", (e) => {
    state.maxSteps = Number(e.target.value);
    document.getElementById("maxStepsLabel").textContent = `${state.maxSteps} steps`;
    render();
  });
  initDevMode();
  render();
});
