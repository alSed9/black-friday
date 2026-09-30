(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  let lastFocused = null;
  let isOpen = false;
  let promoFeedback = null;
  let promoInputValue = "";
  let applyingPromo = false;

  function onKeydown(e) {
    if (!isOpen) return;
    const dialog = document.querySelector('#cart-root [role="dialog"]');
    if (!dialog) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") NS.trapFocus(dialog, e);
  }

  function suggestions(currentIds) {
    return NS.PRODUCTS
      .filter(p => p.stock > 0 && !currentIds.includes(p.id))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }

  function renderShippingBar(t) {
    if (t.count === 0) return "";
    if (t.freeShippingRemaining <= 0) {
      return `
        <div class="p-3 rounded-xl bg-secondary-container/15 border border-secondary/30 flex flex-col gap-2">
          <div class="flex items-center justify-between text-secondary">
            <span class="font-label-lg text-label-lg font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              Félicitations, la livraison est offerte !
            </span>
            <span class="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-md text-[11px] font-bold">OFFERTE</span>
          </div>
          <div class="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div class="h-full bg-secondary rounded-full" style="width:100%"></div>
          </div>
        </div>`;
    }
    return `
      <div class="p-3 rounded-xl bg-surface-container flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary-container text-[20px]">local_shipping</span>
          <span class="font-label-lg text-label-lg font-bold text-on-surface">
            Plus que <span class="text-primary-container">${NS.formatPrice(t.freeShippingRemaining)}</span> pour la livraison offerte !
          </span>
        </div>
        <div class="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
          <div class="h-full bg-primary-container rounded-full" style="width:${Math.round(t.freeShippingProgress * 100)}%"></div>
        </div>
      </div>`;
  }

  function renderLines(t) {
    if (!t.count) {
      return `
        <div class="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span class="material-symbols-outlined text-[40px]">shopping_bag</span>
          </div>
          <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Votre panier est vide</h3>
          <p class="font-body-md text-body-md text-on-surface-variant max-w-xs">Profitez des offres Black Friday jusqu'à -70% avant la fin du stock.</p>
          <button type="button" data-action="cart-go-offers"
                  class="h-12 px-6 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2">
            <span>Découvrir les offres</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>`;
    }
    return t.lines.map(l => {
      const p = l.product;
      const max = p.stock;
      return `
        <div class="p-3 rounded-2xl bg-surface-container flex gap-3" data-line-id="${p.id}">
          <div class="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
            <img src="${NS.esc(p.image)}" alt="${NS.esc(p.name)}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0 flex flex-col justify-between">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-title-md text-title-md text-on-surface font-bold truncate">${NS.esc(p.name)}</h3>
              <button type="button" data-action="cart-remove" data-id="${p.id}"
                      aria-label="Supprimer ${NS.esc(p.name)}"
                      class="text-on-surface-variant hover:text-error p-1 shrink-0">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center bg-surface-container-high rounded-full">
                <button type="button" data-action="cart-dec" data-id="${p.id}" aria-label="Diminuer la quantité de ${NS.esc(p.name)}"
                        class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30">
                  <span class="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span class="w-8 text-center font-label-lg text-label-lg text-on-surface">${l.qty}</span>
                <button type="button" data-action="cart-inc" data-id="${p.id}" aria-label="Augmenter la quantité de ${NS.esc(p.name)}"
                        ${l.qty >= max ? "disabled" : ""}
                        class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
              <div class="text-right">
                <span class="block font-label-md text-[11px] text-on-surface-variant line-through">${NS.formatPrice(p.oldPrice)}</span>
                <span class="font-headline-sm text-headline-sm text-on-surface font-bold">${NS.formatPrice(l.lineTotal)}</span>
              </div>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  function renderSuggestions(t) {
    const currentIds = t.lines.map(l => l.product.id);
    const sug = suggestions(currentIds);
    if (!sug.length || t.count === 0) return "";
    return `
      <div class="flex flex-col gap-2">
        <h4 class="font-title-md text-title-md font-bold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-primary-container text-[18px]">auto_awesome</span>
          Complétez votre commande
        </h4>
        ${sug.map(p => `
          <div class="p-2 rounded-xl bg-surface-container flex items-center justify-between gap-2">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${NS.esc(p.image)}" alt="" class="w-12 h-12 rounded-lg object-cover shrink-0">
              <div class="min-w-0">
                <p class="font-label-lg text-label-lg font-bold text-on-surface truncate">${NS.esc(p.name)}</p>
                <div class="flex items-center gap-2">
                  <span class="font-price-sm text-price-sm text-primary-container font-bold">${NS.formatPrice(p.price)}</span>
                  <span class="font-label-md text-[11px] text-on-surface-variant line-through">${NS.formatPrice(p.oldPrice)}</span>
                </div>
              </div>
            </div>
            <button type="button" data-action="add-to-cart" data-id="${p.id}"
                    aria-label="Ajouter ${NS.esc(p.name)}"
                    class="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>`).join("")}
      </div>`;
  }

  function renderSummary(t) {
    const shippingLabel = t.shipping === 0 ? "Offerte" : NS.formatPrice(t.shipping);
    const shippingCls = t.shipping === 0 ? "text-secondary font-bold" : "text-on-surface";
    return `
      <div class="flex flex-col gap-1.5 text-body-md">
        <div class="flex justify-between text-on-surface-variant">
          <span>Sous-total</span>
          <span class="text-on-surface font-semibold">${NS.formatPrice(t.subtotal)}</span>
        </div>
        ${t.savings > 0 ? `
          <div class="flex justify-between text-secondary">
            <span class="flex items-center gap-1 font-semibold">
              <span class="material-symbols-outlined text-[16px]">savings</span> Vous économisez
            </span>
            <span class="font-bold">-${NS.formatPrice(t.savings)}</span>
          </div>` : ""}
        ${t.discount > 0 ? `
          <div class="flex justify-between text-secondary">
            <span>Code ${NS.esc(t.promoCode)}</span>
            <span class="font-bold">-${NS.formatPrice(t.discount)}</span>
          </div>` : ""}
        <div class="flex justify-between text-on-surface-variant">
          <span>Livraison</span>
          <span class="${shippingCls}">${shippingLabel}</span>
        </div>
        <div class="pt-2 mt-1 flex justify-between items-baseline border-t border-surface-container-highest">
          <span class="font-title-md text-title-md font-bold text-on-surface">Total</span>
          <span class="font-price-xl text-price-xl font-bold text-on-surface tracking-tight">${NS.formatPrice(t.total)}</span>
        </div>
      </div>`;
  }

  function renderPromo(t) {
    const feedback = promoFeedback
      ? `<p data-promo-msg role="${promoFeedback.ok ? "status" : "alert"}" class="font-label-md text-label-md ${promoFeedback.ok ? "text-secondary" : "text-error"}">${NS.esc(promoFeedback.message)}</p>`
      : '<p data-promo-msg role="alert" class="hidden font-label-md text-label-md"></p>';
    if (t.promoCode) {
      return `
        <div class="flex flex-col gap-2">
          <div class="p-3 rounded-xl bg-secondary-container/10 border border-secondary/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">verified</span>
              <div>
                <p class="font-headline-sm text-headline-sm text-secondary font-bold">${NS.esc(t.promoCode)}</p>
                <p class="font-label-md text-[11px] text-on-surface-variant">-${NS.formatPrice(t.discount)} appliqués</p>
              </div>
            </div>
            <button type="button" data-action="cart-remove-promo" class="text-on-surface-variant hover:text-error font-label-md text-label-md underline">Retirer</button>
          </div>
          ${feedback}
        </div>`;
    }
    return `
      <div class="flex flex-col gap-1.5">
        <label for="cart-promo-input" class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Code promo</label>
        <div class="flex items-center gap-2">
          <input id="cart-promo-input" type="text" value="${NS.esc(promoInputValue)}" placeholder="BLACK10"
                 class="flex-1 h-11 px-4 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container uppercase">
          <button type="button" data-action="cart-apply-promo"
                  class="h-11 px-4 rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg font-bold hover:bg-surface-bright transition-colors">
            Appliquer
          </button>
        </div>
        ${feedback}
      </div>`;
  }

  function render() {
    const root = document.getElementById("cart-root");
    if (!root) return;
    const t = NS.cart.totals();
    const empty = t.count === 0;

    root.innerHTML = `
      <div class="fixed inset-0 z-[60] ${empty ? "" : ""}" data-cart-root>
        <div class="absolute inset-0 bg-surface-container-lowest/75 backdrop-blur-md" data-cart-backdrop></div>

        <aside role="dialog" aria-modal="true" aria-labelledby="cart-title"
               class="absolute inset-y-0 right-0 w-full sm:max-w-[460px] bg-surface-container-low shadow-2xl flex flex-col">
          <header class="p-5 bg-surface-container-low/95 backdrop-blur-md flex items-center justify-between border-b border-surface-container-high shrink-0">
            <h2 id="cart-title" class="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
              Mon panier
              <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-label-md font-bold bg-surface-container-high text-primary-container">${t.count}</span>
            </h2>
            <button type="button" data-action="cart-close" aria-label="Fermer le panier"
                    class="w-11 h-11 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[22px]">close</span>
            </button>
          </header>

          <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            ${renderShippingBar(t)}
            ${renderLines(t)}
            ${!empty ? renderSuggestions(t) : ""}
            ${!empty ? renderPromo(t) : ""}
          </div>

          ${!empty ? `
            <footer class="p-5 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high flex flex-col gap-3 shrink-0">
              ${renderSummary(t)}
              <button type="button" data-action="cart-checkout"
                      class="w-full h-14 rounded-full bg-primary-container text-on-primary font-headline-sm font-bold flex items-center justify-between px-5 shadow-[0_0_24px_-4px_rgba(255,208,40,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all">
                <span>Commander</span>
                <span class="flex items-center gap-2">
                  <span class="font-headline-sm">${NS.formatPrice(t.total)}</span>
                  <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              </button>
              <div class="flex items-center justify-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
                <span class="material-symbols-outlined text-[16px] text-secondary">lock</span>
                <span>Paiement 100% sécurisé · CB · Mobile money · À la livraison</span>
              </div>
            </footer>
          ` : ""}
        </aside>
      </div>`;
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocused = document.activeElement;
    render();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    setTimeout(() => {
      const btn = document.querySelector('[data-action="cart-close"]');
      btn && btn.focus();
    }, 30);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const root = document.getElementById("cart-root");
    if (root) root.innerHTML = "";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* Re-rendu à chaque changement du panier (sans perdre le focus/scroll) */
  document.addEventListener("blafr:cart-changed", () => {
    if (isOpen && !applyingPromo) {
      const scroller = document.querySelector("#cart-root .overflow-y-auto");
      const scrollTop = scroller ? scroller.scrollTop : 0;
      const active = document.activeElement;
      const activeId = active && active.getAttribute && active.getAttribute("data-promo-input-id");
      render();
      const newScroller = document.querySelector("#cart-root .overflow-y-auto");
      if (newScroller) newScroller.scrollTop = scrollTop;
    }
  });

  /* Actions du tiroir */
  function handleCartAction(e, el) {
    const action = el.getAttribute("data-action");
    const id = Number(el.getAttribute("data-id"));

    if (action === "cart-backdrop") { close(); return; }
    if (action === "open-cart") { e.preventDefault(); open(); return; }
    if (action === "cart-close") { close(); return; }

    if (action === "cart-inc") { const line = NS.cart.items().find(o => o.id === id); NS.cart.setQty(id, line.qty + 1); return; }
    if (action === "cart-dec") {
      const line = NS.cart.items().find(o => o.id === id);
      if (line && line.qty <= 1) NS.cart.remove(id);
      else NS.cart.setQty(id, line.qty - 1);
      return;
    }
    if (action === "cart-remove") { NS.cart.remove(id); return; }

    if (action === "cart-apply-promo") {
      const input = document.getElementById("cart-promo-input");
      promoInputValue = input ? input.value : "";
      applyingPromo = true;
      promoFeedback = NS.cart.applyPromo(promoInputValue);
      applyingPromo = false;
      if (promoFeedback.ok) promoInputValue = "";
      const scroller = document.querySelector("#cart-root .overflow-y-auto");
      const scrollTop = scroller ? scroller.scrollTop : 0;
      render();
      const newScroller = document.querySelector("#cart-root .overflow-y-auto");
      if (newScroller) newScroller.scrollTop = scrollTop;
      if (!promoFeedback.ok) document.getElementById("cart-promo-input")?.focus();
      return;
    }
    if (action === "cart-remove-promo") {
      promoFeedback = null;
      promoInputValue = "";
      NS.cart.removePromo();
      return;
    }

    if (action === "cart-checkout") {
      if (NS.cart.count() === 0) return;
      close();
      if (NS.checkout && NS.checkout.open) NS.checkout.open();
      return;
    }
    if (action === "cart-go-offers") {
      close();
      const anchor = document.getElementById("offres-flash") || document.getElementById("produits");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }

  ["open-cart", "cart-backdrop", "cart-close", "cart-inc", "cart-dec", "cart-remove", "cart-apply-promo", "cart-remove-promo", "cart-checkout", "cart-go-offers"]
    .forEach(action => NS.registerAction(action, handleCartAction));

  /* Entrée valide le code promo */
  document.addEventListener("keydown", (e) => {
    if (e.target && e.target.id === "cart-promo-input" && e.key === "Enter") {
      e.preventDefault();
      const btn = document.querySelector('[data-action="cart-apply-promo"]');
      btn && btn.click();
    }
  });

  NS.cartUI = { open, close };
})();