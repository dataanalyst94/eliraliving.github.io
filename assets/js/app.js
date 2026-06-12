/* =========================================================================
   ELIRA LIVING — Runtime app (all pages).
   Reads window.LANG + window.CATALOG (shared) + window.CONTENT (per language).
   Cart, drawer, language switch (/en /de /nl), shop filters, product page,
   checkout, and tuned homepage scroll animations.
   ========================================================================= */
(function () {
  "use strict";
  const LANG = window.LANG || "en";
  const C = window.CONTENT || { ui: {}, products: {}, features: {}, meta: {} };
  const CAT = window.CATALOG;
  const CFG = CAT.CONFIG;
  const LOCALES = { de: "de-DE", nl: "nl-NL", en: "en-IE" };
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const t = (k) => (C.ui && C.ui[k] != null ? C.ui[k] : k);
  // escape any string before putting it in innerHTML (defense-in-depth for
  // cart values that originate from localStorage)
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (c) => new Intl.NumberFormat(LOCALES[LANG] || "en-IE", { style: "currency", currency: "EUR" }).format((c || 0) / 100);
  const pname = (id) => (C.products[id] && C.products[id].name) || id;
  const pImg = (id) => { const p = CAT.getProduct(id); return p ? p.image : ""; };
  const langPrefix = "/" + LANG;
  const switchLangPath = (to) => location.pathname.replace(/^\/(en|de|nl)(\/|$)/, "/" + to + "$2") || "/" + to + "/";

  /* ---- Toast ---------------------------------------------------------- */
  let toastTimer;
  function showToast(msg, ms = 2200) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), ms);
  }

  /* ---- Cart ----------------------------------------------------------- */
  const Cart = {
    KEY: "elira_cart_v2",
    read() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } },
    write(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); document.dispatchEvent(new CustomEvent("cartchange")); },
    count() { return this.read().reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.read().reduce((n, i) => n + i.unitPrice * i.qty, 0); },
    shipping() {
      const items = this.read();
      if (!items.length) return 0;
      if (items.some(i => { const p = CAT.getProduct(i.id); return p && p.freeShipping; })) return 0;
      return this.subtotal() >= CFG.freeShippingThreshold ? 0 : CFG.shippingFlat;
    },
    total() { return this.subtotal() + this.shipping(); },
    add(id, { variant = "", unitPrice = null, qty = 1 } = {}) {
      const p = CAT.getProduct(id); if (!p) return;
      const price = unitPrice != null ? unitPrice : p.price;
      const key = id + "::" + variant;
      const items = this.read();
      const ex = items.find(i => i.key === key);
      if (ex) ex.qty += qty; else items.push({ key, id, name: pname(id), variant, unitPrice: price, qty });
      this.write(items);
      if (window.EliraAnalytics) window.EliraAnalytics.addToCart(id, qty, variant);
    },
    setQty(key, qty) { const items = this.read(); const it = items.find(i => i.key === key); if (it) { it.qty = Math.max(1, qty); this.write(items); } },
    remove(key) { this.write(this.read().filter(i => i.key !== key)); },
    clear() { this.write([]); },
    setLoading(on) { document.querySelectorAll("[data-checkout]").forEach(b => { b.disabled = on; }); },

    badges() { const c = this.count(); document.querySelectorAll("[data-cart-count]").forEach(e => { e.textContent = c; e.style.display = c ? "" : "none"; }); },
    freeBar() {
      const s = this.subtotal();
      if (s === 0) return `<div class="reveal in" style="height:1px;background:var(--line);margin:.5rem 0"></div>`;
      if (this.shipping() === 0) return `<div style="font-size:.75rem;color:var(--sage);margin-bottom:.5rem">${t("cart.freeReached")}</div><div style="height:3px;background:var(--gold)"></div>`;
      const pct = Math.min(100, Math.round(s / CFG.freeShippingThreshold * 100));
      return `<div style="font-size:.75rem;color:var(--muted);margin-bottom:.5rem">${t("cart.freeProgress").replace("{amount}", fmt(CFG.freeShippingThreshold - s))}</div>
        <div style="height:3px;background:var(--line)"><div style="height:100%;width:${pct}%;background:var(--gold);transition:width .5s"></div></div>`;
    },
    lineHTML(i) {
      const variant = i.variant ? `<div class="muted" style="font-size:.72rem;margin-top:.15rem">${esc(i.variant)}</div>` : "";
      return `<div class="cart-line" data-line="${esc(i.key)}">
        <div class="thumb"><img src="${esc(pImg(i.id))}" alt="${esc(i.name)}" loading="lazy"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;gap:.75rem">
            <div class="font-display" style="font-size:1.05rem;line-height:1.2">${esc(i.name)}</div>
            <div style="white-space:nowrap">${fmt(i.unitPrice * i.qty)}</div>
          </div>${variant}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.75rem">
            <div class="qty" style="transform:scale(.85);transform-origin:left">
              <button data-dec aria-label="-">–</button><input data-qin type="number" min="1" value="${i.qty}" aria-label="${t("pdp.qty")}"><button data-inc aria-label="+">+</button>
            </div>
            <button class="link-underline muted" style="font-size:.72rem;background:none;border:none;cursor:pointer" data-rm>${t("cart.remove")}</button>
          </div>
        </div></div>`;
    },
    bindLines(scope) {
      scope.querySelectorAll("[data-line]").forEach(row => {
        const key = row.getAttribute("data-line");
        row.querySelector("[data-dec]")?.addEventListener("click", () => { const it = this.read().find(x => x.key === key); if (it) this.setQty(key, it.qty - 1); });
        row.querySelector("[data-inc]")?.addEventListener("click", () => { const it = this.read().find(x => x.key === key); if (it) this.setQty(key, it.qty + 1); });
        row.querySelector("[data-qin]")?.addEventListener("change", e => this.setQty(key, parseInt(e.target.value, 10) || 1));
        row.querySelector("[data-rm]")?.addEventListener("click", () => this.remove(key));
      });
    },
    /* Abandoned-cart email capture (Klaviyo "Started Checkout") */
    savedEmail() { try { return localStorage.getItem("elira_email") || ""; } catch (e) { return ""; } },
    savedName() { try { return localStorage.getItem("elira_name") || ""; } catch (e) { return ""; } },
    emailBlock() {
      const v = this.savedEmail().replace(/"/g, "&quot;");
      const n = this.savedName().replace(/"/g, "&quot;");
      const fld = "width:100%;box-sizing:border-box;padding:.7rem .85rem;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:.9rem;border-radius:2px";
      return `<div data-email-capture style="margin:0 0 1rem">
        <label style="display:block;font-size:.78rem;color:var(--ink-soft);margin-bottom:.4rem">${t("cart.save.title")}</label>
        <input type="text" data-cart-name value="${n}" placeholder="${t("form.firstName")}" autocomplete="given-name" style="${fld};margin-bottom:.5rem">
        <input type="email" data-cart-email value="${v}" placeholder="${t("news.placeholder")}" autocomplete="email" style="${fld}">
        <p class="muted" style="font-size:.68rem;line-height:1.5;margin:.45rem 0 0" data-email-note>${t("cart.save.consent")}</p>
      </div>`;
    },
    wireEmail(scope) {
      const input = scope && scope.querySelector("[data-cart-email]");
      if (!input) return;
      const nameEl = scope.querySelector("[data-cart-name]");
      const note = scope.querySelector("[data-email-note]");
      const valid = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
      const capture = () => {
        const val = (input.value || "").trim();
        const nm = nameEl ? (nameEl.value || "").trim() : "";
        if (!valid(val)) return;
        try { localStorage.setItem("elira_email", val); if (nm) localStorage.setItem("elira_name", nm); } catch (e) {}
        if (window.EliraAnalytics) {
          window.EliraAnalytics.identifyEmail(val, nm);
          window.EliraAnalytics.startedCheckout(this.read(), this.total(), val, nm);
        }
        if (note) { note.textContent = t("cart.save.saved"); note.style.color = "var(--sage)"; }
      };
      input.addEventListener("change", capture);
      input.addEventListener("blur", capture);
      input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); capture(); input.blur(); } });
      if (nameEl) nameEl.addEventListener("change", () => { const nm = (nameEl.value || "").trim(); if (nm) { try { localStorage.setItem("elira_name", nm); } catch (e) {} } });
    },
    /* In-cart cross-sell (raise AOV) */
    crossSellProduct() {
      const inCart = new Set(this.read().map(i => i.id));
      return CAT.PRODUCTS.find(p => !inCart.has(p.id)) || null;
    },
    crossSellHTML() {
      const p = this.crossSellProduct(); if (!p) return "";
      return `<div data-xsell style="border-top:1px solid var(--line);margin-top:1rem;padding-top:1rem">
        <div class="kicker" style="margin-bottom:.6rem">${t("cart.xsell")}</div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <img src="${pImg(p.id)}" alt="${pname(p.id)}" loading="lazy" style="width:46px;height:58px;object-fit:cover;border:1px solid var(--line)">
          <div style="flex:1;min-width:0"><div class="font-display" style="font-size:.95rem;line-height:1.2">${pname(p.id)}</div><div class="muted" style="font-size:.8rem">${fmt(p.price)}</div></div>
          <button class="btn btn-outline" data-xsell-add="${p.id}" style="padding:.5rem 1rem;font-size:.78rem;white-space:nowrap">${t("cart.add")}</button>
        </div>
      </div>`;
    },
    wireCrossSell(scope) {
      scope && scope.querySelector("[data-xsell-add]")?.addEventListener("click", e => {
        const id = e.currentTarget.getAttribute("data-xsell-add");
        Cart.add(id); showToast(t("toast.added"));
      });
    },
    renderDrawer() {
      const body = document.querySelector("[data-drawer-body]"), foot = document.querySelector("[data-drawer-foot]");
      if (!body) return;
      const items = this.read();
      if (!items.length) { body.innerHTML = `<div style="height:100%;display:grid;place-items:center;text-align:center;padding:2rem"><div><div class="font-display" style="font-size:1.5rem;margin-bottom:.75rem">${t("cart.empty")}</div><a href="${langPrefix}/shop.html" class="btn btn-outline">${t("cart.continue")}</a></div></div>`; if (foot) foot.innerHTML = ""; return; }
      body.innerHTML = `<div style="padding:0 1.25rem">${this.freeBar()}</div><div style="padding:0 1.25rem">${items.map(i => this.lineHTML(i)).join("")}</div>`;
      this.bindLines(body);
      if (foot) {
        foot.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.25rem"><span>${t("cart.subtotal")}</span><span>${fmt(this.subtotal())}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.75rem" class="muted"><span>${t("cart.shipping")}</span><span>${this.shipping() === 0 ? t("cart.shippingFree") : fmt(this.shipping())}</span></div>
          <div class="font-display" style="display:flex;justify-content:space-between;font-size:1.25rem;margin-bottom:1rem;padding-top:.75rem;border-top:1px solid var(--line)"><span>${t("cart.total")}</span><span>${fmt(this.total())}</span></div>
          <button class="btn btn-primary btn-block" data-checkout>${t("cart.checkout")}</button>
          <p class="muted" style="font-size:11px;text-align:center;margin-top:.75rem;line-height:1.5">${t("cart.securenote")}</p>
          ${this.crossSellHTML()}
          ${this.emailBlock()}`;
        foot.querySelector("[data-checkout]")?.addEventListener("click", checkout);
        this.wireEmail(foot);
        this.wireCrossSell(foot);
      }
    },
    renderPage() {
      const wrap = document.querySelector("[data-cart-page]"); if (!wrap) return;
      const items = this.read();
      if (!items.length) { wrap.innerHTML = `<div style="text-align:center;padding:6rem 0"><div class="font-display" style="font-size:2rem;margin-bottom:1rem">${t("cart.empty")}</div><a href="${langPrefix}/shop.html" class="btn btn-primary">${t("cart.continue")}</a></div>`; return; }
      wrap.innerHTML = `<div style="display:grid;gap:2.5rem" class="cart-cols">
        <div><div style="margin-bottom:1.25rem">${this.freeBar()}</div><div data-lines>${items.map(i => this.lineHTML(i)).join("")}</div>
          <a href="${langPrefix}/shop.html" class="link-underline" style="display:inline-block;margin-top:1.5rem;font-size:.9rem">← ${t("cart.continue")}</a></div>
        <aside style="background:var(--surface);border:1px solid var(--line);padding:1.5rem;align-self:start">
          <h2 class="font-display" style="font-size:1.5rem;margin-bottom:1.25rem">${t("cart.title")}</h2>
          <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.5rem"><span>${t("cart.subtotal")}</span><span>${fmt(this.subtotal())}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:1rem" class="muted"><span>${t("cart.shipping")}</span><span>${this.shipping() === 0 ? t("cart.shippingFree") : fmt(this.shipping())}</span></div>
          <div class="font-display" style="display:flex;justify-content:space-between;font-size:1.5rem;margin-bottom:1.25rem;padding-top:1rem;border-top:1px solid var(--line)"><span>${t("cart.total")}</span><span>${fmt(this.total())}</span></div>
          <button class="btn btn-primary btn-block" data-checkout>${t("cart.checkout")}</button>
          <p class="muted" style="font-size:11px;text-align:center;margin-top:.75rem;line-height:1.5">${t("cart.securenote")}</p>
          ${this.crossSellHTML()}
          ${this.emailBlock()}
        </aside></div>`;
      this.bindLines(wrap.querySelector("[data-lines]"));
      wrap.querySelector("[data-checkout]")?.addEventListener("click", checkout);
      this.wireEmail(wrap);
      this.wireCrossSell(wrap);
    },
    renderAll() { this.badges(); this.renderDrawer(); this.renderPage(); }
  };
  window.Cart = Cart;

  /* ---- Checkout (Stripe via Cloudflare Worker) ------------------------ */
  const STRIPE = { endpoint: "https://elira-checkout.elira-living.workers.dev" };
  async function checkout() {
    const items = Cart.read(); if (!items.length) return;
    if (!STRIPE.endpoint) { showToast("Demo mode — Stripe not configured.", 3500); return; }
    // Analytics: begin_checkout / InitiateCheckout (+ stores a pending-purchase snapshot for the success page)
    if (window.EliraAnalytics) {
      const gaItems = items.map(i => { const p = CAT.getProduct(i.id) || {}; return { item_id: p.sku || i.id, item_name: pname(i.id), item_category: t("cat." + p.category), price: +(i.unitPrice / 100).toFixed(2), quantity: i.qty }; });
      window.EliraAnalytics.beginCheckout(gaItems, +(Cart.total() / 100).toFixed(2));
      // Klaviyo abandoned-cart trigger (with captured email if we have one, else anonymous onsite)
      window.EliraAnalytics.startedCheckout(items, Cart.total(), Cart.savedEmail(), Cart.savedName());
    }
    try {
      Cart.setLoading(true);
      const origin = location.origin;
      const res = await fetch(STRIPE.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: LANG,
          items: items.map(i => ({ id: i.id, name: i.name, variant: i.variant, amount: i.unitPrice, quantity: i.qty, priceId: (CAT.getProduct(i.id) || {}).priceId || "" })),
          successUrl: origin + langPrefix + "/success.html?session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: origin + langPrefix + "/cancel.html"
        })
      });
      if (!res.ok) throw new Error("checkout " + res.status);
      const data = await res.json();
      if (data.url) { location.href = data.url; return; }
      throw new Error("no url");
    } catch (e) { console.error(e); Cart.setLoading(false); showToast("Checkout error — please try again.", 3500); }
  }
  window.eliraCheckout = checkout;

  /* ---- Drawer / menu -------------------------------------------------- */
  const openCart = () => { document.querySelector("[data-cart-overlay]")?.classList.add("open"); document.querySelector("[data-drawer]")?.classList.add("open"); document.body.style.overflow = "hidden"; };
  const closeCart = () => { document.querySelector("[data-cart-overlay]")?.classList.remove("open"); document.querySelector("[data-drawer]")?.classList.remove("open"); document.body.style.overflow = ""; };
  const openMenu = () => { document.querySelector("[data-menu-overlay]")?.classList.add("open"); document.querySelector("[data-mobile-menu]")?.classList.add("open"); document.body.style.overflow = "hidden"; };
  const closeMenu = () => { document.querySelector("[data-menu-overlay]")?.classList.remove("open"); document.querySelector("[data-mobile-menu]")?.classList.remove("open"); document.body.style.overflow = ""; };

  /* ---- Reveal --------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .14, rootMargin: "0px 0px -8% 0px" });
    els.forEach(e => io.observe(e));
  }

  /* ---- Shell ---------------------------------------------------------- */
  function wireShell() {
    document.querySelectorAll("[data-year]").forEach(e => e.textContent = new Date().getFullYear());
    const sel = document.querySelector("[data-lang]");
    if (sel) { sel.value = LANG; sel.addEventListener("change", e => { location.href = switchLangPath(e.target.value); }); }
    document.querySelector("[data-cart-open]")?.addEventListener("click", openCart);
    document.querySelector("[data-cart-close]")?.addEventListener("click", closeCart);
    document.querySelector("[data-cart-overlay]")?.addEventListener("click", closeCart);
    document.querySelector("[data-menu-open]")?.addEventListener("click", openMenu);
    document.querySelector("[data-menu-close]")?.addEventListener("click", closeMenu);
    document.querySelector("[data-menu-overlay]")?.addEventListener("click", closeMenu);
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeMenu(); } });
    document.addEventListener("click", e => {
      const qa = e.target.closest("[data-quick-add]");
      if (qa) { e.preventDefault(); e.stopPropagation(); Cart.add(qa.getAttribute("data-quick-add")); showToast(t("toast.added")); openCart(); }
    });
    document.addEventListener("submit", e => {
      const form = e.target;
      if (!form.matches("[data-newsletter]")) return;
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input && input.value ? input.value.trim() : "";
      const fnameEl = form.querySelector('[data-fname]');
      const firstName = fnameEl && fnameEl.value ? fnameEl.value.trim() : "";
      const thanks = () => { form.innerHTML = `<p class="font-display" style="font-size:1.4rem;color:var(--gold)">${t("news.thanks")}</p>`; };
      const K = (window.ELIRA_TRACKING && window.ELIRA_TRACKING.KLAVIYO) || null;
      if (!email || !K || !K.SITE_ID || !K.LIST_ID) { thanks(); return; }
      if (firstName) { try { localStorage.setItem("elira_name", firstName); } catch (_) {} }
      // Klaviyo client-side list subscription (public Site ID; the list's
      // opt-in setting — double opt-in — is enforced by Klaviyo).
      const profileAttrs = firstName ? { email, first_name: firstName } : { email };
      const body = { data: { type: "subscription", attributes: {
        custom_source: "Website newsletter",
        profile: { data: { type: "profile", attributes: profileAttrs } }
      }, relationships: { list: { data: { type: "list", id: K.LIST_ID } } } } };
      fetch("https://a.klaviyo.com/client/subscriptions/?company_id=" + encodeURIComponent(K.SITE_ID), {
        method: "POST",
        headers: { "Content-Type": "application/json", revision: K.REVISION || "2025-01-15" },
        body: JSON.stringify(body)
      }).then(() => { try { (window.dataLayer = window.dataLayer || []).push({ event: "newsletter_signup" }); } catch (_) {} })
        .catch(() => {})
        .finally(thanks);
    });
    const header = document.querySelector(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---- Shop filters --------------------------------------------------- */
  function initShop() {
    const grid = document.querySelector("[data-shop-grid]"); if (!grid) return;
    const cards = [...grid.children];
    const params = new URLSearchParams(location.search);
    let cat = params.get("category") || "all";
    const apply = () => {
      let shown = 0;
      cards.forEach(c => { const ok = cat === "all" || c.getAttribute("data-cat") === cat; c.style.display = ok ? "" : "none"; if (ok) shown++; });
      document.querySelectorAll("[data-filter-cat]").forEach(b => b.setAttribute("aria-pressed", b.getAttribute("data-filter-cat") === cat));
      const cnt = document.querySelector("[data-shop-count]"); if (cnt) cnt.textContent = shown + " " + t("shop.results");
    };
    document.querySelectorAll("[data-filter-cat]").forEach(b => b.addEventListener("click", () => { cat = b.getAttribute("data-filter-cat"); apply(); }));
    const sort = document.querySelector("[data-sort]");
    if (sort) sort.addEventListener("change", () => {
      const v = sort.value, visible = cards.slice();
      visible.sort((a, b) => {
        const pa = +a.getAttribute("data-price"), pb = +b.getAttribute("data-price");
        if (v === "priceAsc") return pa - pb; if (v === "priceDesc") return pb - pa;
        if (v === "name") return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name")); return 0;
      });
      visible.forEach(c => grid.appendChild(c));
    });
    apply();
  }

  /* ---- Product page --------------------------------------------------- */
  function initProduct() {
    const root = document.querySelector("[data-product]"); if (!root) return;
    const id = root.getAttribute("data-product"); const p = CAT.getProduct(id); if (!p) return;
    const qty = root.querySelector("[data-qin]");
    root.querySelector("[data-dec]")?.addEventListener("click", () => qty.value = Math.max(1, (+qty.value || 1) - 1));
    root.querySelector("[data-inc]")?.addEventListener("click", () => qty.value = (+qty.value || 1) + 1);
    const variant = (p.size || "");
    const addToCart = () => { Cart.add(id, { variant, qty: Math.max(1, parseInt(qty.value, 10) || 1) }); showToast(t("toast.added")); };
    root.querySelector("[data-add]")?.addEventListener("click", () => { addToCart(); openCart(); });
    root.querySelector("[data-buy]")?.addEventListener("click", () => { addToCart(); checkout(); });

    /* ---- Image gallery + lightbox ---- */
    const mainImg = root.querySelector("[data-gallery-img]");
    const thumbs = [...root.querySelectorAll("[data-gallery-thumb]")];
    thumbs.forEach(btn => btn.addEventListener("click", () => {
      if (!mainImg) return;
      const src = btn.getAttribute("data-gallery-thumb");
      mainImg.setAttribute("src", src);
      // keep the WebP <source> in sync so the picture shows the right image
      const srcEl = mainImg.parentElement && mainImg.parentElement.querySelector("source");
      if (srcEl) srcEl.setAttribute("srcset", src.replace(/\.jpe?g$/i, ".webp"));
      thumbs.forEach(b => b.classList.toggle("active", b === btn));
    }));
    const mainBox = root.querySelector("[data-gallery-main]");
    if (mainImg && mainBox) {
      const closeLb = () => { const lb = document.querySelector(".lightbox.open"); if (lb) { lb.classList.remove("open"); document.body.style.overflow = ""; } };
      const openLb = () => {
        let lb = document.querySelector(".lightbox");
        if (!lb) {
          lb = document.createElement("div"); lb.className = "lightbox";
          lb.innerHTML = `<button class="lightbox-close" aria-label="Close"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img alt="">`;
          document.body.appendChild(lb);
          lb.addEventListener("click", e => { if (e.target === lb || e.target.closest(".lightbox-close")) closeLb(); });
        }
        lb.querySelector("img").setAttribute("src", mainImg.getAttribute("src"));
        lb.classList.add("open"); document.body.style.overflow = "hidden";
      };
      mainBox.addEventListener("click", openLb);
      mainBox.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(); } });
      document.addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });
    }

    /* ---- Mobile sticky add-to-cart ---- */
    const stickyBar = document.querySelector("[data-sticky-cart]");
    const addBtnEl = root.querySelector("[data-add]");
    if (stickyBar && addBtnEl && "IntersectionObserver" in window) {
      stickyBar.querySelector("[data-sticky-add]")?.addEventListener("click", () => { addToCart(); openCart(); });
      new IntersectionObserver(ents => {
        ents.forEach(e => stickyBar.classList.toggle("visible", !e.isIntersecting && e.boundingClientRect.top < 0));
      }, { threshold: 0 }).observe(addBtnEl);
    }
  }

  /* ---- Homepage animations (GSAP + Lenis) ----------------------------- */
  function homeStaticFallback() {
    document.querySelectorAll("[data-ingredient]").forEach(e => e.style.opacity = 1);
    document.querySelectorAll("[data-botanical]").forEach(e => e.style.opacity = .25);
    const c = document.querySelector("[data-count]"); if (c) c.textContent = c.dataset.count + (c.dataset.suffix || "");
    document.documentElement.classList.remove("pre-anim");
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = false; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function loadMotionLibs() {
    if (window.gsap && window.ScrollTrigger && window.Lenis) return;
    const v = window.ELIRA_V ? ("?v=" + window.ELIRA_V) : "";
    await loadScript("/assets/vendor/gsap.min.js" + v);
    await loadScript("/assets/vendor/ScrollTrigger.min.js" + v);
    await loadScript("/assets/vendor/lenis.min.js" + v);
  }
  function initHomeMotion() {
    const isHome = document.body.getAttribute("data-page") === "home";
    if (!isHome) return;
    // The heavy animation libs (~128KB) load on larger screens only. Phones and
    // reduced-motion visitors get a lightweight static layout — far less
    // main-thread work, much better mobile TBT/LCP.
    const bigScreen = window.matchMedia("(min-width: 760px)").matches;
    if (REDUCED || !bigScreen) { homeStaticFallback(); return; }
    const safety = setTimeout(() => document.documentElement.classList.remove("pre-anim"), 2500);
    loadMotionLibs().then(() => { clearTimeout(safety); runHomeMotion(); })
                    .catch(() => { clearTimeout(safety); homeStaticFallback(); });
  }
  function runHomeMotion() {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((tm) => lenis.raf(tm * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    gsap.from("[data-hero-text] > *", { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 });
    gsap.fromTo("[data-wordmark]", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.5 });
    // hero start-states are now set by GSAP — safe to reveal (removes anti-flash guard)
    document.documentElement.classList.remove("pre-anim");
    const hST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to("[data-hero-bg]", { yPercent: 16, ease: "none", scrollTrigger: hST });
    gsap.to("[data-hero-text]", { yPercent: -24, opacity: 0, ease: "none", scrollTrigger: hST });
    gsap.to("[data-wordmark]", { yPercent: -50, ease: "none", scrollTrigger: hST });
    gsap.utils.toArray("[data-botanical]").forEach((el, i) => {
      gsap.to(el, { opacity: 0.5, duration: 1.2, delay: 0.4 + i * 0.2 });
      gsap.to(el, { y: "+=24", rotation: 10, duration: 7 + i * 1.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(el, { yPercent: (i % 2 ? -1 : 1) * 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    });
    const chapter = document.querySelector("[data-chapter]");
    if (chapter) {
      const heads = gsap.utils.toArray("[data-headline]");
      heads.forEach((h, i) => h.style.opacity = i === 0 ? "1" : "0");
      const setHead = (idx) => heads.forEach((h, i) => h.style.opacity = i === idx ? "1" : "0");
      const ings = gsap.utils.toArray("[data-ingredient]");
      gsap.set(ings, { opacity: 0, y: 26 });
      gsap.set("[data-chapter-glow]", { scale: 0.6, opacity: 0.15 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: chapter, start: "top top", end: "+=180%", pin: true, scrub: 0.5, anticipatePin: 1, onUpdate: (self) => setHead(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2) } });
      // scroll drives a slow 3D turn + zoom (perspective comes from .chapter__stage)
      tl.fromTo("[data-chapter-product]",
            { rotateY: -18, rotateX: 5, scale: 0.9 },
            { rotateY: 14, rotateX: -4, scale: 1.4, ease: "none", duration: 1 }, 0)
        .to("[data-chapter-glow]", { scale: 1.2, opacity: 1, ease: "none", duration: 1 }, 0)
        .to(ings[0], { opacity: 1, y: 0, duration: 0.2 }, 0.15)
        .to(ings[1], { opacity: 1, y: 0, duration: 0.2 }, 0.42)
        .to(ings[2], { opacity: 1, y: 0, duration: 0.2 }, 0.68);
      // always-on classy float: the bottle gently drifts & sways even when idle
      gsap.fromTo("[data-chapter-product] img",
        { y: -10, rotationZ: -1.3, scale: 1 },
        { y: 10, rotationZ: 1.3, scale: 1.015, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
    ScrollTrigger.batch(".grid-products .card", { start: "top 86%", onEnter: (els) => gsap.from(els, { y: 48, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, overwrite: true }) });
    const countEl = document.querySelector("[data-count]");
    if (countEl) { const o = { v: 0 }, target = +countEl.dataset.count, sfx = countEl.dataset.suffix || ""; gsap.to(o, { v: target, duration: 2.0, ease: "power2.out", scrollTrigger: { trigger: countEl, start: "top 85%" }, onUpdate: () => countEl.textContent = Math.round(o.v) + sfx }); }
    document.querySelectorAll("[data-leaf] path").forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: "[data-cert]", start: "top 75%" } }); });
    gsap.fromTo("[data-split] img", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: "[data-split]", start: "top bottom", end: "bottom top", scrub: true } });

    /* Reviews — full-3D pop-up: a couple of cards rise & rotate into place as
       you scroll. Cards are grouped by row (ScrollTrigger.batch), so they
       appear two/three at a time with a soft stagger. */
    const rcards = gsap.utils.toArray("[data-rcard]");
    if (rcards.length) {
      ScrollTrigger.batch(rcards, {
        start: "top 90%",
        onEnter: (els) => gsap.from(els, {
          opacity: 0, y: 90, z: -280, scale: 0.92, rotateX: -32,
          rotateY: (i, t) => t.dataset.col === "0" ? 13 : t.dataset.col === "2" ? -13 : 0,
          transformOrigin: "50% 100%",
          duration: 1.05, ease: "power3.out", stagger: 0.14, overwrite: true
        })
      });
      // gentle scroll parallax for depth on the whole grid
      gsap.fromTo("[data-reviews-grid]", { yPercent: 4 }, { yPercent: -4, ease: "none", scrollTrigger: { trigger: ".reviews", start: "top bottom", end: "bottom top", scrub: true } });
    }
    // libs loaded after window 'load', so re-measure trigger positions once settled
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  /* ---- Boot ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    wireShell();
    Cart.renderAll();
    initReveal();
    initShop();
    initProduct();
    initHomeMotion();
    if (document.body.getAttribute("data-page") === "success") Cart.clear();
    document.addEventListener("cartchange", () => Cart.renderAll());
    window.addEventListener("load", () => window.ScrollTrigger && ScrollTrigger.refresh());
  });
})();
