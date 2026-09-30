/* ============================================================
   BlaFR — Extras : avis, newsletter, FAQ, footer,
   exit-intent, état "offre terminée"
   ============================================================ */
(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  const EXIT_KEY = "blafr_exit_shown";
  let exitLastFocused = null;
  let exitPreviousOverflow = "";
  let closeActiveExit = null;

  /* ═══════════════ 1. AVIS ═══════════════ */
  const REVIEWS = [
    { stars: 5, quote: "Le canapé en velours est sublime, assise ferme et tissu très qualitatif. Livré en 48h chrono !", name: "Camille D.", city: "Lyon", product: "Canapé velours" },
    { stars: 5, quote: "Finitions impeccables sur le lampadaire en laiton. Il donne un côté galerie d'art à mon salon.", name: "Antoine M.", city: "Bordeaux", product: "Lampadaire arc" },
    { stars: 5, quote: "Le lin lavé est d'une douceur rare. À -54%, c'est le meilleur achat de la semaine !", name: "Éléonore B.", city: "Paris", product: "Parure lin lavé" }
  ];

  function starsHTML(n) {
    let out = "";
    for (let i = 0; i < n; i++) out += '<span class="material-symbols-outlined text-[16px] text-primary-container" style="font-variation-settings:\'FILL\' 1;">star</span>';
    return out;
  }

  function renderAvis() {
    const host = document.getElementById("avis-content");
    if (!host) return;
    host.innerHTML = `
      <div class="flex items-center justify-between p-4 rounded-2xl bg-surface-container mb-6">
        <div class="flex items-center gap-3">
          <span class="font-headline-xl-mobile font-bold text-primary-container">4,8</span>
          <div>
            <div class="flex">${starsHTML(5)}</div>
            <span class="font-label-md text-label-md text-on-surface-variant">Basé sur 2 300 avis clients</span>
          </div>
        </div>
        <span class="material-symbols-outlined text-secondary text-[24px]">verified</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${REVIEWS.map(r => `
          <div class="p-5 rounded-2xl bg-surface-container flex flex-col gap-3">
            <div class="flex">${starsHTML(r.stars)}</div>
            <p class="font-body-lg text-body-lg text-on-surface">« ${NS.esc(r.quote)} »</p>
            <div class="pt-3 border-t border-outline-variant/30 flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5 font-title-md text-title-md font-bold text-on-surface">
                <span>${NS.esc(r.name)}</span>
                <span class="text-on-surface-variant font-normal text-body-md">(${NS.esc(r.city)})</span>
                <span class="material-symbols-outlined text-secondary text-[16px]">verified</span>
              </div>
              <span class="font-label-md text-label-md text-on-surface-variant">Achat vérifié · ${NS.esc(r.product)}</span>
            </div>
          </div>`).join("")}
      </div>`;
  }

  /* ═══════════════ 2. NEWSLETTER ═══════════════ */
  function renderNewsletter() {
    const host = document.getElementById("newsletter-content");
    if (!host) return;
    host.innerHTML = `
      <div class="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex flex-col gap-2 max-w-xl">
          <div class="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-primary-container/15 text-primary-container font-label-md text-label-md font-bold">
            <span class="material-symbols-outlined text-[16px]">redeem</span>
            Avantage Club BlaFR
          </div>
          <h3 class="font-headline-lg text-headline-lg text-on-surface font-bold">Encore -10% en plus</h3>
          <p class="font-body-md text-body-md text-on-surface-variant">Recevez immédiatement le code <span class="font-mono text-primary-container font-bold">BLACK10</span> cumulable avec les offres Black Friday.</p>
        </div>
        <form id="newsletter-form" class="w-full md:max-w-md flex flex-col gap-3" novalidate>
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] pointer-events-none">mail</span>
            <input id="newsletter-email" type="email" required placeholder="Votre adresse e-mail"
                   class="w-full h-12 pl-12 pr-4 rounded-full bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container" />
          </div>
          <p data-newsletter-error role="alert" class="hidden font-label-md text-label-md text-error"></p>
          <button type="submit" class="h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all">
            <span>Recevoir mon code</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>
      </div>`;

    const form = document.getElementById("newsletter-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailEl = document.getElementById("newsletter-email");
      const errEl = document.querySelector("[data-newsletter-error]");
      const v = (emailEl.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        if (errEl) { errEl.textContent = "Adresse e-mail invalide."; errEl.classList.remove("hidden"); }
        emailEl.focus();
        return;
      }
      if (errEl) errEl.classList.add("hidden");
      form.outerHTML = `
        <div class="w-full md:max-w-md p-5 rounded-2xl bg-secondary-container/10 border border-secondary/30 flex flex-col gap-3">
          <p class="font-label-lg text-label-lg text-secondary font-bold flex items-center gap-2">
            <span class="material-symbols-outlined">check_circle</span>
            Votre code est prêt !
          </p>
          <div class="flex items-center justify-between bg-surface-container-lowest px-4 py-3 rounded-xl">
            <span class="font-headline-sm text-headline-sm text-primary-container font-mono tracking-wider">BLACK10</span>
            <button type="button" data-action="copy-promo" data-code="BLACK10"
                    class="h-9 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-bright transition-colors flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px]" data-copy-icon>content_copy</span>
              <span data-copy-label>Copier</span>
            </button>
          </div>
        </div>`;
    });
  }

  /* ═══════════════ 3. FAQ ═══════════════ */
  function renderFAQ() {
    const host = document.getElementById("faq-content");
    if (!host) return;
    const groups = [
      {
        title: "Livraison", icon: "local_shipping", items: [
          { q: "Quels sont les délais et frais de livraison ?", a: "La livraison standard est offerte dès 100 € d'achat (sinon 4,90 €). Expédition sous 24 à 48h avec suivi transporteur.", open: true },
          { q: "Livrez-vous à l'étage pour les meubles volumineux ?", a: "Oui, l'option « Livraison dans la pièce de votre choix » est disponible pour les canapés et tables massives." }
        ]
      },
      {
        title: "Retours", icon: "assignment_return", items: [
          { q: "Comment fonctionne la garantie retours 30 jours ?", a: "Vous avez 30 jours à compter de la réception pour changer d'avis. L'enlèvement est organisé par nos soins, sans justification." },
          { q: "Les retours sont-ils gratuits ?", a: "Oui, l'étiquette de retour prépayée est automatiquement mise à disposition dans votre espace client." }
        ]
      },
      {
        title: "Paiement", icon: "lock", items: [
          { q: "Quels sont les moyens de paiement acceptés ?", a: "Carte bancaire (3D Secure), Mobile money (Orange, MTN, Moov, Wave) et paiement à la livraison." },
          { q: "Mes données bancaires sont-elles conservées ?", a: "Site de démonstration : aucun paiement réel n'est effectué et aucune donnée bancaire n'est enregistrée." }
        ]
      }
    ];

    host.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        ${groups.map(g => `
          <div class="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[20px]">${g.icon}</span>
              </div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">${g.title}</h3>
            </div>
            <div class="flex flex-col gap-2">
              ${g.items.map(it => `
                <details class="group rounded-xl bg-surface-container p-3" ${it.open ? "open" : ""}>
                  <summary class="flex items-center justify-between gap-2 cursor-pointer list-none">
                    <span class="font-title-md text-title-md text-on-surface">${it.q}</span>
                    <span class="material-symbols-outlined text-primary-container transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p class="mt-2 font-body-md text-body-md text-on-surface-variant">${it.a}</p>
                </details>`).join("")}
            </div>
          </div>`).join("")}
      </div>`;
  }

  /* ═══════════════ 4. FOOTER ═══════════════ */
  function renderFooter() {
    const host = document.getElementById("footer-content");
    if (!host) return;
    host.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between gap-8">
        <div class="flex flex-col gap-3 max-w-sm">
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">BlaFR</span>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Maison & décoration haut de gamme. Design intemporel, matériaux durables, finitions artisanales.
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <span class="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px]">Carte</span>
            <span class="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px]">Mobile money</span>
            <span class="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px]">À la livraison</span>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div class="flex flex-col gap-2">
            <h4 class="font-label-lg text-label-lg font-bold text-on-surface">Boutique</h4>
            ${["salon","chambre","cuisine","decoration","eclairage"].map(k =>
              `<button type="button" data-action="filter-category" data-category="${k}" class="text-left font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">${NS.CATEGORIES[k]}</button>`
            ).join("")}
            <a href="#produits" class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Toutes les offres</a>
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="font-label-lg text-label-lg font-bold text-on-surface">Aide</h4>
            <a href="#faq" class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Questions fréquentes</a>
            <a href="#faq" class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Livraison & retours</a>
            <a href="#faq" class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Paiement sécurisé</a>
            <a href="#avis" class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Avis clients</a>
          </div>
          <div class="flex flex-col gap-2">
            <h4 class="font-label-lg text-label-lg font-bold text-on-surface">Légal</h4>
            <span class="font-label-md text-label-md text-on-surface-variant">Conditions générales de vente</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Mentions légales</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Données personnelles</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Gestion des cookies</span>
          </div>
        </div>
      </div>
      <div class="pt-6 mt-6 border-t border-outline-variant/30 text-center md:text-left">
        <p class="font-label-md text-label-md text-on-surface-variant">© 2026 BlaFR Home Studio. Tous droits réservés. Offres Black Friday limitées aux stocks disponibles.</p>
      </div>`;
  }

  /* ═══════════════ 5. EXIT-INTENT ═══════════════ */
  function shouldShowExit() {
    if (NS.isSaleEnded()) return false;
    if (NS.checkout && document.getElementById("checkout-root") && document.getElementById("checkout-root").innerHTML) return false;
    if (document.getElementById("cart-root") && document.getElementById("cart-root").innerHTML) return false;
    if (document.getElementById("modal-root") && document.getElementById("modal-root").innerHTML) return false;
    try { if (sessionStorage.getItem(EXIT_KEY)) return false; } catch { return false; }
    return true;
  }

  function markExitShown() {
    try { sessionStorage.setItem(EXIT_KEY, "1"); } catch {}
  }

  function showExitPopup() {
    if (!shouldShowExit()) return;
    markExitShown();

    const root = document.getElementById("modal-root");
    if (!root) return;

    exitLastFocused = document.activeElement;
    exitPreviousOverflow = document.body.style.overflow;
    root.innerHTML = `
      <div class="fixed inset-0 z-[100] bg-surface-container-lowest/80 backdrop-blur-md flex items-end lg:items-center justify-center" data-action="exit-backdrop">
        <div role="dialog" aria-modal="true" aria-labelledby="exit-title"
             class="relative w-full max-w-[520px] bg-surface-container-low rounded-t-[28px] lg:rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <button type="button" data-action="exit-close" aria-label="Fermer"
                  class="absolute top-3 right-3 w-10 h-10 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div class="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-primary-container/15 text-primary-container font-label-md text-label-md font-bold">
            <span class="material-symbols-outlined text-[16px]">local_fire_department</span>
            Avant de partir
          </div>
          <h2 id="exit-title" class="font-headline-lg text-headline-lg text-on-surface font-bold">Attendez ! Votre -10% vous attend</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">Ne repartez pas sans votre code privilège valable sur tout le catalogue Black Friday.</p>
          <div class="p-3 rounded-xl bg-surface-container flex items-center justify-between">
            <div class="flex items-center gap-3 pl-2">
              <span class="material-symbols-outlined text-primary-container">confirmation_number</span>
              <span class="font-headline-sm text-headline-sm text-on-surface font-mono tracking-wider">BLACK10</span>
            </div>
            <button type="button" data-action="copy-promo" data-code="BLACK10"
                    class="h-9 px-3 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-bright transition-colors flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px]" data-copy-icon>content_copy</span>
              <span data-copy-label>Copier</span>
            </button>
          </div>
          <button type="button" data-action="exit-accept"
                  class="w-full h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg">
            <span>Profiter de mon -10%</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button type="button" data-action="exit-close"
                  class="w-full py-2 text-center text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors">
            Non merci
          </button>
        </div>
      </div>`;

    function closeExit() {
      const r = document.getElementById("modal-root");
      if (r) r.innerHTML = "";
      closeActiveExit = null;
      document.removeEventListener("keydown", onExitKeydown);
      document.body.style.overflow = exitPreviousOverflow;
      if (exitLastFocused && exitLastFocused.isConnected) exitLastFocused.focus();
    }
    function onExitKeydown(e) {
      const dialog = root.querySelector('[role="dialog"]');
      if (!dialog) return;
      if (e.key === "Escape") { e.preventDefault(); closeExit(); }
      else if (e.key === "Tab") NS.trapFocus(dialog, e);
    }
    closeActiveExit = closeExit;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onExitKeydown);
    root.querySelector("[data-exit-close]").focus();
  }

  NS.registerAction("exit-close", () => closeActiveExit && closeActiveExit());
  NS.registerAction("exit-backdrop", (event, backdrop) => {
    if (event.target === backdrop && closeActiveExit) closeActiveExit();
  });
  NS.registerAction("exit-accept", () => {
    if (!closeActiveExit) return;
    NS.cart.applyPromo("BLACK10");
    closeActiveExit();
    NS.toast.show({
      title: "Code BLACK10 appliqué ✓",
      message: "Votre remise est active sur le panier.",
      actionLabel: "Voir le panier",
      onAction: () => NS.cart.open()
    });
  });

  function initExitIntent() {
    /* Desktop : souris sort par le haut, après 8s */
    let armed = false;
    setTimeout(() => { armed = true; }, 8000);
    document.addEventListener("mouseout", (e) => {
      if (!armed) return;
      if (e.clientY <= 0 && !e.relatedTarget) showExitPopup();
    });
    /* Mobile : 30s d'inactivité */
    let idleTimer = null;
    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) showExitPopup();
      }, 30000);
    }
    ["click","scroll","touchstart","keydown"].forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle();
  }

  /* ═══════════════ 6. INIT ═══════════════ */
  function init() {
    renderAvis();
    renderNewsletter();
    renderFAQ();
    renderFooter();

    initExitIntent();

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();

  NS.extras = { renderAvis, renderNewsletter, renderFAQ, renderFooter };
})();