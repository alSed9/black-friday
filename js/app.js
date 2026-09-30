/* ============================================================
   BlaFR — Namespace, helpers, compte à rebours, menu mobile
   À charger AVANT products.js / cart.js / etc.
   ============================================================ */

/* 1) Namespace global (créé une seule fois) */
window.BlaFR = window.BlaFR || {};

/* 2) Helpers exposés sur le namespace (utilisés partout ailleurs) */

/* Formatage de prix : "89 €" si entier, "62,90 €" sinon */
BlaFR.formatPrice = function (n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(num);
};

/* Échappement HTML pour injection sûre dans innerHTML */
BlaFR.esc = function (str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const actionHandlers = Object.create(null);
BlaFR.registerAction = function (action, handler) {
  actionHandlers[action] = handler;
};

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
  if (target) {
    const handler = actionHandlers[target.dataset.action];
    if (handler) handler(event, target);
    return;
  }
  const anchor = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (!anchor) return;
  const href = anchor.getAttribute("href");
  if (!href || href === "#" || href.length < 2) return;
  const destination = document.querySelector(href);
  if (!destination) return;
  event.preventDefault();
  destination.scrollIntoView({ behavior: "smooth", block: "start" });
});

BlaFR.trapFocus = function (dialog, event) {
  if (!dialog || event.key !== "Tab") return;
  const focusables = Array.from(dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
  )).filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
  if (!focusables.length) {
    event.preventDefault();
    if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
    dialog.focus();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

/* Badge panier dans le header (appelé par cart.js après chaque modif) */
BlaFR.updateCartBadge = function (count) {
  document.querySelectorAll("[data-cart-badge]").forEach(el => {
    el.textContent = String(count || 0);
    el.classList.toggle("hidden", !count);
  });
};

BlaFR.isSaleEnded = function () {
  return Boolean(BlaFR.CONFIG && new Date(BlaFR.CONFIG.saleEnd).getTime() <= Date.now());
};

/* 3) Compte à rebours global (hero, barre d'annonce, ventes flash) */
(function () {
  'use strict';

  let timerId = null;
  let hasStarted = false;

  function getSaleEnd() {
    if (BlaFR.CONFIG && BlaFR.CONFIG.saleEnd) {
      return new Date(BlaFR.CONFIG.saleEnd).getTime();
    }
    /* Fallback : 2 jours à partir de maintenant si CONFIG pas prête */
    return Date.now() + 2 * 24 * 60 * 60 * 1000;
  }

  function pad(n) { return String(Math.max(0, n)).padStart(2, "0"); }

  function tick() {
    const end = getSaleEnd();
    const diff = end - Date.now();

    if (BlaFR.isSaleEnded()) {
      /* Offre terminée */
      document.body.classList.add("sale-ended");
      document.querySelectorAll("[data-countdown]").forEach(el => el.textContent = "00");
      const announce = document.getElementById("announce-countdown");
      if (announce) announce.textContent = "Offre terminée";
      const flash = document.getElementById("flash-countdown");
      if (flash) flash.textContent = "Offre terminée";
      const status = document.querySelector("[data-countdown-status]");
      if (status) status.classList.remove("hidden");
      if (timerId) { clearInterval(timerId); timerId = null; }
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    /* Champs marqués [data-countdown="days|hours|minutes|seconds"] */
    document.querySelectorAll("[data-countdown]").forEach(el => {
      const key = el.getAttribute("data-countdown");
      const v = key === "days" ? days
              : key === "hours" ? hours
              : key === "minutes" ? minutes
              : key === "seconds" ? seconds
              : null;
      if (v !== null) el.textContent = key === "days" ? pad(v) : pad(v);
    });

    /* Barre d'annonce */
    const announce = document.getElementById("announce-countdown");
    if (announce) {
      announce.textContent = days > 0
        ? `${pad(days)}j ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    /* Pastille "Fin dans …" des ventes flash */
    const flash = document.getElementById("flash-countdown");
    if (flash) {
      flash.textContent = days > 0
        ? `${pad(days)}j ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
  }

  function start() {
    if (hasStarted) return;
    hasStarted = true;
    tick();
    timerId = setInterval(tick, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  BlaFR.initCart();
  BlaFR.initProducts();
}, { once: true });

/* 4) Menu mobile (toggle de la recherche dans le header) */
(function () {
  'use strict';

BlaFR.registerAction("toggle-mobile-search", (event) => {
    event.preventDefault();
    const panel = document.getElementById("mobile-search");
    if (!panel) return;
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      const input = panel.querySelector("input");
      input && input.focus();
    }
  });
})();