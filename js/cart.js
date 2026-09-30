/* ============================================================
   BlaFR — Logique panier (localStorage, promo, totaux)
   ============================================================ */
(function () {
  'use strict';
  const NS = (window.BlaFR = window.BlaFR || {});
  const STORAGE_KEY = "blafr_cart_v1";
  const PROMO_KEY   = "blafr_promo_v1";

  let items = [];      // [{ id, qty }]
  let promoCode = null;

  /* ---------- Persistance ---------- */
  function safeRead(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function safeWrite(key, val) {
    try { localStorage.setItem(key, val); } catch { /* quota / privacy mode */ }
  }

  function load() {
    const raw = safeRead(STORAGE_KEY);
    if (!raw) { items = []; return; }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { items = []; return; }
      items = parsed
        .map(o => ({ id: Number(o.id), qty: Math.max(1, Number(o.qty) || 1) }))
        .filter(o => NS.getProduct(o.id))
        .map(o => {
          const p = NS.getProduct(o.id);
          return { id: o.id, qty: Math.min(o.qty, p.stock) };
        })
        .filter(o => o.qty > 0);
    } catch { items = []; }
  }

  function save() {
    safeWrite(STORAGE_KEY, JSON.stringify(items));
    safeWrite(PROMO_KEY, promoCode || "");
  }

  function loadPromo() {
    const raw = safeRead(PROMO_KEY);
    if (!raw) return;
    const code = String(raw).trim().toUpperCase();
    const rate = NS.CONFIG.promoCodes && NS.CONFIG.promoCodes[code];
    if (rate) promoCode = code;
  }

  function emit() {
    NS.updateCartBadge && NS.updateCartBadge(count());
    document.dispatchEvent(new CustomEvent("blafr:cart-changed", {
      detail: { items: items.slice(), totals: totals() }
    }));
  }

  function getItems() { return items.map(o => ({ ...o })); }

  function add(id, qty = 1) {
    if (NS.isSaleEnded()) return;
    const p = NS.getProduct(id);
    if (!p || p.stock <= 0) return;
    const line = items.find(o => o.id === p.id);
    const maxQ = p.stock;
    if (line) {
      line.qty = Math.min(line.qty + qty, maxQ);
    } else {
      items.push({ id: p.id, qty: Math.min(Math.max(1, qty), maxQ) });
    }
    save(); emit();

    if (NS.toast && NS.toast.show) {
      NS.toast.show({
        title: "Ajouté au panier ✓",
        message: p.name,
        image: p.image,
        actionLabel: "Voir le panier",
        onAction: () => NS.cart.open()
      });
    }
  }

  function setQty(id, qty) {
    const p = NS.getProduct(id);
    if (!p) return;
    const q = Math.max(1, Math.min(Number(qty) || 1, p.stock));
    const line = items.find(o => o.id === p.id);
    if (!line) return;
    line.qty = q;
    save(); emit();
  }

  function remove(id) {
    const i = items.findIndex(o => o.id === Number(id));
    if (i < 0) return;
    items.splice(i, 1);
    save(); emit();
  }

  function clear() {
    items = [];
    promoCode = null;
    save(); emit();
  }

  function count() {
    return items.reduce((s, o) => s + o.qty, 0);
  }

  function totals() {
    const lines = items.map(o => {
      const product = NS.getProduct(o.id);
      return { product, qty: o.qty, lineTotal: product.price * o.qty };
    }).filter(l => l.product);

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const savings  = lines.reduce((s, l) => s + (l.product.oldPrice - l.product.price) * l.qty, 0);

    const rate = promoCode && NS.CONFIG.promoCodes[promoCode];
    const discount = rate ? subtotal * rate : 0;

    const threshold = NS.CONFIG.freeShippingThreshold || 100;
    const fee = NS.CONFIG.shippingFee || 0;
    const empty = lines.length === 0;
    const shipping = empty || subtotal >= threshold ? 0 : fee;

    const total = Math.max(0, subtotal - discount + shipping);
    const freeShippingRemaining = Math.max(0, threshold - subtotal);
    const freeShippingProgress = threshold > 0 ? Math.min(1, subtotal / threshold) : 1;

    return {
      lines, count: count(),
      subtotal, savings,
      promoCode, discount,
      shipping, total,
      freeShippingRemaining, freeShippingProgress
    };
  }

  function applyPromo(raw) {
    const code = String(raw || "").trim().toUpperCase();
    if (!code) return { ok: false, message: "Saisissez un code." };
    const rate = NS.CONFIG.promoCodes && NS.CONFIG.promoCodes[code];
    if (!rate) return { ok: false, message: "Code invalide ou expiré." };
    promoCode = code;
    save(); emit();
    return { ok: true, message: `Code ${code} appliqué (-${Math.round(rate * 100)}%)` };
  }

  function removePromo() {
    promoCode = null;
    save(); emit();
  }

  function open()  { NS.cartUI && NS.cartUI.open && NS.cartUI.open(); }
  function close() { NS.cartUI && NS.cartUI.close && NS.cartUI.close(); }

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === PROMO_KEY) {
      load(); loadPromo(); emit();
    }
  });

  NS.registerAction("add-to-cart", (e, addBtn) => {
      const id = Number(addBtn.dataset.id);
      const p = NS.getProduct(id);
      if (!p) return;
      const line = items.find(o => o.id === id);
      const before = line ? line.qty : 0;
      if (before >= p.stock) {
        const originalHTML = addBtn.innerHTML;
        addBtn.disabled = true;
        addBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">block</span><span>Stock maximum atteint</span>';
        setTimeout(() => { addBtn.disabled = false; addBtn.innerHTML = originalHTML; }, 1500);
        return;
      }
      add(id, 1);
      if (!addBtn.dataset.feedback) {
        addBtn.dataset.feedback = "1";
        const originalHTML = addBtn.innerHTML;
        addBtn.classList.remove("bg-primary-container", "text-on-primary");
        addBtn.classList.add("bg-secondary-container", "text-on-secondary");
        addBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span><span>Ajouté ✓</span>';
        setTimeout(() => {
          addBtn.classList.add("bg-primary-container", "text-on-primary");
          addBtn.classList.remove("bg-secondary-container", "text-on-secondary");
          addBtn.innerHTML = originalHTML;
          delete addBtn.dataset.feedback;
        }, 1500);
      }
  });

  NS.registerAction("open-product", (e, openBtn) => {
    const id = Number(openBtn.dataset.id);
    if (NS.quickView && NS.quickView.open) NS.quickView.open(id);
  });

  NS.cart = {
    items: getItems,
    add, setQty, remove, clear,
    count, totals,
    applyPromo, removePromo,
    open, close
  };

  NS.initCart = function () {
    load();
    loadPromo();
    emit();
  };
})();