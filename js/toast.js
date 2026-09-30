(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  const MAX_TOASTS = 3;
  const DURATION = 4500;

  function ensureContainer() {
    let c = document.getElementById("toast-container");
    if (c) return c;
    c = document.createElement("div");
    c.id = "toast-container";
    c.setAttribute("aria-live", "polite");
    c.className = "fixed z-[70] inset-x-4 bottom-4 flex flex-col gap-2 sm:inset-auto sm:top-24 sm:right-6 sm:bottom-auto sm:w-[380px] pointer-events-none";
    document.body.appendChild(c);
    return c;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function show(opts) {
    const o = opts || {};
    const c = ensureContainer();
    while (c.children.length >= MAX_TOASTS) c.firstElementChild && c.firstElementChild.remove();

    const el = document.createElement("div");
    el.className = "pointer-events-auto w-full rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-primary-container/40 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.7)] p-3 flex items-center gap-3 transition-all duration-300";

    const img = document.createElement("div");
    img.className = "w-12 h-12 rounded-xl overflow-hidden bg-surface-container shrink-0";
    if (o.image) {
      const im = document.createElement("img");
      im.src = o.image; im.alt = "";
      im.className = "w-full h-full object-cover";
      img.appendChild(im);
    } else {
      const s = document.createElement("span");
      s.className = "material-symbols-outlined text-secondary flex items-center justify-center w-full h-full";
      s.textContent = "check_circle";
      img.appendChild(s);
    }

    const body = document.createElement("div");
    body.className = "flex-1 min-w-0";

    const title = document.createElement("p");
    title.className = "font-label-md text-label-md text-secondary font-bold";
    title.textContent = o.title || "Ajouté au panier ✓";

    const msg = document.createElement("p");
    msg.className = "font-label-md text-[12px] text-on-surface truncate";
    msg.textContent = o.message || "";

    body.appendChild(title);
    if (o.message) body.appendChild(msg);

    if (o.actionLabel && typeof o.onAction === "function") {
      const link = document.createElement("button");
      link.type = "button";
      link.className = "mt-1 font-label-md text-[12px] text-primary-container font-bold hover:underline";
      link.textContent = o.actionLabel;
      link.addEventListener("click", () => { o.onAction(); close(); });
      body.appendChild(link);
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Fermer");
    closeBtn.className = "w-8 h-8 rounded-full text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0";
    closeBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">close</span>';
    closeBtn.addEventListener("click", close);

    el.appendChild(img);
    el.appendChild(body);
    el.appendChild(closeBtn);
    c.appendChild(el);

    if (!prefersReducedMotion()) {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
    }

    let timer = setTimeout(close, DURATION);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
    el.addEventListener("mouseleave", () => { timer = setTimeout(close, 1500); });

    function close() {
      clearTimeout(timer);
      if (prefersReducedMotion()) { el.remove(); return; }
      el.style.opacity = "0"; el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 220);
    }
  }

  NS.toast = { show };
})();