/* ============================================================
   BlaFR — Quick-view (modale / bottom sheet produit)
   ============================================================ */
(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  let lastFocused = null;

  function onKeydown(e) {
    const modal = document.querySelector('#modal-root [role="dialog"]');
    if (!modal) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") NS.trapFocus(modal, e);
  }

  function close() {
    const root = document.getElementById("modal-root");
    if (!root) return;
    root.innerHTML = "";
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function stars(rating) {
    const full = Math.floor(rating);
    let out = "";
    for (let i = 0; i < full; i++) out += '<span class="material-symbols-outlined text-[18px] text-primary-container" style="font-variation-settings:\'FILL\' 1;">star</span>';
    return out;
  }

  function open(id) {
    const p = NS.getProduct(id);
    if (!p) return;

    lastFocused = document.activeElement;
    const root = document.getElementById("modal-root");
    if (!root) return;

    const out = NS.products.isOutOfStock(p);
    const disc = NS.products.discountPercent(p);
    const low = NS.products.isLowStock(p);
    const max = Math.max(0, p.stock);

    root.innerHTML = `
      <div class="fixed inset-0 z-[80] bg-surface-container-lowest/80 backdrop-blur-md overflow-y-auto"
           data-action="quickview-backdrop" tabindex="-1">
        <div class="min-h-full flex items-end lg:items-center justify-center p-0 lg:p-6">
          <div role="dialog" aria-modal="true" aria-labelledby="qv-title"
               class="relative w-full max-w-[960px] bg-surface-container-low rounded-t-[28px] lg:rounded-2xl
                      shadow-2xl overflow-hidden max-h-[90vh] lg:max-h-none flex flex-col lg:flex-row">

            <button type="button" aria-label="Fermer la vue rapide" data-action="quickview-close"
                    class="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="lg:w-1/2 bg-surface-container-lowest overflow-hidden">
              <img src="${NS.esc(p.image)}" alt="${NS.esc(p.name)}"
                   class="w-full h-64 lg:h-full object-cover">
            </div>

            <div class="lg:w-1/2 p-5 lg:p-8 flex flex-col gap-4 overflow-y-auto">
              ${p.badge === "flash" ? '<span class="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold uppercase tracking-wider"><span class="material-symbols-outlined text-[15px]">bolt</span>Vente flash</span>' : ""}
              <h2 id="qv-title" class="font-headline-lg text-headline-lg text-on-surface font-bold">${NS.esc(p.name)}</h2>

              <div class="flex items-center gap-2">
                <div class="flex">${stars(p.rating)}</div>
                <span class="font-price-sm text-price-sm font-bold text-on-surface">${p.rating}</span>
                <span class="text-on-surface-variant text-[13px]">• ${p.reviews} avis</span>
              </div>

              <div class="flex items-baseline gap-3">
                <span class="font-price-xl text-price-xl font-bold text-on-surface">${NS.formatPrice(p.price)}</span>
                <span class="font-title-md text-on-surface-variant line-through">${NS.formatPrice(p.oldPrice)}</span>
                ${disc ? `<span class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-price-sm text-price-sm font-bold">-${disc}%</span>` : ""}
              </div>

              ${p.oldPrice > p.price ? `<p class="font-label-lg text-secondary font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">check_circle</span>Vous économisez ${NS.formatPrice(p.oldPrice - p.price)}</p>` : ""}

              ${low && !out ? `
                <div class="bg-surface-container rounded-lg p-3">
                  <p class="font-label-md text-label-md text-primary-container font-bold mb-2">Plus que ${p.stock} en stock !</p>
                  <div class="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div class="h-full bg-primary-container rounded-full" style="width:${NS.products.soldPercent(p)}%"></div>
                  </div>
                </div>` : ""}

              <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2">${NS.esc(p.description)}</p>

              <div class="flex items-center gap-3">
                <span class="font-label-lg text-on-surface font-semibold">Quantité</span>
                <div class="flex items-center bg-surface-container rounded-full h-11 px-1">
                  <button type="button" data-action="quickview-dec" aria-label="Diminuer la quantité de ${NS.esc(p.name)}"
                          class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high disabled:opacity-30">
                    <span class="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span data-qv-qty class="w-10 text-center font-price-sm text-price-sm text-on-surface">1</span>
                  <button type="button" data-action="quickview-inc" aria-label="Augmenter la quantité de ${NS.esc(p.name)}"
                          class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high disabled:opacity-30">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
                <span data-qv-max class="hidden font-label-md text-label-md text-on-surface-variant">Maximum atteint</span>
              </div>

              <button type="button" data-action="quickview-add" ${out ? "disabled" : ""}
                      class="w-full h-[52px] rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span data-qv-add-label>${out ? "Épuisé" : `Ajouter au panier — ${NS.formatPrice(p.price)}`}</span>
              </button>

              <div class="pt-3 border-t border-outline-variant/20 flex flex-col gap-2 text-on-surface text-body-md">
                <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary-container text-[18px]">bolt</span><span>Livraison offerte dès ${NS.formatPrice(NS.CONFIG.freeShippingThreshold)}</span></div>
                <div class="flex items-center gap-2"><span class="material-symbols-outlined text-secondary text-[18px]">sync</span><span>Retours gratuits sous 30 jours</span></div>
                <div class="flex items-center gap-2"><span class="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span><span>Paiement 100% sécurisé</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);

    /* Fermeture clic fond ou bouton close */
    /* Stepper */
    let qty = 1;
    const qtyEl = root.querySelector("[data-qv-qty]");
    const incBtn = root.querySelector('[data-action="quickview-inc"]');
    const decBtn = root.querySelector('[data-action="quickview-dec"]');
    const maxEl = root.querySelector("[data-qv-max]");
    const addLabel = root.querySelector("[data-qv-add-label]");
    const addBtn = root.querySelector('[data-action="quickview-add"]');

    function refresh() {
      qtyEl.textContent = qty;
      decBtn.disabled = qty <= 1;
      incBtn.disabled = qty >= max;
      maxEl.classList.toggle("hidden", qty < max);
      if (!out) addLabel.textContent = `Ajouter au panier — ${NS.formatPrice(p.price * qty)}`;
    }
    NS.registerAction("quickview-dec", () => { if (qty > 1) { qty--; refresh(); } });
    NS.registerAction("quickview-inc", () => { if (qty < max) { qty++; refresh(); } });
    refresh();

    /* Ajout panier */
    if (!out) {
      NS.registerAction("quickview-add", () => {
        NS.cart.add(p.id, qty);
        const original = addLabel.textContent;
        addBtn.classList.remove("bg-primary-container", "text-on-primary");
        addBtn.classList.add("bg-secondary-container", "text-on-secondary");
        addLabel.textContent = "Ajouté ✓";
        addBtn.disabled = true;
        setTimeout(() => {
          addBtn.classList.add("bg-primary-container", "text-on-primary");
          addBtn.classList.remove("bg-secondary-container", "text-on-secondary");
          addLabel.textContent = original;
          addBtn.disabled = false;
        }, 1500);
      });
    }

    /* Focus premier élément interactif */
    setTimeout(() => {
      const focusable = root.querySelector("button:not([disabled])");
      focusable && focusable.focus();
    }, 30);
  }

  NS.registerAction("quickview-close", close);
  NS.registerAction("quickview-backdrop", (event, backdrop) => {
    if (event.target === backdrop) close();
  });

  NS.quickView = { open, close };
})();