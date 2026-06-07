/* =========================================================================
   Elira Living — App shell: header/footer/drawer, animations, i18n wiring,
   product rendering, and per-page initialisers.
   ========================================================================= */

/* ---- Elegant on-brand image fallback (no broken images, works offline) - */
function placeholderSVG(p) {
  const grad = (window.CATEGORY_GRADIENT && CATEGORY_GRADIENT[p?.category]) || ["#E4DCCF", "#B89B6E"];
  const title = (p?.name || "Elira Living").replace(/&/g, "&amp;");
  const cat = (p?.category || "").toUpperCase();
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${grad[0]}'/>
        <stop offset='1' stop-color='${grad[1]}'/>
      </linearGradient>
    </defs>
    <rect width='800' height='1000' fill='url(#g)'/>
    <circle cx='400' cy='420' r='150' fill='rgba(255,255,255,0.16)'/>
    <circle cx='400' cy='420' r='150' fill='none' stroke='rgba(23,21,15,0.18)' stroke-width='1'/>
    <text x='400' y='452' font-family='Bodoni Moda, Georgia, serif' font-size='150' fill='rgba(23,21,15,0.55)' text-anchor='middle'>E</text>
    <text x='400' y='720' font-family='Bodoni Moda, Georgia, serif' font-size='44' fill='rgba(23,21,15,0.78)' text-anchor='middle'>${title}</text>
    <text x='400' y='770' font-family='Jost, sans-serif' font-size='20' letter-spacing='8' fill='rgba(23,21,15,0.5)' text-anchor='middle'>${cat}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
}
window.placeholderSVG = placeholderSVG;

function imgWithFallback(p, cls = "", sizes = "(max-width:768px) 100vw, 33vw") {
  const fb = placeholderSVG(p);
  const src = p.img || fb;
  return `<img src="${src}" alt="${p.name}" class="${cls}" loading="lazy" decoding="async"
    onerror="this.onerror=null;this.src='${fb}';">`;
}

/* ---- Product card ------------------------------------------------------ */
function productCardHTML(p) {
  const badge = p.badge
    ? `<span class="tag absolute top-3 left-3 z-10">${p.badge === "new" ? "New" : "Bestseller"}</span>` : "";
  return `
  <article class="product-card group">
    <a href="product.html?id=${p.id}" class="block">
      <div class="media aspect-[4/5] relative">
        ${badge}
        ${imgWithFallback(p, "w-full h-full object-cover")}
        <button class="quick-add btn btn-primary text-sm !py-2.5 !px-5" data-quick-add="${p.id}"
          aria-label="${I18nState.t('pdp.add')}">${I18nState.t("pdp.add")}</button>
      </div>
    </a>
    <div class="pt-4 flex items-start justify-between gap-3">
      <div>
        <a href="product.html?id=${p.id}" class="font-display text-lg leading-snug link-underline">${p.name}</a>
        <div class="text-xs text-[color:var(--muted)] mt-1">${productDesc(p)}</div>
      </div>
      <div class="font-display text-lg whitespace-nowrap">${I18nState.formatPrice(p.price)}</div>
    </div>
  </article>`;
}

/* ---- Header ------------------------------------------------------------ */
function headerHTML() {
  const page = document.body.getAttribute("data-page") || "";
  const cur = (href) => href === page ? 'aria-current="page"' : "";
  return `
  <div class="marquee bg-[color:var(--ink)] text-[color:var(--cream)] text-[12px] tracking-[0.18em] uppercase py-2">
    <div class="marquee__track">
      <span class="mx-8" data-i18n="announce.1"></span><span class="mx-2">·</span>
      <span class="mx-8" data-i18n="announce.2"></span><span class="mx-2">·</span>
      <span class="mx-8" data-i18n="announce.3"></span><span class="mx-2">·</span>
      <span class="mx-8" data-i18n="announce.1"></span><span class="mx-2">·</span>
      <span class="mx-8" data-i18n="announce.2"></span><span class="mx-2">·</span>
      <span class="mx-8" data-i18n="announce.3"></span>
    </div>
  </div>
  <nav class="max-w-7xl mx-auto px-5 md:px-8 h-[68px] flex items-center justify-between">
    <div class="flex items-center gap-8">
      <button class="md:hidden -ml-1 p-2 cursor-pointer" data-menu-open aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <a href="index.html" class="font-display text-2xl tracking-tight">Elira Living</a>
    </div>

    <div class="hidden md:flex items-center gap-8 text-[15px]">
      <a href="shop.html" class="nav-link" ${cur('shop')} data-i18n="nav.shop"></a>
      <a href="shop.html?gender=women" class="nav-link" data-i18n="nav.women"></a>
      <a href="shop.html?gender=men" class="nav-link" data-i18n="nav.men"></a>
      <a href="shop.html?gender=unisex" class="nav-link" data-i18n="nav.unisex"></a>
      <a href="about.html" class="nav-link" ${cur('about')} data-i18n="nav.about"></a>
    </div>

    <div class="flex items-center gap-3 md:gap-5">
      <div class="relative">
        <select data-lang aria-label="Language"
          class="appearance-none bg-transparent text-sm font-medium pr-5 pl-1 py-1 cursor-pointer focus:outline-none uppercase tracking-wide">
          <option value="de">DE</option><option value="nl">NL</option><option value="en">EN</option>
        </select>
        <svg class="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <button class="relative p-1.5 cursor-pointer" data-cart-open data-i18n-aria="nav.cart" aria-label="Cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
        <span data-cart-count class="hidden absolute -top-1 -right-1 bg-[color:var(--clay)] text-[color:var(--cream)] text-[10px] leading-none min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full">0</span>
      </button>
    </div>
  </nav>`;
}

/* ---- Mobile menu ------------------------------------------------------- */
function mobileMenuHTML() {
  return `
  <div class="drawer-overlay" data-menu-overlay></div>
  <div class="mobile-menu fixed top-0 left-0 bottom-0 w-[82%] max-w-sm bg-[color:var(--cream)] z-[61] -translate-x-full p-7 flex flex-col" data-mobile-menu>
    <div class="flex items-center justify-between mb-10">
      <span class="font-display text-2xl">Elira Living</span>
      <button data-menu-close class="p-2 cursor-pointer" aria-label="Close menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
    <nav class="flex flex-col gap-6 font-display text-3xl">
      <a href="shop.html" data-i18n="nav.shop"></a>
      <a href="shop.html?gender=women" data-i18n="nav.women"></a>
      <a href="shop.html?gender=men" data-i18n="nav.men"></a>
      <a href="shop.html?gender=unisex" data-i18n="nav.unisex"></a>
      <a href="about.html" data-i18n="nav.about"></a>
    </nav>
    <div class="mt-auto text-sm text-[color:var(--muted)]" data-i18n="foot.tag"></div>
  </div>`;
}

/* ---- Cart drawer ------------------------------------------------------- */
function drawerHTML() {
  return `
  <div class="drawer-overlay" data-cart-overlay></div>
  <aside class="drawer" data-drawer aria-label="Shopping cart">
    <header class="flex items-center justify-between px-5 py-4 border-b border-[color:var(--line)]">
      <h2 class="font-display text-xl" data-i18n="cart.title"></h2>
      <button data-cart-close class="p-1.5 cursor-pointer" aria-label="Close cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <div class="flex-1 overflow-y-auto py-4" data-drawer-body></div>
    <footer class="border-t border-[color:var(--line)] p-5" data-drawer-footer></footer>
  </aside>`;
}

/* ---- Footer ------------------------------------------------------------ */
function footerHTML() {
  const year = new Date().getFullYear();
  return `
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
    <div class="grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 md:gap-8">
      <div class="max-w-xs">
        <div class="font-display text-3xl mb-3">Elira Living</div>
        <p class="text-sm text-[color:var(--muted)] leading-relaxed" data-i18n="foot.tag"></p>
        <div class="flex gap-4 mt-6">
          <a href="#" aria-label="Instagram" class="hover:text-[color:var(--clay-700)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
          <a href="#" aria-label="TikTok" class="hover:text-[color:var(--clay-700)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 12a3 3 0 1 0 3 3V4c.7 2 2 3 4 3"/></svg></a>
          <a href="#" aria-label="Pinterest" class="hover:text-[color:var(--clay-700)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3a8 8 0 0 0-3 15.5M12 8c-1.5 0-2.5 1-2.5 2.5 0 2-1.5 6-1.5 6"/><circle cx="12" cy="11" r="0.5" fill="currentColor"/></svg></a>
        </div>
      </div>
      <div>
        <h3 class="kicker mb-4" data-i18n="foot.shop"></h3>
        <ul class="space-y-2.5 text-sm">
          <li><a href="shop.html?gender=women" class="link-underline" data-i18n="nav.women"></a></li>
          <li><a href="shop.html?gender=men" class="link-underline" data-i18n="nav.men"></a></li>
          <li><a href="shop.html?gender=unisex" class="link-underline" data-i18n="nav.unisex"></a></li>
          <li><a href="shop.html" class="link-underline" data-i18n="nav.shop"></a></li>
        </ul>
      </div>
      <div>
        <h3 class="kicker mb-4" data-i18n="foot.help"></h3>
        <ul class="space-y-2.5 text-sm">
          <li><a href="withdrawal.html" class="link-underline" data-i18n="foot.shipping"></a></li>
          <li><a href="terms.html" class="link-underline" data-i18n="foot.faq"></a></li>
          <li><a href="mailto:hello@elira-living.com" class="link-underline" data-i18n="foot.contact"></a></li>
        </ul>
      </div>
      <div>
        <h3 class="kicker mb-4" data-i18n="foot.company"></h3>
        <ul class="space-y-2.5 text-sm">
          <li><a href="about.html" class="link-underline" data-i18n="foot.about"></a></li>
          <li><a href="#" class="link-underline" data-i18n="foot.sustain"></a></li>
          <li><a href="#" class="link-underline" data-i18n="foot.press"></a></li>
        </ul>
      </div>
    </div>
    <div class="mt-14 pt-6 border-t border-[color:var(--line)] flex flex-col md:flex-row gap-4 justify-between items-center text-xs text-[color:var(--muted)]">
      <div>© ${year} Elira Living · <span data-i18n="foot.rights"></span></div>
      <div class="flex flex-wrap gap-5 justify-center">
        <a href="privacy.html" class="link-underline" data-i18n="foot.privacy"></a>
        <a href="terms.html" class="link-underline" data-i18n="foot.terms"></a>
        <a href="withdrawal.html" class="link-underline" data-i18n="foot.withdrawal"></a>
        <a href="impressum.html" class="link-underline" data-i18n="foot.imprint"></a>
      </div>
      <div class="flex items-center gap-2 opacity-80">
        <span>Stripe</span><span>·</span><span>iDEAL</span><span>·</span><span>Klarna</span><span>·</span><span>SEPA</span>
      </div>
    </div>
  </div>`;
}

/* ---- Toast ------------------------------------------------------------- */
let toastTimer;
function showToast(msg, ms = 2200) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}
window.showToast = showToast;

/* ---- Drawer / menu controls ------------------------------------------- */
function openCart() {
  document.querySelector("[data-cart-overlay]")?.classList.add("open");
  document.querySelector("[data-drawer]")?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  document.querySelector("[data-cart-overlay]")?.classList.remove("open");
  document.querySelector("[data-drawer]")?.classList.remove("open");
  document.body.style.overflow = "";
}
function openMenu() {
  document.querySelector("[data-menu-overlay]")?.classList.add("open");
  const m = document.querySelector("[data-mobile-menu]");
  if (m) m.style.transform = "translateX(0)";
  document.body.style.overflow = "hidden";
}
function closeMenu() {
  document.querySelector("[data-menu-overlay]")?.classList.remove("open");
  const m = document.querySelector("[data-mobile-menu]");
  if (m) m.style.transform = "translateX(-100%)";
  document.body.style.overflow = "";
}

/* ---- Scroll reveal ----------------------------------------------------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal, .line-mask");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach(e => io.observe(e));
}

/* ---- Header scroll state ---------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---- Shell wiring ------------------------------------------------------ */
function mountShell() {
  const header = document.getElementById("site-header");
  if (header) { header.className = "site-header"; header.innerHTML = headerHTML(); }
  const footer = document.getElementById("site-footer");
  if (footer) { footer.className = "bg-[color:var(--cream)] border-t border-[color:var(--line)] relative z-10"; footer.innerHTML = footerHTML(); }

  document.body.insertAdjacentHTML("beforeend", drawerHTML());
  document.body.insertAdjacentHTML("beforeend", mobileMenuHTML());

  // Language select
  const sel = document.querySelector("[data-lang]");
  if (sel) {
    sel.value = I18nState.lang;
    sel.addEventListener("change", e => I18nState.setLang(e.target.value));
  }

  // Controls
  document.querySelector("[data-cart-open]")?.addEventListener("click", openCart);
  document.querySelector("[data-cart-close]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-overlay]")?.addEventListener("click", closeCart);
  document.querySelector("[data-menu-open]")?.addEventListener("click", openMenu);
  document.querySelector("[data-menu-close]")?.addEventListener("click", closeMenu);
  document.querySelector("[data-menu-overlay]")?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeMenu(); } });

  // Quick-add (event delegation)
  document.addEventListener("click", e => {
    const qa = e.target.closest("[data-quick-add]");
    if (qa) {
      e.preventDefault();
      Cart.add(qa.getAttribute("data-quick-add"));
      showToast(I18nState.t("toast.added"));
      openCart();
    }
  });

  initHeaderScroll();
}

/* ---- Page initialisers ------------------------------------------------- */
function initHome() {
  const grid = document.querySelector("[data-bestsellers]");
  if (grid) {
    const best = PRODUCTS.filter(p => p.badge === "bestseller").slice(0, 4);
    grid.innerHTML = best.map((p, i) =>
      `<div class="reveal reveal-delay-${(i % 4) + 1}">${productCardHTML(p)}</div>`).join("");
  }
}

function initShop() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const state = {
    gender: params.get("gender") || "all",
    category: params.get("category") || "all",
    sort: "featured"
  };

  const render = () => {
    let list = getProducts({ category: state.category, gender: state.gender });
    if (state.sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    const count = document.querySelector("[data-shop-count]");
    if (count) count.textContent = `${list.length} ${I18nState.t("shop.results")}`;

    grid.innerHTML = list.length
      ? list.map((p, i) => `<div class="reveal reveal-delay-${(i % 4) + 1}">${productCardHTML(p)}</div>`).join("")
      : `<p class="col-span-full text-center py-20 text-[color:var(--muted)]">${I18nState.t("shop.empty")}</p>`;
    initReveal();

    document.querySelectorAll("[data-filter-gender]").forEach(b =>
      b.setAttribute("aria-pressed", b.getAttribute("data-filter-gender") === state.gender));
    document.querySelectorAll("[data-filter-cat]").forEach(b =>
      b.setAttribute("aria-pressed", b.getAttribute("data-filter-cat") === state.category));
  };

  document.querySelectorAll("[data-filter-gender]").forEach(b =>
    b.addEventListener("click", () => { state.gender = b.getAttribute("data-filter-gender"); render(); }));
  document.querySelectorAll("[data-filter-cat]").forEach(b =>
    b.addEventListener("click", () => { state.category = b.getAttribute("data-filter-cat"); render(); }));
  document.querySelector("[data-sort]")?.addEventListener("change", e => { state.sort = e.target.value; render(); });

  document.addEventListener("langchange", render);
  render();
}

function initProduct() {
  const root = document.querySelector("[data-product-page]");
  if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || PRODUCTS[0];
  document.title = `${p.name} — Elira Living`;

  const sel = { variant: "", add: 0 };
  const variants = p.shades
    ? { kind: "shade", items: p.shades.map(s => ({ label: s.name, hex: s.hex, add: 0 })) }
    : p.sizes
      ? { kind: "size", items: p.sizes.map(s => ({ label: s.name, add: s.add || 0 })) }
      : null;
  if (variants) { sel.variant = variants.items[0].label; sel.add = variants.items[0].add || 0; }

  const priceEl = () => I18nState.formatPrice(p.price + sel.add);

  const variantBlock = () => {
    if (!variants) return "";
    const label = variants.kind === "shade" ? I18nState.t("pdp.shade") : I18nState.t("pdp.size");
    const opts = variants.items.map(v => {
      if (variants.kind === "shade") {
        return `<button class="swatch" data-variant="${v.label}" data-add="0" title="${v.label}"
          style="background:${v.hex}" aria-pressed="${v.label === sel.variant}" aria-label="${v.label}"></button>`;
      }
      return `<button class="px-4 py-2 border text-sm cursor-pointer transition-colors duration-200 ${v.label === sel.variant ? 'bg-[color:var(--ink)] text-[color:var(--cream)] border-[color:var(--ink)]' : 'border-[color:var(--line)] hover:border-[color:var(--ink)]'}"
        data-variant="${v.label}" data-add="${v.add}" aria-pressed="${v.label === sel.variant}">${v.label}</button>`;
    }).join("");
    return `<div class="mt-6">
      <div class="flex justify-between items-center mb-3">
        <span class="kicker">${label}</span>
        <span class="text-sm text-[color:var(--muted)]" data-variant-label>${sel.variant}</span>
      </div>
      <div class="flex flex-wrap gap-2.5" data-variants>${opts}</div>
    </div>`;
  };

  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  if (!related.length) related.push(...PRODUCTS.filter(x => x.id !== p.id).slice(0, 4));

  root.innerHTML = `
  <a href="shop.html" class="inline-block text-sm text-[color:var(--muted)] link-underline mb-8 cursor-pointer">← <span data-i18n="pdp.back"></span></a>
  <div class="grid lg:grid-cols-2 gap-10 lg:gap-16">
    <div class="reveal">
      <div class="aspect-[4/5] bg-[color:var(--stone)] overflow-hidden">
        ${imgWithFallback(p, "w-full h-full object-cover")}
      </div>
    </div>
    <div class="reveal reveal-delay-1 lg:py-4">
      <span class="kicker">${I18nState.t("cat." + p.category)}</span>
      <h1 class="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">${p.name}</h1>
      <div class="font-display text-2xl mt-4" data-price>${priceEl()}</div>
      <p class="mt-5 text-[15px] leading-relaxed text-[color:var(--ink-soft)] max-w-prose">${productDesc(p)}</p>
      ${variantBlock()}
      <div class="mt-7 flex items-center gap-4">
        <div class="inline-flex items-center border border-[color:var(--line)]">
          <button class="w-11 h-12 grid place-items-center hover:bg-[color:var(--stone)] cursor-pointer" data-qty-dec aria-label="Decrease">–</button>
          <input type="number" min="1" value="1" data-qty class="w-12 h-12 text-center bg-transparent" aria-label="${I18nState.t('pdp.qty')}">
          <button class="w-11 h-12 grid place-items-center hover:bg-[color:var(--stone)] cursor-pointer" data-qty-inc aria-label="Increase">+</button>
        </div>
        <button class="btn btn-primary flex-1" data-add-cart>${I18nState.t("pdp.add")}</button>
      </div>
      <button class="btn btn-outline w-full mt-3" data-buy-now>${I18nState.t("pdp.buy")}</button>

      <div class="mt-9 divide-y divide-[color:var(--line)] border-y border-[color:var(--line)]">
        <details class="group" open>
          <summary class="flex justify-between items-center py-4 cursor-pointer list-none">
            <span class="kicker">${I18nState.t("pdp.ingredients")}</span>
            <svg class="transition-transform group-open:rotate-45" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
          </summary>
          <p class="pb-4 text-sm text-[color:var(--muted)] leading-relaxed">${p.ingredients}</p>
        </details>
        <details class="group">
          <summary class="flex justify-between items-center py-4 cursor-pointer list-none">
            <span class="kicker">${I18nState.t("pdp.shipping")}</span>
            <svg class="transition-transform group-open:rotate-45" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
          </summary>
          <p class="pb-4 text-sm text-[color:var(--muted)] leading-relaxed">${I18nState.t("pdp.shippingText")}</p>
        </details>
      </div>
    </div>
  </div>

  <section class="mt-24">
    <h2 class="font-display text-3xl mb-8 reveal" data-i18n="pdp.related"></h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
      ${related.map((r, i) => `<div class="reveal reveal-delay-${(i % 4) + 1}">${productCardHTML(r)}</div>`).join("")}
    </div>
  </section>`;

  // Variant selection
  root.querySelectorAll("[data-variant]").forEach(btn => {
    btn.addEventListener("click", () => {
      sel.variant = btn.getAttribute("data-variant");
      sel.add = parseInt(btn.getAttribute("data-add"), 10) || 0;
      root.querySelectorAll("[data-variant]").forEach(b => b.setAttribute("aria-pressed", b === btn));
      root.querySelectorAll("[data-variant]:not(.swatch)").forEach(b => {
        const on = b.getAttribute("aria-pressed") === "true";
        b.className = `px-4 py-2 border text-sm cursor-pointer transition-colors duration-200 ${on ? 'bg-[color:var(--ink)] text-[color:var(--cream)] border-[color:var(--ink)]' : 'border-[color:var(--line)] hover:border-[color:var(--ink)]'}`;
      });
      const vl = root.querySelector("[data-variant-label]"); if (vl) vl.textContent = sel.variant;
      const pr = root.querySelector("[data-price]"); if (pr) pr.textContent = priceEl();
    });
  });

  // Quantity
  const qtyInput = root.querySelector("[data-qty]");
  root.querySelector("[data-qty-dec]")?.addEventListener("click", () => qtyInput.value = Math.max(1, (+qtyInput.value || 1) - 1));
  root.querySelector("[data-qty-inc]")?.addEventListener("click", () => qtyInput.value = (+qtyInput.value || 1) + 1);

  const addToCart = () => {
    Cart.add(p.id, {
      variant: sel.variant,
      unitPrice: p.price + sel.add,
      name: p.name,
      qty: Math.max(1, parseInt(qtyInput.value, 10) || 1)
    });
    showToast(I18nState.t("toast.added"));
  };
  root.querySelector("[data-add-cart]")?.addEventListener("click", () => { addToCart(); openCart(); });
  root.querySelector("[data-buy-now]")?.addEventListener("click", () => { addToCart(); window.startCheckout(); });

  document.addEventListener("langchange", () => initProduct());
}

/* ---- Boot -------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  mountShell();
  I18nState.apply();

  const page = document.body.getAttribute("data-page");
  if (page === "home") initHome();
  if (page === "shop") initShop();
  if (page === "product") initProduct();

  Cart.renderAll();
  initReveal();

  // Re-apply translations + re-render dynamic bits on language change
  document.addEventListener("langchange", () => {
    I18nState.apply();
    Cart.renderAll();
    if (page === "home") initHome();
    initReveal();
    const sel = document.querySelector("[data-lang]"); if (sel) sel.value = I18nState.lang;
  });

  // Keep cart UI in sync
  document.addEventListener("cartchange", () => Cart.renderAll());
});
