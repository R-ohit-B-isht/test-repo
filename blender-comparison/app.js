// Rendering + interaction. Strategy pattern for sorting; re-render on state change.
const SORT_STRATEGIES = {
  score: (a, b) => overallScore(b) - overallScore(a),
  power: (a, b) => b.scores.power - a.scores.power || overallScore(b) - overallScore(a),
  battery: (a, b) => b.scores.battery - a.scores.battery || overallScore(b) - overallScore(a),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  brand: (a, b) => a.brand.localeCompare(b.brand),
};

const state = { sort: "score", type: "all", maxPrice: 5000 };

function typeCategory(b) {
  if (/type-c/i.test(b.charging)) return "typec";
  return "microusb";
}

function filteredBlenders() {
  return BLENDERS
    .filter((b) => b.price <= state.maxPrice)
    .filter((b) => {
      if (state.type === "all") return true;
      if (state.type === "ice") return /^(yes|claimed yes)/i.test(b.icecrush);
      if (state.type === "typec") return typeCategory(b) === "typec";
      if (state.type === "indian") return !/(USA|import)/i.test(b.brand);
      return true;
    })
    .sort(SORT_STRATEGIES[state.sort]);
}

function barRows(b) {
  return Object.keys(WEIGHTS)
    .map((k) => {
      const v = b.scores[k];
      return `<div class="bar-row"><span>${CRITERIA_LABELS[k]}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${v * 10}%"></div></div>
        <span>${v.toFixed(1)}</span></div>`;
    })
    .join("");
}

const FULL_SPEC_SECTIONS = [
  {
    title: "Blending",
    fields: {
      motorWatts: "Motor power",
      motorVoltage: "Motor voltage",
      rpm: "Blade speed",
      blades: "Blades",
      iceCrushing: "Ice crushing",
      blendTime: "Blend cycle",
    },
  },
  {
    title: "Battery & Charging",
    fields: {
      batteryMah: "Battery",
      blendsPerCharge: "Blends per charge",
      chargePort: "Charging port",
      chargeTime: "Charge time",
      batteryIndicator: "Battery indicator",
    },
  },
  {
    title: "Jar & Build",
    fields: {
      jarCapacity: "Jar capacity",
      jarMaterial: "Jar material",
      lid: "Lid",
      leakProof: "Leak-proof",
      selfCleaning: "Self-cleaning",
      safetyLock: "Safety lock",
    },
  },
  {
    title: "Physical",
    fields: {
      weight: "Weight",
      dimensions: "Dimensions",
      colours: "Colours",
    },
  },
  {
    title: "General",
    fields: {
      bisCertified: "BIS certified",
      warranty: "Warranty",
      rating: "User rating",
      madeIn: "Made in",
    },
  },
];

function fullSpecHtml(b) {
  if (!b.fullSpec) return "";
  const sections = FULL_SPEC_SECTIONS.map((sec) => {
    const rows = Object.keys(sec.fields)
      .filter((k) => b.fullSpec[k])
      .map((k) => `<div class="detail-row"><span class="detail-key">${sec.fields[k]}</span><span class="detail-val">${b.fullSpec[k]}</span></div>`)
      .join("");
    return rows ? `<div class="spec-section"><h4 class="spec-section-title">${sec.title}</h4>${rows}</div>` : "";
  }).join("");
  return `<details class="detail-specs full-specs"><summary>Full spec sheet (all details)</summary>${sections}</details>`;
}

function buyHtml(b) {
  if (!b.buyUrl) return "";
  return `<a class="buy-btn" href="${b.buyUrl}" target="_blank" rel="noopener noreferrer">Buy on ${b.buyStore} \u2197</a>`;
}

function cardHtml(b, i) {
  const score = overallScore(b);
  const v = verdict(score);
  const topPick = i === 0 && state.sort === "score";
  return `<article class="card ${topPick ? "top-pick" : ""} ${b.id === "superstud-360" ? "warn-card" : ""}">
    <span class="rank ${topPick ? "gold" : ""}">#${i + 1}${topPick ? " Top Pick" : ""}</span>
    <div><span class="score-pill">${score}</span>
      <div class="brand">${b.brand}</div>
      <h2>${b.model}</h2>
    </div>
    <div class="price">${formatINR(b.price)}</div>
    <span class="verdict ${v.cls}">${v.label} \u2014 ${score}/100</span>
    <p class="highlight">${b.highlight}</p>
    <p class="specs"><strong>${b.motor}</strong> \u00B7 ${b.capacity} \u00B7 ${b.battery}<br>
      ${b.charging} \u00B7 Ice: ${b.icecrush}</p>
    <div class="bars">${barRows(b)}</div>
    ${fullSpecHtml(b)}
    <div class="pros-cons">
      <ul class="pros">${b.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
      <ul class="cons">${b.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
    ${buyHtml(b)}
  </article>`;
}

function tableHtml(blenders) {
  const specCols = FULL_SPEC_SECTIONS.flatMap((sec) =>
    Object.entries(sec.fields).map(([key, label]) => ({ key, label, section: sec.title }))
  );
  const groupRow = `<tr class="group-row"><th class="sticky-col" colspan="2"></th><th colspan="2"></th>${FULL_SPEC_SECTIONS.map((sec) => `<th colspan="${Object.keys(sec.fields).length}" class="group-head">${sec.title}</th>`).join("")}<th></th></tr>`;
  const head = `<tr>
    <th class="sticky-col" data-sort="score">Rank</th><th class="sticky-col sticky-col-2" data-sort="brand">Brand / Model</th>
    <th data-sort="priceAsc">Price</th><th data-sort="score">Score</th>
    ${specCols.map((c) => `<th${c.key === "motorWatts" ? ' data-sort="power"' : ""}${c.key === "batteryMah" ? ' data-sort="battery"' : ""}>${c.label}</th>`).join("")}
    <th>Buy</th></tr>`;
  const rows = blenders
    .map((b, i) => `<tr><td class="sticky-col">#${i + 1}</td><td class="sticky-col sticky-col-2">${b.brand} ${b.model}</td>
      <td>${formatINR(b.price)}</td>
      <td class="score-cell">${overallScore(b)}</td>
      ${specCols.map((c) => `<td>${(b.fullSpec && b.fullSpec[c.key]) || "\u2014"}</td>`).join("")}
      <td>${b.buyUrl ? `<a class="buy-link" href="${b.buyUrl}" target="_blank" rel="noopener noreferrer">${b.buyStore}</a>` : "\u2014"}</td></tr>`)
    .join("");
  return `<table>${groupRow}${head}${rows}</table>`;
}

function render() {
  const blenders = filteredBlenders();
  document.getElementById("cards").innerHTML = blenders.map(cardHtml).join("");
  document.getElementById("table").innerHTML = tableHtml(blenders);
  document.getElementById("count").textContent = `${blenders.length} blenders`;
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
    console.table(BLENDERS.map((b) => ({
      model: `${b.brand} ${b.model}`,
      price: b.price,
      score: overallScore(b),
      reliability: b.scores.reliability,
      motor: b.fullSpec.motorWatts,
      battery: b.fullSpec.batteryMah,
      jar: b.fullSpec.jarCapacity,
      port: b.fullSpec.chargePort,
      warranty: b.fullSpec.warranty,
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
