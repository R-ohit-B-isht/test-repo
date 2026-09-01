// Rendering + interaction. Strategy pattern for sorting; re-render on state change.
const SORT_STRATEGIES = {
  score: (a, b) => overallScore(b) - overallScore(a) || b.scores.trust - a.scores.trust || a.price - b.price,
  trust: (a, b) => b.scores.trust - a.scores.trust || overallScore(b) - overallScore(a) || a.price - b.price,
  skin: (a, b) => b.scores.skin - a.scores.skin || overallScore(b) - overallScore(a) || a.price - b.price,
  priceAsc: (a, b) => a.price - b.price || overallScore(b) - overallScore(a),
  priceDesc: (a, b) => b.price - a.price || overallScore(b) - overallScore(a),
  brand: (a, b) => a.brand.localeCompare(b.brand) || overallScore(b) - overallScore(a),
};

const state = { sort: "score", type: "all", step: "all", maxPrice: 5000 };

function filteredPacks() {
  return PIGPRODUCTS
    .filter((s) => s.price <= state.maxPrice)
    .filter((s) => state.step === "all" || s.step === state.step)
    .filter((s) => {
      if (state.type === "all") return true;
      if (state.type === "kojic") return s.filters.kojic;
      if (state.type === "arbutin") return s.filters.arbutin;
      if (state.type === "niacinamide") return s.filters.niacinamide;
      if (state.type === "vitc") return s.filters.vitc;
      if (state.type === "aha") return s.filters.aha;
      if (state.type === "actives") return s.filters.actives;
      if (state.type === "freefrom") return s.filters.freefrom;
      if (state.type === "body") return s.filters.body;
      if (state.type === "men") return s.filters.men;
      if (state.type === "women") return s.filters.women;
      if (state.type === "amazon") return s.buyStore === "Amazon";
      if (state.type === "flipkart") return s.buyStore === "Flipkart";
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
    title: "Format & Value",
    fields: {
      quantity: "Quantity",
      pricePer100: "Price per 100g/ml",
      format: "Format",
      area: "Use area",
    },
  },
  {
    title: "Skin Safety",
    fields: {
      freeFrom: "Free-from claims",
      dermTested: "Derm tested",
      skinType: "Skin type",
    },
  },
  {
    title: "Ingredients & Claims",
    fields: {
      keyIngredients: "Key ingredients",
      benefit: "Claimed benefit",
      naturalClaim: "Natural claim",
    },
  },
  {
    title: "General",
    fields: {
      audience: "Marketed for",
      rating: "User rating",
      madeIn: "Made in",
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
  return `<details class="detail-specs full-specs"><summary>Full spec sheet (all details)</summary>${sections}</details>`;
}

function galleryHtml(s) {
  if (!s.images || !s.images.length) return "";
  const main = `<img class="gallery-main" src="${s.images[0]}" alt="${s.brand} ${s.model}" loading="lazy" onerror="this.closest('.gallery').style.display='none'">`;
  const thumbs = s.images.length > 1
    ? `<div class="gallery-thumbs">${s.images.map((u, i) => `<img class="gallery-thumb${i === 0 ? " active" : ""}" src="${u}" alt="View ${i + 1}" loading="lazy" data-src="${u}" onerror="this.remove()">`).join("")}</div>`
    : "";
  return `<div class="gallery">${main}${thumbs}</div>`;
}

function buyHtml(s) {
  if (!s.buyUrl) return "";
  return `<a class="buy-btn" href="${s.buyUrl}" target="_blank" rel="noopener noreferrer">Buy on ${s.buyStore} \u2197</a>`;
}

function cardHtml(s, i) {
  const score = overallScore(s);
  const v = verdict(score);
  const topPick = i === 0 && state.sort === "score";
  return `<article class="card ${topPick ? "top-pick" : ""}">
    <span class="rank ${topPick ? "gold" : ""}">#${i + 1}${topPick ? " Top Pick" : ""}</span>
    <div><span class="score-pill">${score}</span>
      <div class="brand">${s.brand} <span class="tag">${s.step}</span></div>
      <h2>${s.model}</h2>
    </div>
    ${galleryHtml(s)}
    <div class="price">${formatINR(s.price)}</div>
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
  const groupRow = `<tr class="group-row"><th class="sticky-col" colspan="2"></th><th colspan="3"></th>${FULL_SPEC_SECTIONS.map((sec) => `<th colspan="${Object.keys(sec.fields).length}" class="group-head">${sec.title}</th>`).join("")}<th></th></tr>`;
  const head = `<tr>
    <th class="sticky-col" data-sort="score">Rank</th><th class="sticky-col sticky-col-2" data-sort="brand">Brand / Model</th>
    <th>Step</th><th data-sort="priceAsc">Price</th><th data-sort="score">Score</th>
    ${specCols.map((c) => `<th${c.key === "freeFrom" ? ' data-sort="skin"' : ""}>${c.label}</th>`).join("")}
    <th>Buy</th></tr>`;
  const rows = items
    .map((s, i) => `<tr><td class="sticky-col">#${i + 1}</td><td class="sticky-col sticky-col-2">${s.brand} ${s.model}</td>
      <td>${s.step}</td><td>${formatINR(s.price)}</td>
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
  document.getElementById("count").textContent = `${items.length} products`;
  document.querySelectorAll("#table th[data-sort]").forEach((th) =>
    th.addEventListener("click", () => setSort(th.dataset.sort))
  );
  document.querySelectorAll(".gallery").forEach((g) => {
    g.addEventListener("click", (e) => {
      const t = e.target;
      if (!t.classList.contains("gallery-thumb")) return;
      g.querySelector(".gallery-main").src = t.dataset.src;
      g.querySelectorAll(".gallery-thumb").forEach((x) => x.classList.toggle("active", x === t));
    });
  });
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
    console.table(PIGPRODUCTS.map((s) => ({
      model: `${s.brand} ${s.model}`,
      step: s.step,
      price: s.price,
      score: overallScore(s),
      trust: s.scores.trust,
      format: s.fullSpec.format,
      store: s.buyStore,
    })));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  document.getElementById("type").addEventListener("change", (e) => { state.type = e.target.value; render(); });
  document.getElementById("step").addEventListener("change", (e) => { state.step = e.target.value; render(); });
  document.getElementById("maxPrice").addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    document.getElementById("maxPriceLabel").textContent = formatINR(state.maxPrice);
    render();
  });
  document.getElementById("heroCount").textContent = PIGPRODUCTS.length.toLocaleString("en-IN");
  document.querySelectorAll(".step-jump").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.step = btn.dataset.step;
      document.getElementById("step").value = btn.dataset.step;
      render();
      document.getElementById("cards").scrollIntoView({ behavior: "smooth" });
    });
  });
  initDevMode();
  render();
});
