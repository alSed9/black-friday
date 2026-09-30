(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});

  /* ---------- Helpers purs ---------- */
  function discountPercent(p) {
    if (!p.oldPrice || p.oldPrice <= p.price) return 0;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  }
  function soldPercent(p) {
    if (!p.stockInitial) return 0;
    return Math.round((1 - p.stock / p.stockInitial) * 100);
  }
  function isLowStock(p) { return p.stock > 0 && p.stock <= 10; }
  function isOutOfStock(p) { return p.stock <= 0; }

  /* ---------- Normalisation recherche (accents/casse) ---------- */
  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  /* ---------- Étoiles ---------- */
  function starsHTML(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let out = "";
    for (let i = 0; i < full; i++) out += '<span class="material-symbols-outlined text-[14px] text-primary-container" style="font-variation-settings:\'FILL\' 1;">star</span>';
    if (half) out += '<span class="material-symbols-outlined text-[14px] text-primary-container" style="font-variation-settings:\'FILL\' 1;">star_half</span>';
    return out;
  }

  /* ---------- Badge produit ---------- */
  function badgeHTML(p) {
    if (isOutOfStock(p)) return "";
    if (p.badge === "flash") {
      return '<span class="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary-container font-label-md text-[10px] font-bold uppercase tracking-wider"><span class="material-symbols-outlined text-[12px]">bolt</span>Flash</span>';
    }
    if (p.badge === "bestseller") {
      return '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-md text-[10px] font-bold uppercase tracking-wider">Best-seller</span>';
    }
    if (p.badge === "new") {
      return '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-label-md text-[10px] font-bold uppercase tracking-wider">Nouveau</span>';
    }
    return "";
  }

  /* ---------- Carte produit ---------- */
  function renderProductCard(p) {
    const out = isOutOfStock(p);
    const saleEnded = NS.isSaleEnded();
    const disc = discountPercent(p);
    const sold = soldPercent(p);
    const low = isLowStock(p) || p.flash;
    const showStock = !out && low;

    const imgWrapCls = out
      ? "relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container mb-2.5 grayscale opacity-60"
      : "relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-lowest mb-2.5";

    const priceBlock = out
      ? `<div class="flex items-baseline gap-1.5 mt-1.5">
           <span class="font-headline-sm text-[18px] font-bold text-on-surface-variant/60">${NS.formatPrice(p.price)}</span>
           <span class="font-label-md text-label-md text-on-surface-variant/50 line-through">${NS.formatPrice(p.oldPrice)}</span>
         </div>`
      : `<div class="flex items-baseline gap-1.5 mt-1.5">
           <span class="font-headline-sm text-[18px] font-bold text-on-surface">${NS.formatPrice(p.price)}</span>
           <span class="font-label-md text-label-md text-on-surface-variant line-through">${NS.formatPrice(p.oldPrice)}</span>
         </div>`;

    const stockBlock = showStock
      ? `<div class="flex flex-col gap-1.5 mt-2 bg-surface-container/60 p-2 rounded-lg">
           <span class="font-label-md text-[11px] text-primary-container font-semibold flex items-center gap-1">
             <span class="material-symbols-outlined text-[13px]">local_fire_department</span>
             Plus que ${p.stock} en stock !
           </span>
           <div class="w-full h-1.5 rounded-full bg-surface-bright overflow-hidden">
             <div class="h-full bg-primary-container rounded-full" style="width:${sold}%"></div>
           </div>
         </div>`
      : "";

    const btn = out || saleEnded
      ? `<button type="button" disabled class="w-full h-11 mt-3 rounded-full bg-surface-container-highest text-on-surface-variant/50 font-label-lg text-label-lg font-semibold flex items-center justify-center gap-1 cursor-not-allowed">
           <span class="material-symbols-outlined text-[18px]">block</span>
           <span>${out ? "Épuisé" : "Offre terminée"}</span>
         </button>`
      : `<button type="button" data-action="add-to-cart" data-id="${p.id}"
                 class="w-full h-11 mt-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1 transition-transform active:scale-95 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed">
           <span class="material-symbols-outlined text-[18px]">add</span>
           <span>Ajouter au panier</span>
         </button>`;

    const outTag = out
      ? `<span class="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-[11px] font-bold uppercase tracking-wider">Épuisé</span>`
      : "";

    return `
      <article class="flex flex-col justify-between bg-surface-container rounded-2xl p-2.5 overflow-hidden group">
        <div>
          <div class="${imgWrapCls}">
            <img src="${NS.esc(p.image)}" alt="${NS.esc(p.name)}" loading="lazy"
                 class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                 data-action="open-product" data-id="${p.id}">
            ${outTag}
            ${!out && disc > 0 ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-[11px] font-bold shadow-sm">-${disc}%</span>` : ""}
            ${badgeHTML(p)}
          </div>
          <div class="flex items-center gap-1 mb-1">
            ${starsHTML(p.rating)}
            <span class="font-label-md text-label-md text-on-surface font-semibold">${p.rating}</span>
            <span class="font-label-md text-[11px] text-on-surface-variant">(${p.reviews})</span>
          </div>
          <h3 class="font-title-md text-[13px] leading-tight text-on-surface line-clamp-2 min-h-[34px] cursor-pointer hover:text-primary-container transition-colors"
              data-action="open-product" data-id="${p.id}">${NS.esc(p.name)}</h3>
          ${priceBlock}
          ${stockBlock}
        </div>
        ${btn}
      </article>`;
  }

  /* ---------- État filtres ---------- */
  const state = { category: "all", query: "", sort: "popular" };

  function getFilteredProducts() {
    let list = NS.PRODUCTS.slice();
    if (state.category !== "all") list = list.filter(p => p.category === state.category);
    const q = norm(state.query);
    if (q) {
      list = list.filter(p =>
        norm(p.name).includes(q) ||
        norm(NS.CATEGORIES[p.category] || "").includes(q) ||
        norm(p.description).includes(q)
      );
    }
    switch (state.sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "discount":   list.sort((a, b) => discountPercent(b) - discountPercent(a)); break;
      default:           list.sort((a, b) => b.reviews - a.reviews);
    }
    return list;
  }

  /* ---------- Rendu grille flash ---------- */
  function renderFlashGrid() {
    const root = document.getElementById("flash-grid");
    if (!root) return;
    const flash = NS.PRODUCTS.filter(p => p.flash && p.stock > 0);
    root.className = "grid grid-cols-2 lg:grid-cols-4 gap-3";
    root.innerHTML = flash.map(renderProductCard).join("");
  }

  /* ---------- Barre d'outils + grille principale ---------- */
  function renderToolbar(count) {
    const cats = [{ key: "all", label: "Tout" }].concat(
      Object.keys(NS.CATEGORIES).map(k => ({ key: k, label: NS.CATEGORIES[k] }))
    );
    const pills = cats.map(c => {
      const n = c.key === "all"
        ? NS.PRODUCTS.length
        : NS.PRODUCTS.filter(p => p.category === c.key).length;
      const active = state.category === c.key;
      const cls = active
        ? "bg-primary-container text-on-primary font-bold shadow-sm"
        : "bg-surface-container text-on-surface-variant hover:text-on-surface";
      return `<button type="button" data-action="filter-category" data-filter-cat="${c.key}"
                class="snap-start shrink-0 h-10 px-4 rounded-full font-label-lg text-label-lg transition-colors active:scale-95 ${cls}">
                ${NS.esc(c.label)} <span class="opacity-70 text-[12px]">${n}</span>
              </button>`;
    }).join("");

    return `
      <div class="flex flex-col gap-3 mb-4">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 snap-x snap-mandatory">
          ${pills}
        </div>
        <div class="flex items-center gap-2.5">
          <div class="relative flex-1 flex items-center h-11 rounded-full bg-surface-container px-3.5">
            <span class="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input id="catalog-search" type="search" value="${NS.esc(state.query)}"
                   placeholder="Rechercher une pièce…"
                   class="w-full bg-transparent pl-2 text-on-surface placeholder:text-on-surface-variant text-body-md font-body-md focus:outline-none">
          </div>
          <div class="relative">
            <select id="catalog-sort"
                    class="h-11 pl-4 pr-9 rounded-full bg-surface-container text-on-surface font-label-md text-label-md appearance-none focus:outline-none cursor-pointer">
              <option value="popular"     ${state.sort === "popular" ? "selected" : ""}>Populaires</option>
              <option value="price-asc"   ${state.sort === "price-asc" ? "selected" : ""}>Prix croissant</option>
              <option value="price-desc"  ${state.sort === "price-desc" ? "selected" : ""}>Prix décroissant</option>
              <option value="discount"    ${state.sort === "discount" ? "selected" : ""}>Meilleure remise</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
          </div>
        </div>
        <p class="font-label-md text-label-md text-on-surface-variant" aria-live="polite">${count} produit${count > 1 ? "s" : ""}</p>
      </div>`;
  }

  function renderEmptyState() {
    const q = state.query;
    return `
      <div class="col-span-full flex flex-col items-center text-center gap-3 py-12">
        <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
            <circle cx="21" cy="21" r="13"></circle>
            <line x1="31" x2="43" y1="31" y2="43"></line>
            <path d="M17 19h8"></path>
            <path d="M17 24h5"></path>
          </svg>
        </div>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">Aucun résultat pour « <span data-empty-q></span> »</h3>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-md">Essayez un autre mot-clé ou explorez une catégorie :</p>
        <div class="flex flex-wrap justify-center gap-2 max-w-lg">
          ${Object.entries(NS.CATEGORIES).map(([k, label]) =>
            `<button type="button" data-action="filter-category" data-filter-cat="${k}" class="px-4 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors">${NS.esc(label)}</button>`
          ).join("")}
        </div>
        <button type="button" id="catalog-reset" data-action="reset-catalog"
                class="mt-2 h-11 px-6 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold">
          Réinitialiser
        </button>
      </div>`;
  }

  function renderProductGrid() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    const list = getFilteredProducts();
    const toolbarHost = document.getElementById("catalog-toolbar");
    if (toolbarHost) toolbarHost.innerHTML = renderToolbar(list.length);

    grid.className = "grid grid-cols-2 lg:grid-cols-4 gap-3";
    if (!list.length) {
      grid.innerHTML = renderEmptyState();
      const qEl = grid.querySelector("[data-empty-q]");
      if (qEl) qEl.textContent = state.query; /* textContent = sécurisé */
    } else {
      grid.innerHTML = list.map(renderProductCard).join("");
    }
  }

  /* ---------- Délégation barre d'outils ---------- */
  let searchTimer = null;
  document.addEventListener("input", (e) => {
    if (e.target.id !== "catalog-search") return;
    clearTimeout(searchTimer);
    const v = e.target.value;
    searchTimer = setTimeout(() => {
      state.query = v;
      renderProductGrid();
    }, 150);
  });

  document.addEventListener("change", (e) => {
    if (e.target.id !== "catalog-sort") return;
    state.sort = e.target.value;
    renderProductGrid();
  });

  NS.registerAction("filter-category", (event, element) => {
    event.preventDefault();
    state.category = element.dataset.filterCat || element.dataset.category;
    renderProductGrid();
    const anchor = document.getElementById("produits") || document.getElementById("product-grid");
    if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  NS.registerAction("reset-catalog", () => {
    state.category = "all";
    state.query = "";
    state.sort = "popular";
    renderProductGrid();
  });

  /* ---------- Champs de recherche du header (desktop + mobile) ---------- */
  document.querySelectorAll("[data-search-input]").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      state.query = input.value;
      renderProductGrid();
      const anchor = document.getElementById("produits");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- API publique ---------- */
  NS.products = {
    discountPercent,
    soldPercent,
    isLowStock,
    isOutOfStock,
    renderProductCard,
    renderFlashGrid,
    renderProductGrid,
    getFilteredProducts,
    state
  };

  /* ---------- Init ---------- */
  NS.initProducts = function () {
    renderFlashGrid();
    renderProductGrid();
  };
})();