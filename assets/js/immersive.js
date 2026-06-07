/* =========================================================================
   ELIRA LIVING — Immersive homepage controller.
   Lenis smooth scroll + GSAP ScrollTrigger choreography, cart & i18n wiring.
   ========================================================================= */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

/* ---- Drawer / menu ----------------------------------------------------- */
function openCart() { document.querySelector("[data-cart-overlay]")?.classList.add("open"); document.querySelector("[data-drawer]")?.classList.add("open"); document.body.style.overflow = "hidden"; }
function closeCart() { document.querySelector("[data-cart-overlay]")?.classList.remove("open"); document.querySelector("[data-drawer]")?.classList.remove("open"); document.body.style.overflow = ""; }
function openMenu() { document.querySelector("[data-menu-overlay]")?.classList.add("open"); const m = document.querySelector("[data-mobile-menu]"); if (m) m.style.transform = "translateX(0)"; document.body.style.overflow = "hidden"; }
function closeMenu() { document.querySelector("[data-menu-overlay]")?.classList.remove("open"); const m = document.querySelector("[data-mobile-menu]"); if (m) m.style.transform = "translateX(-100%)"; document.body.style.overflow = ""; }

/* ---- Collection cards -------------------------------------------------- */
function collectionCard(p) {
  const fb = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='10'%3E%3Crect width='8' height='10' fill='%23232A1E'/%3E%3C/svg%3E";
  const badge = p.badge ? `<span class="tag absolute top-3 left-3 z-10">${p.badge === "new" ? "New" : "Bestseller"}</span>` : "";
  return `
  <article class="x-card group">
    <a href="product.html?id=${p.id}" class="block">
      <div class="media aspect-[4/5]">
        ${badge}
        <img src="${p.img || fb}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy" decoding="async" onerror="this.src='${fb}'">
        <button class="quick btn btn-primary w-full text-sm !py-2.5" data-quick-add="${p.id}">${I18nState.t("pdp.add")}</button>
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
function renderCollection() {
  const grid = document.querySelector("[data-collection]");
  if (grid) grid.innerHTML = PRODUCTS.map(collectionCard).join("");
}

/* ---- Simple reveal (decoupled from GSAP) ------------------------------ */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  els.forEach(e => io.observe(e));
}

/* ---- Shell wiring ------------------------------------------------------ */
function wireShell() {
  document.querySelector("[data-year]") && (document.querySelector("[data-year]").textContent = new Date().getFullYear());

  const sel = document.querySelector("[data-lang]");
  if (sel) { sel.value = I18nState.lang; sel.addEventListener("change", e => I18nState.setLang(e.target.value)); }

  document.querySelector("[data-cart-open]")?.addEventListener("click", openCart);
  document.querySelector("[data-cart-close]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-overlay]")?.addEventListener("click", closeCart);
  document.querySelector("[data-menu-open]")?.addEventListener("click", openMenu);
  document.querySelector("[data-menu-close]")?.addEventListener("click", closeMenu);
  document.querySelector("[data-menu-overlay]")?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeMenu(); } });

  document.addEventListener("click", e => {
    const qa = e.target.closest("[data-quick-add]");
    if (qa) { e.preventDefault(); e.stopPropagation(); Cart.add(qa.getAttribute("data-quick-add")); showToast(I18nState.t("toast.added")); openCart(); }
  });

  document.addEventListener("submit", e => {
    if (e.target.matches("[data-newsletter]")) { e.preventDefault(); e.target.innerHTML = `<p class="font-display text-2xl text-[color:var(--clay)]">${I18nState.t("news.thanks")}</p>`; }
  });

  // Header scrolled state (works with or without Lenis)
  const header = document.querySelector(".x-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---- GSAP choreography ------------------------------------------------- */
function initMotion() {
  if (REDUCED || !window.gsap) {
    // static fallback: make sure everything is visible
    document.querySelectorAll("[data-ingredient]").forEach(e => e.style.opacity = 1);
    document.querySelectorAll("[data-botanical]").forEach(e => e.style.opacity = .25);
    const c = document.querySelector("[data-count]"); if (c) c.textContent = c.dataset.count + c.dataset.suffix;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooth scroll
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Hero entrance
  gsap.from("[data-hero-text] > *", { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 });
  gsap.fromTo("[data-wordmark]", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.5 });

  // Hero parallax
  const heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to("[data-hero-bg]", { yPercent: 16, ease: "none", scrollTrigger: heroST });
  gsap.to("[data-hero-text]", { yPercent: -24, opacity: 0, ease: "none", scrollTrigger: heroST });
  gsap.to("[data-wordmark]", { yPercent: -50, ease: "none", scrollTrigger: heroST });

  // Floating botanicals: drift + parallax
  gsap.utils.toArray("[data-botanical]").forEach((el, i) => {
    gsap.to(el, { opacity: 0.5, duration: 1.2, delay: 0.4 + i * 0.2 });
    gsap.to(el, { y: "+=24", rotation: 10, duration: 5 + i, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(el, { yPercent: (i % 2 ? -1 : 1) * 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // ===== Pinned signature chapter =====
  const chapter = document.querySelector("[data-chapter]");
  if (chapter) {
    const heads = gsap.utils.toArray("[data-headline]");
    heads.forEach((h, i) => { h.classList.remove("hidden"); h.style.position = "absolute"; h.style.left = "0"; h.style.right = "0"; h.style.transition = "opacity .45s ease"; h.style.opacity = i === 0 ? "1" : "0"; });
    const setHead = (idx) => heads.forEach((h, i) => h.style.opacity = i === idx ? "1" : "0");

    const ings = gsap.utils.toArray("[data-ingredient]");
    gsap.set(ings, { opacity: 0, y: 26 });
    gsap.set("[data-chapter-glow]", { scale: 0.6, opacity: 0.15 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: chapter, start: "top top", end: "+=220%", pin: true, scrub: 0.6, anticipatePin: 1,
        onUpdate: (self) => setHead(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2)
      }
    });
    tl.to("[data-chapter-product]", { scale: 1.12, ease: "none", duration: 1 }, 0)
      .to("[data-chapter-glow]", { scale: 1.15, opacity: 1, ease: "none", duration: 1 }, 0)
      .to(ings[0], { opacity: 1, y: 0, duration: 0.22 }, 0.12)
      .to(ings[1], { opacity: 1, y: 0, duration: 0.22 }, 0.40)
      .to(ings[2], { opacity: 1, y: 0, duration: 0.22 }, 0.66);
  }

  // Collection cards stagger in
  ScrollTrigger.batch("[data-collection] .x-card", {
    start: "top 86%",
    onEnter: (els) => gsap.from(els, { y: 48, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, overwrite: true })
  });

  // Cert climax: count up + leaf draw
  const countEl = document.querySelector("[data-count]");
  if (countEl) {
    const obj = { v: 0 }, target = +countEl.dataset.count, suffix = countEl.dataset.suffix || "";
    gsap.to(obj, { v: target, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: countEl, start: "top 85%" }, onUpdate: () => countEl.textContent = Math.round(obj.v) + suffix });
  }
  document.querySelectorAll("[data-leaf] path").forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: "[data-cert]", start: "top 75%" } });
  });

  // Philosophy media parallax
  gsap.fromTo("[data-split] img", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: "[data-split]", start: "top bottom", end: "bottom top", scrub: true } });
}

/* ---- Boot -------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCollection();
  I18nState.apply();
  wireShell();
  Cart.renderAll();
  initReveal();
  initMotion();

  document.addEventListener("cartchange", () => Cart.renderAll());
  document.addEventListener("langchange", () => {
    I18nState.apply();
    renderCollection();
    Cart.renderAll();
    const sel = document.querySelector("[data-lang]"); if (sel) sel.value = I18nState.lang;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  // refresh triggers once fonts/images settle
  window.addEventListener("load", () => window.ScrollTrigger && ScrollTrigger.refresh());
});
