/* =========================================================================
   Elira Living — Cart engine (localStorage). Drawer + cart page rendering.
   ========================================================================= */

const FREE_SHIPPING_THRESHOLD = 3900; // €39.00
const SHIPPING_FLAT = 495;            // €4.95

const Cart = {
  KEY: "elira_cart_v1",

  _read() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  _write(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cartchange"));
  },

  items() { return this._read(); },
  count() { return this._read().reduce((n, i) => n + i.qty, 0); },
  subtotal() { return this._read().reduce((n, i) => n + i.unitPrice * i.qty, 0); },
  shipping() {
    const items = this._read();
    if (!items.length) return 0;
    return this.subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  },
  total() { return this.subtotal() + this.shipping(); },

  add(id, { variant = "", unitPrice = null, name = null, qty = 1 } = {}) {
    const p = getProduct(id);
    if (!p) return;
    const price = unitPrice != null ? unitPrice : p.price;
    const label = name || p.name;
    const key = id + "::" + variant;
    const items = this._read();
    const existing = items.find(i => i.key === key);
    if (existing) existing.qty += qty;
    else items.push({ key, id, name: label, variant, unitPrice: price, qty });
    this._write(items);
  },

  setQty(key, qty) {
    let items = this._read();
    const it = items.find(i => i.key === key);
    if (!it) return;
    it.qty = Math.max(1, qty);
    this._write(items);
  },

  remove(key) {
    this._write(this._read().filter(i => i.key !== key));
  },

  clear() { this._write([]); },

  setCheckoutLoading(on) {
    document.querySelectorAll("[data-checkout-btn]").forEach(btn => {
      btn.disabled = on;
      btn.classList.toggle("opacity-60", on);
      btn.classList.toggle("pointer-events-none", on);
    });
  },

  lineImage(item) {
    const p = getProduct(item.id);
    if (window.placeholderSVG) return window.placeholderSVG(p);
    return (p && p.img) || "";
  },

  // ---- Rendering --------------------------------------------------------
  renderBadges() {
    const c = this.count();
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = c;
      el.classList.toggle("hidden", c === 0);
    });
  },

  freeShipMarkup() {
    const sub = this.subtotal();
    const t = (k) => I18nState.t(k);
    if (sub >= FREE_SHIPPING_THRESHOLD || sub === 0) {
      const pct = sub === 0 ? 0 : 100;
      const msg = sub === 0 ? "" : t("cart.freeReached");
      return `<div class="text-xs tracking-wide text-[color:var(--sage)] mb-2">${msg}</div>
        <div class="h-1 bg-[color:var(--line)] overflow-hidden"><div class="h-full bg-[color:var(--clay)]" style="width:${pct}%"></div></div>`;
    }
    const remaining = FREE_SHIPPING_THRESHOLD - sub;
    const pct = Math.min(100, Math.round((sub / FREE_SHIPPING_THRESHOLD) * 100));
    const msg = t("cart.freeProgress").replace("{amount}", I18nState.formatPrice(remaining));
    return `<div class="text-xs tracking-wide text-[color:var(--muted)] mb-2">${msg}</div>
      <div class="h-1 bg-[color:var(--line)] overflow-hidden"><div class="h-full bg-[color:var(--clay)] transition-all duration-500" style="width:${pct}%"></div></div>`;
  },

  lineRowHTML(i) {
    const fmt = (c) => I18nState.formatPrice(c);
    const variant = i.variant ? `<div class="text-xs text-[color:var(--muted)] mt-0.5">${i.variant}</div>` : "";
    return `
    <div class="flex gap-4 py-4 border-b border-[color:var(--line)]" data-line="${i.key}">
      <div class="w-20 h-24 shrink-0 bg-[color:var(--stone)] overflow-hidden">
        <img src="${this.lineImage(i)}" alt="${i.name}" class="w-full h-full object-cover" loading="lazy">
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-3">
          <div class="font-display text-lg leading-tight">${i.name}</div>
          <div class="whitespace-nowrap">${fmt(i.unitPrice * i.qty)}</div>
        </div>
        ${variant}
        <div class="flex items-center justify-between mt-3">
          <div class="inline-flex items-center border border-[color:var(--line)]">
            <button class="w-8 h-8 grid place-items-center hover:bg-[color:var(--stone)] cursor-pointer" data-qty-dec aria-label="Decrease quantity">–</button>
            <input type="number" min="1" value="${i.qty}" data-qty-input class="w-10 h-8 text-center bg-transparent text-sm" aria-label="Quantity">
            <button class="w-8 h-8 grid place-items-center hover:bg-[color:var(--stone)] cursor-pointer" data-qty-inc aria-label="Increase quantity">+</button>
          </div>
          <button class="text-xs text-[color:var(--muted)] hover:text-[color:var(--clay-700)] link-underline cursor-pointer" data-remove>${I18nState.t("cart.remove")}</button>
        </div>
      </div>
    </div>`;
  },

  bindLineEvents(scope) {
    scope.querySelectorAll("[data-line]").forEach(row => {
      const key = row.getAttribute("data-line");
      row.querySelector("[data-qty-dec]")?.addEventListener("click", () => {
        const it = this._read().find(x => x.key === key); if (it) this.setQty(key, it.qty - 1);
      });
      row.querySelector("[data-qty-inc]")?.addEventListener("click", () => {
        const it = this._read().find(x => x.key === key); if (it) this.setQty(key, it.qty + 1);
      });
      row.querySelector("[data-qty-input]")?.addEventListener("change", (e) => {
        this.setQty(key, parseInt(e.target.value, 10) || 1);
      });
      row.querySelector("[data-remove]")?.addEventListener("click", () => this.remove(key));
    });
  },

  renderDrawer() {
    const body = document.querySelector("[data-drawer-body]");
    const footer = document.querySelector("[data-drawer-footer]");
    if (!body) return;
    const items = this._read();
    const t = (k) => I18nState.t(k);

    if (!items.length) {
      body.innerHTML = `<div class="h-full grid place-items-center text-center px-8">
        <div>
          <div class="font-display text-2xl mb-3">${t("cart.empty")}</div>
          <a href="shop.html" class="btn btn-outline mt-2">${t("cart.continue")}</a>
        </div></div>`;
      footer.innerHTML = "";
      return;
    }

    body.innerHTML = `<div class="px-5">${this.freeShipMarkup()}</div>
      <div class="px-5">${items.map(i => this.lineRowHTML(i)).join("")}</div>`;
    this.bindLineEvents(body);

    footer.innerHTML = `
      <div class="flex justify-between text-sm mb-1"><span>${t("cart.subtotal")}</span><span>${I18nState.formatPrice(this.subtotal())}</span></div>
      <div class="flex justify-between text-sm mb-3 text-[color:var(--muted)]">
        <span>${t("cart.shipping")}</span>
        <span>${this.shipping() === 0 ? t("cart.shippingFree") : I18nState.formatPrice(this.shipping())}</span>
      </div>
      <div class="flex justify-between font-display text-xl mb-4 pt-3 border-t border-[color:var(--line)]">
        <span>${t("cart.total")}</span><span>${I18nState.formatPrice(this.total())}</span>
      </div>
      <button class="btn btn-primary w-full" data-checkout-btn>${t("cart.checkout")}</button>
      <p class="text-[11px] text-center text-[color:var(--muted)] mt-3 leading-relaxed">${t("cart.securenote")}</p>`;
    footer.querySelector("[data-checkout-btn]")?.addEventListener("click", () => window.startCheckout());
  },

  renderPage() {
    const wrap = document.querySelector("[data-cart-page]");
    if (!wrap) return;
    const items = this._read();
    const t = (k) => I18nState.t(k);

    if (!items.length) {
      wrap.innerHTML = `<div class="text-center py-24">
        <div class="font-display text-3xl mb-4">${t("cart.empty")}</div>
        <a href="shop.html" class="btn btn-primary mt-2">${t("cart.continue")}</a>
      </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
        <div>
          <div class="mb-5">${this.freeShipMarkup()}</div>
          <div data-lines>${items.map(i => this.lineRowHTML(i)).join("")}</div>
          <a href="shop.html" class="inline-block mt-6 text-sm link-underline cursor-pointer">← ${t("cart.continue")}</a>
        </div>
        <aside class="lg:sticky lg:top-28 self-start bg-[color:var(--cream)] border border-[color:var(--line)] p-6 md:p-8">
          <h2 class="font-display text-2xl mb-5">${t("cart.title")}</h2>
          <div class="flex justify-between text-sm mb-2"><span>${t("cart.subtotal")}</span><span>${I18nState.formatPrice(this.subtotal())}</span></div>
          <div class="flex justify-between text-sm mb-4 text-[color:var(--muted)]">
            <span>${t("cart.shipping")}</span>
            <span>${this.shipping() === 0 ? t("cart.shippingFree") : I18nState.formatPrice(this.shipping())}</span>
          </div>
          <div class="flex justify-between font-display text-2xl mb-5 pt-4 border-t border-[color:var(--line)]">
            <span>${t("cart.total")}</span><span>${I18nState.formatPrice(this.total())}</span>
          </div>
          <button class="btn btn-primary w-full" data-checkout-btn>${t("cart.checkout")}</button>
          <p class="text-[11px] text-center text-[color:var(--muted)] mt-3 leading-relaxed">${t("cart.securenote")}</p>
        </aside>
      </div>`;
    this.bindLineEvents(wrap.querySelector("[data-lines]"));
    wrap.querySelector("[data-checkout-btn]")?.addEventListener("click", () => window.startCheckout());
  },

  renderAll() {
    this.renderBadges();
    this.renderDrawer();
    this.renderPage();
  }
};

window.Cart = Cart;
window.FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;
