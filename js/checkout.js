/* ============================================================
   BlaFR — Checkout une étape + Confirmation
   Rendu dans #checkout-root, ouvert via BlaFR.checkout.open()
   ============================================================ */
(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  let lastFocused = null;
  let isOpen = false;
  let isConfirmed = false;

  /* ---------- Utilitaires ---------- */
  function onKeydown(e) {
    if (!isOpen) return;
    const dialog = document.querySelector('#checkout-root [role="dialog"]');
    if (!dialog) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") NS.trapFocus(dialog, e);
  }

  function esc(s) { return NS.esc ? NS.esc(s) : String(s == null ? "" : s); }

  function genOrderNumber() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `BLA-${y}${m}${day}-${rand}`;
  }

  function fmtDateFr(d) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long", day: "numeric", month: "long"
    }).format(d);
  }

  /* ---------- Validation ---------- */
  function validateField(name, value) {
    const v = String(value || "").trim();
    switch (name) {
      case "fullname":
        return v.length >= 3 ? null : "Nom trop court (3 caractères minimum).";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? null : "Adresse e-mail invalide (ex : nom@domaine.fr).";
      case "phone": {
        const digits = v.replace(/[\s+\-().]/g, "");
        return /^\d{8,15}$/.test(digits) ? null : "Téléphone invalide (8 à 15 chiffres).";
      }
      case "city":
        return v.length >= 2 ? null : "Ville invalide.";
      case "address":
        return v.length >= 5 ? null : "Adresse trop courte (5 caractères minimum).";
      case "ccNum": {
        const digits = v.replace(/\s/g, "");
        if (!/^\d{13,19}$/.test(digits)) return "Numéro de carte invalide.";
        return luhnOk(digits) ? null : "Numéro de carte invalide (échec Luhn).";
      }
      case "ccExp": {
        const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
        if (!m) return "Format attendu : MM/AA.";
        const mm = Number(m[1]), yy = Number(m[2]);
        if (mm < 1 || mm > 12) return "Mois invalide.";
        const now = new Date();
        const exp = new Date(2000 + yy, mm, 0, 23, 59, 59);
        return exp >= now ? null : "Carte expirée.";
      }
      case "ccCvc":
        return /^\d{3,4}$/.test(v) ? null : "CVC invalide (3 ou 4 chiffres).";
      default:
        return null;
    }
  }

  function luhnOk(num) {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = num.charCodeAt(i) - 48;
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function formatCardNumber(raw) {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  /* ---------- Champ : génération de HTML ---------- */
  function fieldHTML({ id, label, type = "text", autocomplete, placeholder, value = "", icon, required = true, hint }) {
    return `
      <div class="flex flex-col gap-1.5" data-field-wrap="${id}">
        <div class="flex items-center justify-between">
          <label for="${id}" class="font-label-lg text-label-lg text-on-surface">
            ${esc(label)} ${required ? '<span class="text-primary-container">*</span>' : '<span class="text-on-surface-variant text-[12px] font-normal">(optionnel)</span>'}
          </label>
          ${hint ? `<span class="font-label-md text-label-md text-on-surface-variant">${esc(hint)}</span>` : ""}
        </div>
        <div class="relative">
          <input id="${id}" name="${id}" type="${type}"
                 autocomplete="${autocomplete || "off"}"
                 placeholder="${esc(placeholder || "")}"
                 value="${esc(value)}"
                 aria-invalid="false"
                 class="w-full h-12 px-4 ${icon ? "pr-11" : ""} rounded-xl bg-surface-container text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container focus:bg-surface-container-high transition-colors placeholder:text-on-surface-variant/50" />
          ${icon ? `<span class="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">${icon}</span>` : ""}
        </div>
        <p data-error-for="${id}" role="alert" class="hidden flex items-center gap-1.5 text-error font-label-md text-label-md pt-0.5">
          <span class="material-symbols-outlined text-[16px]">error</span>
          <span data-error-text></span>
        </p>
      </div>`;
  }

  /* ---------- Rendu : formulaire ---------- */
  function renderForm() {
    const t = NS.cart.totals();
    const empty = t.count === 0;

    const lines = t.lines.map(l => `
      <div class="flex items-center gap-3">
        <img src="${esc(l.product.image)}" alt="" class="w-14 h-14 rounded-lg object-cover bg-surface-container-high shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-label-lg text-label-lg text-on-surface truncate">${esc(l.product.name)}</p>
          <p class="font-label-md text-label-md text-on-surface-variant">Quantité : ${l.qty}</p>
        </div>
        <span class="font-price-sm text-price-sm text-on-surface font-semibold shrink-0">${NS.formatPrice(l.lineTotal)}</span>
      </div>`).join("");

    const shippingLabel = t.shipping === 0 ? '<span class="text-secondary font-bold">Offerte</span>' : `<span class="text-on-surface">${NS.formatPrice(t.shipping)}</span>`;

    const shippingBar = t.freeShippingRemaining > 0
      ? `<div class="p-3 rounded-xl bg-surface-container flex flex-col gap-2">
           <div class="flex items-center gap-2 text-on-surface">
             <span class="material-symbols-outlined text-primary-container text-[18px]">local_shipping</span>
             <span class="font-label-md text-label-md">Plus que <span class="text-primary-container font-bold">${NS.formatPrice(t.freeShippingRemaining)}</span> pour la livraison offerte</span>
           </div>
           <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
             <div class="h-full bg-primary-container rounded-full" style="width:${Math.round(t.freeShippingProgress * 100)}%"></div>
           </div>
         </div>`
      : `<div class="p-3 rounded-xl bg-secondary-container/10 border border-secondary/30 flex items-center gap-2 text-secondary font-label-md text-label-md">
           <span class="material-symbols-outlined text-[18px]">check_circle</span>
           <span class="font-bold">Livraison offerte !</span>
         </div>`;

    return `
      <div id="checkout-dialog" data-action="checkout-backdrop" role="dialog" aria-modal="true" aria-labelledby="checkout-dialog-title" tabindex="-1" class="fixed inset-0 z-[90] checkout-overlay bg-surface overflow-y-auto">
        <div class="min-h-screen flex flex-col">

          <!-- En-tête minimal -->
          <header class="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30">
            <div class="max-w-7xl mx-auto px-margin md:px-margin-desktop h-16 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <span class="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">BlaFR</span>
                <button type="button" data-action="checkout-back" class="checkout-back-to-shop hidden sm:inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[16px]">arrow_back</span>Retour boutique
                </button>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/10 text-secondary">
                <span class="material-symbols-outlined text-[16px]">verified_user</span>
                <span class="font-label-md text-label-md">Paiement sécurisé</span>
              </div>
              <button type="button" data-action="checkout-close" aria-label="Fermer"
                      class="checkout-close w-11 h-11 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          <main class="flex-1 max-w-7xl mx-auto w-full px-margin md:px-margin-desktop py-space-lg">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md mb-space-md">
              <span class="material-symbols-outlined text-[16px] text-primary-container">bolt</span>
              Commande sans créer de compte
            </div>

            ${empty ? `
              <div class="text-center py-16">
                <p class="font-headline-lg text-headline-lg text-on-surface mb-4">Votre panier est vide</p>
                <button type="button" data-action="checkout-back" class="h-12 px-6 rounded-full bg-primary-container text-on-primary font-label-lg font-bold">Retour à la boutique</button>
              </div>
            ` : `
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">

                <!-- ═══ COLONNE GAUCHE : FORMULAIRE ═══ -->
                <form id="checkout-form" class="lg:col-span-7 flex flex-col gap-space-lg" novalidate>

                  <!-- Section 1 : Coordonnées -->
                  <section class="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-space-md">
                    <h2 id="checkout-dialog-title" class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                      <span class="w-7 h-7 rounded-full bg-primary-container text-on-primary font-label-lg flex items-center justify-center">1</span>
                      Vos coordonnées
                    </h2>
                    ${fieldHTML({ id: "fullname", label: "Nom complet", autocomplete: "name", placeholder: "Alexandre Martin", icon: "person" })}
                    ${fieldHTML({ id: "email", label: "Adresse e-mail", type: "email", autocomplete: "email", placeholder: "nom@domaine.fr", icon: "mail", hint: "Reçu et suivi" })}
                    ${fieldHTML({ id: "phone", label: "Téléphone mobile", type: "tel", autocomplete: "tel", placeholder: "06 12 34 56 78", icon: "smartphone" })}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                      ${fieldHTML({ id: "city", label: "Ville & code postal", autocomplete: "address-level2", placeholder: "75008 Paris", icon: "location_city" })}
                      ${fieldHTML({ id: "address", label: "Adresse", autocomplete: "street-address", placeholder: "14 Rue du Faubourg Saint-Honoré", icon: "home_pin" })}
                    </div>
                    ${fieldHTML({ id: "notes", label: "Complément (digicode, étage…)", required: false, placeholder: "Bâtiment B, 3e étage", icon: "notes" })}
                  </section>

                  <!-- Section 2 : Paiement -->
                  <section class="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-space-md">
                    <h2 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                      <span class="w-7 h-7 rounded-full bg-primary-container text-on-primary font-label-lg flex items-center justify-center">2</span>
                      Mode de paiement
                    </h2>

                    <div role="radiogroup" aria-label="Mode de paiement" class="flex flex-col gap-2">

                      <!-- Option 1 : Carte bancaire -->
                      <label class="cursor-pointer">
                        <input type="radio" name="payment" value="card" class="sr-only peer" checked />
                        <div class="p-4 rounded-2xl bg-surface-container border border-transparent peer-checked:border-primary-container peer-checked:bg-surface-container-high transition-all">
                          <div class="flex items-center gap-3">
                            <span class="w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center peer-checked:border-primary-container">
                              <span class="w-2.5 h-2.5 rounded-full bg-primary-container opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                            </span>
                            <div class="flex-1">
                              <p class="font-title-md text-title-md text-on-surface">Carte bancaire</p>
                              <p class="font-label-md text-label-md text-on-surface-variant">Débit immédiat · Chiffrement</p>
                            </div>
                            <div class="flex items-center gap-1.5 text-on-surface-variant font-label-md">
                              <span>CB</span><span>·</span><span>VISA</span><span>·</span><span>MC</span>
                            </div>
                          </div>
                        </div>
                      </label>

                      <!-- Champs carte -->
                      <div data-card-fields class="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm">
                        ${fieldHTML({ id: "ccNum", label: "Numéro de carte", autocomplete: "cc-number", placeholder: "1234 5678 9012 3456", icon: "credit_card" })}
                        <div class="grid grid-cols-2 gap-space-sm">
                          ${fieldHTML({ id: "ccExp", label: "Expiration (MM/AA)", autocomplete: "cc-exp", placeholder: "MM/AA", icon: "calendar_today" })}
                          ${fieldHTML({ id: "ccCvc", label: "CVC", type: "password", autocomplete: "cc-csc", placeholder: "123", icon: "lock" })}
                        </div>
                        <p class="font-label-md text-label-md text-on-surface-variant flex items-start gap-1.5">
                          <span class="material-symbols-outlined text-[14px] mt-0.5">info</span>
                          Site de démonstration : aucun paiement réel n'est effectué et aucune donnée bancaire n'est enregistrée.
                        </p>
                      </div>

                      <!-- Option 2 : Mobile money -->
                      <label class="cursor-pointer">
                        <input type="radio" name="payment" value="momo" class="sr-only peer" />
                        <div class="p-4 rounded-2xl bg-surface-container border border-transparent peer-checked:border-primary-container peer-checked:bg-surface-container-high transition-all">
                          <div class="flex items-center gap-3">
                            <span class="w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center peer-checked:border-primary-container">
                              <span class="w-2.5 h-2.5 rounded-full bg-primary-container opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                            </span>
                            <div class="flex-1">
                              <p class="font-title-md text-title-md text-on-surface">Mobile money</p>
                              <p class="font-label-md text-label-md text-on-surface-variant">Vous validerez par SMS</p>
                            </div>
                            <span class="material-symbols-outlined text-on-surface-variant text-[22px]">send_to_mobile</span>
                          </div>
                          <div data-momo-fields class="hidden mt-3 pt-3 border-t border-outline-variant/30">
                            <label for="momoOperator" class="block font-label-md text-label-md text-on-surface-variant mb-1">Opérateur</label>
                            <select id="momoOperator" class="w-full h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container">
                              <option value="orange">Orange Money</option>
                              <option value="mtn">MTN</option>
                              <option value="moov">Moov</option>
                              <option value="wave">Wave</option>
                            </select>
                          </div>
                        </div>
                      </label>

                      <!-- Option 3 : À la livraison -->
                      <label class="cursor-pointer">
                        <input type="radio" name="payment" value="cod" class="sr-only peer" />
                        <div class="p-4 rounded-2xl bg-surface-container border border-transparent peer-checked:border-primary-container peer-checked:bg-surface-container-high transition-all">
                          <div class="flex items-center gap-3">
                            <span class="w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center peer-checked:border-primary-container">
                              <span class="w-2.5 h-2.5 rounded-full bg-primary-container opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                            </span>
                            <div class="flex-1">
                              <p class="font-title-md text-title-md text-on-surface">Paiement à la livraison</p>
                              <p class="font-label-md text-label-md text-on-surface-variant">Espèces ou TPE en main propre</p>
                            </div>
                            <span class="material-symbols-outlined text-on-surface-variant text-[22px]">local_shipping</span>
                          </div>
                        </div>
                      </label>

                    </div>
                  </section>

                  <!-- Bouton mobile -->
                  <button type="submit" id="checkout-submit"
                          class="checkout-pay-btn lg:hidden w-full h-14 rounded-full bg-primary-container text-on-primary font-headline-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                    <span data-submit-label>Payer ${NS.formatPrice(t.total)}</span>
                    <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </form>

                <!-- ═══ COLONNE DROITE : RÉCAP ═══ -->
                <aside class="lg:col-span-5 lg:sticky lg:top-20 flex flex-col gap-space-md">

                  <details class="lg:hidden bg-surface-container-low rounded-2xl overflow-hidden">
                    <summary class="p-4 flex items-center justify-between cursor-pointer list-none">
                      <span class="font-label-lg text-label-lg text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary-container">receipt_long</span>
                        Récapitulatif · ${NS.formatPrice(t.total)}
                      </span>
                      <span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
                    </summary>
                    <div class="p-4 border-t border-outline-variant/30 flex flex-col gap-3">
                      ${lines}
                    </div>
                  </details>

                  <div class="hidden lg:flex flex-col gap-space-md bg-surface-container-low rounded-2xl p-space-lg">
                    <h3 class="font-headline-sm text-headline-sm text-on-surface">Votre commande</h3>
                    <div class="flex flex-col gap-3 max-h-[300px] overflow-y-auto">${lines}</div>
                  </div>

                  <div class="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-space-md">
                    ${shippingBar}
                    <div class="flex flex-col gap-1.5 text-body-md">
                      <div class="flex justify-between text-on-surface-variant"><span>Sous-total</span><span class="text-on-surface font-semibold">${NS.formatPrice(t.subtotal)}</span></div>
                      ${t.savings > 0 ? `<div class="flex justify-between text-secondary"><span>Économies</span><span class="font-bold">-${NS.formatPrice(t.savings)}</span></div>` : ""}
                      ${t.discount > 0 ? `<div class="flex justify-between text-secondary"><span>Code ${esc(t.promoCode)}</span><span class="font-bold">-${NS.formatPrice(t.discount)}</span></div>` : ""}
                      <div class="flex justify-between text-on-surface-variant"><span>Livraison</span>${shippingLabel}</div>
                      <div class="pt-2 mt-1 flex justify-between items-baseline border-t border-surface-container-highest">
                        <span class="font-title-md text-title-md font-bold text-on-surface">Total</span>
                        <span class="font-price-xl text-price-xl font-bold text-on-surface tracking-tight">${NS.formatPrice(t.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div class="hidden lg:block">
                    <button type="button" data-action="checkout-submit"
                            class="checkout-pay-btn w-full h-14 rounded-full bg-primary-container text-on-primary font-headline-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all">
                      <span data-submit-label>Payer ${NS.formatPrice(t.total)}</span>
                      <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  </div>

                  <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-on-surface-variant font-label-md text-label-md">
                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-secondary text-[16px]">lock</span>Paiement 100% sécurisé</span>
                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-secondary text-[16px]">restart_alt</span>Retours sous 30 jours</span>
                  </div>
                </aside>

              </div>
            `}
          </main>
        </div>
      </div>`;
  }

  /* ---------- Rendu : confirmation ---------- */
  function renderConfirmation(order) {
    const d = new Date(order.date);
    const d1 = new Date(d); d1.setDate(d1.getDate() + 2);
    const d2 = new Date(d); d2.setDate(d2.getDate() + 3);
    const dateRange = `${fmtDateFr(d1)} — ${fmtDateFr(d2)}`;

    const pmtLabel = order.payment.method === "card"
      ? `Carte bancaire •••• ${order.payment.last4}`
      : order.payment.method === "momo"
      ? `Mobile money (${order.payment.operator || "opérateur"})`
      : "Paiement à la livraison";

    const itemsHTML = order.items.map(l => `
      <div class="flex items-center gap-3">
        <img src="${esc(l.image)}" alt="" class="w-14 h-14 rounded-lg object-cover bg-surface-container-high shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-label-lg text-label-lg text-on-surface truncate">${esc(l.name)}</p>
          <p class="font-label-md text-label-md text-on-surface-variant">Qté : ${l.qty}</p>
        </div>
        <span class="font-price-sm text-price-sm text-on-surface font-semibold">${NS.formatPrice(l.lineTotal)}</span>
      </div>`).join("");

    const steps = ["Confirmée", "Préparation", "Expédition", "Livraison"];

    return `
      <div id="checkout-dialog" data-action="checkout-backdrop" role="dialog" aria-modal="true" aria-labelledby="checkout-dialog-title" tabindex="-1" class="fixed inset-0 z-[90] checkout-overlay bg-surface overflow-y-auto">
        <div class="min-h-screen flex flex-col">
          <header class="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30">
            <div class="max-w-3xl mx-auto px-margin h-16 flex items-center justify-between">
              <span class="font-headline-sm text-headline-sm font-bold text-on-surface">BlaFR</span>
              <button type="button" data-action="checkout-close" aria-label="Fermer la confirmation de commande" class="checkout-close w-11 h-11 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          <main class="flex-1 max-w-3xl mx-auto w-full px-margin py-space-xl flex flex-col gap-space-lg">
            <!-- En-tête succès -->
            <div class="flex flex-col items-center text-center gap-space-md">
              <div class="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
                <span class="material-symbols-outlined text-secondary text-[36px]" style="font-variation-settings:'FILL' 1;">check_circle</span>
              </div>
              <h1 id="checkout-dialog-title" tabindex="-1" class="font-headline-lg text-headline-lg text-on-surface font-bold">Merci, votre commande est confirmée !</h1>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high">
                <span class="font-label-md text-label-md text-on-surface-variant font-mono" data-order-number>${esc(order.number)}</span>
                <button type="button" data-action="copy-order" class="text-on-surface-variant hover:text-primary-container transition-colors p-0.5" aria-label="Copier le numéro">
                  <span class="material-symbols-outlined text-[16px]" data-copy-icon>content_copy</span>
                </button>
              </div>
              <p class="font-body-md text-body-md text-on-surface-variant max-w-md">Un e-mail de confirmation a été envoyé à <span class="text-on-surface font-semibold">${esc(order.customer.email)}</span>.</p>
            </div>

            <!-- Frise livraison -->
            <div class="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-primary-container text-[16px]">schedule</span>
                  Livraison estimée
                </span>
                <span class="font-label-lg text-label-lg text-on-surface font-semibold">${dateRange}</span>
              </div>
              <div class="relative flex items-start justify-between pt-4">
                <div class="absolute left-3 right-3 top-7 h-0.5 bg-surface-container-highest"></div>
                <div class="absolute left-3 top-7 h-0.5 bg-secondary-container" style="width:16%"></div>
                ${steps.map((s, i) => `
                  <div class="relative z-10 flex flex-col items-center text-center">
                    <div class="w-7 h-7 rounded-full ${i === 0 ? "bg-secondary-container text-on-secondary" : "bg-surface-container-highest text-on-surface-variant"} flex items-center justify-center">
                      <span class="material-symbols-outlined text-[14px]">${i === 0 ? "check" : "circle"}</span>
                    </div>
                    <span class="font-label-md text-label-md ${i === 0 ? "text-secondary font-semibold" : "text-on-surface-variant"} mt-1.5">${s}</span>
                  </div>`).join("")}
              </div>
            </div>

            <!-- Détail commande -->
            <div class="bg-surface-container-low rounded-2xl p-space-lg flex flex-col gap-space-md">
              <h2 class="font-headline-sm text-headline-sm text-on-surface">Votre commande</h2>
              <div class="flex flex-col gap-3">${itemsHTML}</div>
              <div class="pt-3 mt-1 flex flex-col gap-1.5 border-t border-outline-variant/30 text-body-md">
                <div class="flex justify-between text-on-surface-variant"><span>Sous-total</span><span class="text-on-surface font-semibold">${NS.formatPrice(order.totals.subtotal)}</span></div>
                ${order.totals.savings > 0 ? `<div class="flex justify-between text-secondary"><span>Économies</span><span class="font-bold">-${NS.formatPrice(order.totals.savings)}</span></div>` : ""}
                ${order.totals.discount > 0 ? `<div class="flex justify-between text-secondary"><span>Code ${esc(order.totals.promoCode)}</span><span class="font-bold">-${NS.formatPrice(order.totals.discount)}</span></div>` : ""}
                <div class="flex justify-between text-on-surface-variant"><span>Livraison</span><span>${order.totals.shipping === 0 ? '<span class="text-secondary font-bold">Offerte</span>' : NS.formatPrice(order.totals.shipping)}</span></div>
                <div class="pt-2 mt-1 flex justify-between items-baseline border-t border-surface-container-highest">
                  <span class="font-title-md text-title-md font-bold text-on-surface">Total payé</span>
                  <span class="font-price-xl text-price-xl font-bold text-primary-container">${NS.formatPrice(order.totals.total)}</span>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-outline-variant/30">
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px] mt-0.5">location_on</span>
                  <div><p class="font-label-md text-label-md text-on-surface-variant uppercase">Adresse</p>
                    <p class="font-body-md text-body-md text-on-surface">${esc(order.customer.fullname)}</p>
                    <p class="font-body-md text-body-md text-on-surface-variant">${esc(order.customer.address)}</p>
                    <p class="font-body-md text-body-md text-on-surface-variant">${esc(order.customer.city)}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px] mt-0.5">credit_card</span>
                  <div><p class="font-label-md text-label-md text-on-surface-variant uppercase">Paiement</p>
                    <p class="font-body-md text-body-md text-on-surface">${esc(pmtLabel)}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bonus -->
            <div class="bg-surface-container-high rounded-2xl p-space-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary-container text-[24px]">stars</span>
                <div>
                  <p class="font-title-md text-title-md text-on-surface">-10% sur votre prochaine commande</p>
                  <p class="font-label-md text-label-md text-on-surface-variant">Code <span class="font-mono text-primary-container">MERCI10</span></p>
                </div>
              </div>
              <button type="button" data-action="copy-promo" data-code="MERCI10"
                      class="h-10 px-4 rounded-full bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-bright transition-colors flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]" data-copy-icon>content_copy</span>
                <span data-copy-label>Copier</span>
              </button>
            </div>

            <!-- Actions -->
            <div class="flex flex-col items-center gap-3">
              <button type="button" data-action="checkout-continue"
                      class="w-full h-14 rounded-full bg-primary-container text-on-primary font-headline-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                <span>Continuer mes achats</span>
                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button type="button" data-action="checkout-print"
                      class="checkout-print-link font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">print</span>
                Imprimer le récapitulatif
              </button>
            </div>
          </main>
        </div>
      </div>`;
  }

  /* ---------- Rendu global ---------- */
  function render() {
    const root = document.getElementById("checkout-root");
    if (!root) return;
    root.innerHTML = isConfirmed ? renderConfirmation(lastOrder) : renderForm();
  }

  /* ---------- Ouverture / fermeture ---------- */
  let lastOrder = null;

  function open() {
    if (isOpen) return;
    if (NS.cart.count() === 0) return;
    isOpen = true;
    isConfirmed = false;
    lastFocused = document.activeElement;
    render();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    setTimeout(() => {
      const first = document.querySelector("#checkout-form input");
      first && first.focus();
    }, 50);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    isConfirmed = false;
    const root = document.getElementById("checkout-root");
    if (root) root.innerHTML = "";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---------- Validation à la soumission ---------- */
  function showError(id, msg) {
    const input = document.getElementById(id);
    const errBox = document.querySelector(`[data-error-for="${id}"]`);
    if (!input || !errBox) return;
    input.setAttribute("aria-invalid", "true");
    input.classList.add("ring-1", "ring-error");
    errBox.querySelector("[data-error-text]").textContent = msg;
    errBox.classList.remove("hidden");
  }
  function clearError(id) {
    const input = document.getElementById(id);
    const errBox = document.querySelector(`[data-error-for="${id}"]`);
    if (!input || !errBox) return;
    input.removeAttribute("aria-invalid");
    input.classList.remove("ring-1", "ring-error");
    errBox.classList.add("hidden");
  }

  function validateAll() {
    const fields = ["fullname", "email", "phone", "city", "address"];
    const pay = document.querySelector('input[name="payment"]:checked');
    const method = pay ? pay.value : "card";
    if (method === "card") fields.push("ccNum", "ccExp", "ccCvc");

    let firstError = null;
    fields.forEach(f => {
      const el = document.getElementById(f);
      const v = el ? el.value : "";
      const err = validateField(f, v);
      if (err) {
        showError(f, err);
        if (!firstError) firstError = el;
      } else clearError(f);
    });
    return firstError;
  }

  /* ---------- Soumission ---------- */
  function submit() {
    const firstError = validateAll();
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const t = NS.cart.totals();
    const pay = document.querySelector('input[name="payment"]:checked');
    const method = pay ? pay.value : "card";
    const payment = { method };
    if (method === "card") {
      const num = (document.getElementById("ccNum") || {}).value || "";
      payment.last4 = num.replace(/\s/g, "").slice(-4);
    } else if (method === "momo") {
      payment.operator = (document.getElementById("momoOperator") || {}).value || "orange";
    }

    /* État loading + anti double-clic */
    document.querySelectorAll("[data-action='checkout-submit'], #checkout-submit").forEach(b => {
      b.disabled = true;
      b.classList.add("opacity-70", "cursor-wait");
      const lbl = b.querySelector("[data-submit-label]");
      if (lbl) lbl.textContent = "Traitement…";
    });

    setTimeout(() => {
      const itemsSnapshot = t.lines.map(l => ({
        id: l.product.id,
        name: l.product.name,
        image: l.product.image,
        qty: l.qty,
        lineTotal: l.lineTotal
      }));

      const order = {
        number: genOrderNumber(),
        date: new Date().toISOString(),
        customer: {
          fullname: (document.getElementById("fullname") || {}).value || "",
          email: (document.getElementById("email") || {}).value || "",
          phone: (document.getElementById("phone") || {}).value || "",
          address: (document.getElementById("address") || {}).value || "",
          city: (document.getElementById("city") || {}).value || ""
        },
        items: itemsSnapshot,
        totals: {
          subtotal: t.subtotal,
          savings: t.savings,
          discount: t.discount,
          promoCode: t.promoCode,
          shipping: t.shipping,
          total: t.total
        },
        payment
      };

      /* Sauvegarde sans données bancaires complètes */
      try { sessionStorage.setItem("blafr_last_order", JSON.stringify(order)); } catch {}

      lastOrder = order;
      isConfirmed = true;
      NS.cart.clear();
      render();
      document.getElementById("checkout-dialog-title")?.focus();
    }, 1500);
  }

  /* ---------- Copie dans le presse-papier ---------- */
  function copyText(text, btn) {
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    function feedback() {
      if (!btn) return;
      const icon = btn.querySelector("[data-copy-icon]");
      const label = btn.querySelector("[data-copy-label]");
      if (icon) icon.textContent = "check";
      if (label) label.textContent = "Copié ✓";
      setTimeout(() => {
        if (icon) icon.textContent = "content_copy";
        if (label) label.textContent = "Copier";
      }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(feedback).catch(() => { fallback(); feedback(); });
    } else { fallback(); feedback(); }
  }

  /* ---------- Actions checkout ---------- */
  function handleCheckoutAction(e, el) {
    const action = el.getAttribute("data-action");

    if (action === "checkout-backdrop") {
      if (e.target === el) close();
      return;
    }
    if (action === "checkout-submit" || action === "checkout-pay") { e.preventDefault(); submit(); return; }
    if (action === "checkout-close" || action === "checkout-back") { close(); return; }
    if (action === "checkout-continue") {
      close();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (action === "checkout-print") { window.print(); return; }
    if (action === "copy-order" && lastOrder) { copyText(lastOrder.number, el); return; }
    if (action === "copy-promo") { copyText(el.dataset.code || "MERCI10", el); return; }
  }

  ["checkout-backdrop", "checkout-submit", "checkout-pay", "checkout-close", "checkout-back", "checkout-continue", "checkout-print", "copy-order", "copy-promo"]
    .forEach(action => NS.registerAction(action, handleCheckoutAction));

  /* Soumission du formulaire */
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "checkout-form") {
      e.preventDefault();
      submit();
    }
  });

  /* Blur : validation immédiate */
  document.addEventListener("blur", (e) => {
    if (!e.target || !e.target.id) return;
    const id = e.target.id;
    if (["fullname","email","phone","city","address","ccNum","ccExp","ccCvc"].includes(id)) {
      const err = validateField(id, e.target.value);
      if (err) showError(id, err);
      else clearError(id);
    }
  }, true);

  /* Formatage live carte */
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "ccNum") {
      const pos = e.target.selectionStart;
      const before = e.target.value.length;
      e.target.value = formatCardNumber(e.target.value);
      const after = e.target.value.length;
      try { e.target.setSelectionRange(pos + (after - before), pos + (after - before)); } catch {}
    }
    if (e.target && e.target.id === "ccExp") {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      e.target.value = v;
    }
  });

  /* Changement de mode de paiement : afficher/masquer les champs */
  document.addEventListener("change", (e) => {
    if (e.target && e.target.name === "payment") {
      const cardBlock = document.querySelector("[data-card-fields]");
      const momoBlock = document.querySelector("[data-momo-fields]");
      if (cardBlock) cardBlock.classList.toggle("hidden", e.target.value !== "card");
      if (momoBlock) momoBlock.classList.toggle("hidden", e.target.value !== "momo");
    }
  });

  /* API publique */
  NS.checkout = { open, close };
})();