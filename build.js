/* =========================================================================
   ELIRA LIVING — Static site generator.
   Renders /en /de /nl static pages from the central catalog + language
   content files. Run:  node build.js
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const CAT = require("./assets/data/catalog.js");
const CONTENT = { en: require("./assets/content/en.js"), de: require("./assets/content/de.js"), nl: require("./assets/content/nl.js") };
const TRACK = require("./assets/data/analytics-config.js");
const { LEGAL, DISCLAIMER } = require("./assets/data/legal-content.js");

// Google Consent Mode v2 default (denied) + GTM loader — baked into every page.
function gtmHead() {
  const consent = `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});</script>`;
  if (!TRACK.GTM_ID) return consent + `\n  <!-- GTM not configured: set GTM_ID in assets/data/analytics-config.js and run: node build.js -->`;
  return consent + `\n  <!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${TRACK.GTM_ID}');</script><!-- End Google Tag Manager -->`;
}
function gtmBody() {
  if (!TRACK.GTM_ID) return "";
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${TRACK.GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

const BASE = CAT.CONFIG.baseUrl;
const OG = BASE + "/assets/img/og-image.jpg";
const OGLOC = { en: "en_GB", de: "de_DE", nl: "nl_NL" };
const LANGS = ["en", "de", "nl"];
const LOCALES = { de: "de-DE", nl: "nl-NL", en: "en-IE" };
const ASSET_V = Date.now().toString(36); // cache-buster: changes every build

const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escA = s => esc(s).replace(/"/g, "&quot;");
const t = (L, k) => { const v = CONTENT[L].ui[k]; return v == null ? k : v; };
const T = (L, k) => esc(t(L, k));
const pname = (L, id) => CONTENT[L].products[id].name;
const pdesc = (L, id) => CONTENT[L].products[id].desc;
const ping = (L, id) => CONTENT[L].products[id].ingredients;
const feat = (L, key) => CONTENT[L].features[key];
const fmt = (L, cents) => new Intl.NumberFormat(LOCALES[L], { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
const meta = L => CONTENT[L].meta;

function url(page, L, p) {
  const P = "/" + L;
  switch (page) {
    case "home": return P + "/";
    case "shop": return P + "/shop.html";
    case "about": return P + "/about.html";
    case "cart": return P + "/cart.html";
    case "success": return P + "/success.html";
    case "cancel": return P + "/cancel.html";
    case "impressum": return P + "/impressum.html";
    case "privacy": return P + "/privacy.html";
    case "terms": return P + "/terms.html";
    case "withdrawal": return P + "/withdrawal.html";
    case "product": return P + "/products/" + p.id + ".html";
  }
}
function hreflangs(page, p) {
  return LANGS.map(L => `<link rel="alternate" hreflang="${L}" href="${BASE + url(page, L, p)}">`).join("\n  ") +
    `\n  <link rel="alternate" hreflang="x-default" href="${BASE + url(page, "en", p)}">`;
}

function head(L, o) {
  const canonical = BASE + url(o.page, L, o.p);
  const img = o.image || OG;
  const altLoc = LANGS.filter(x => x !== L).map(x => `<meta property="og:locale:alternate" content="${OGLOC[x]}">`).join("\n  ");
  const ld = (o.ld || []).map(j => `<script type="application/ld+json">${j}</script>`).join("\n  ");
  return `<!DOCTYPE html>
<html lang="${L}">
<head>
  ${gtmHead()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escA(o.title)}</title>
  <meta name="description" content="${escA(o.description)}">
  ${o.keywords ? `<meta name="keywords" content="${escA(o.keywords)}">` : ""}
  <meta name="robots" content="${o.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
  <link rel="canonical" href="${canonical}">
  ${hreflangs(o.page, o.p)}
  <meta property="og:site_name" content="Elira Living">
  <meta property="og:type" content="${o.ogType || "website"}">
  <meta property="og:title" content="${escA(o.title)}">
  <meta property="og:description" content="${escA(o.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${img}">
  <meta property="og:locale" content="${OGLOC[L]}">
  ${altLoc}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escA(o.title)}">
  <meta name="twitter:description" content="${escA(o.description)}">
  <meta name="twitter:image" content="${img}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..700&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/app.css?v=${ASSET_V}">
  ${o.home ? `<link rel="stylesheet" href="/assets/css/home.css?v=${ASSET_V}">` : ""}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230F120D'/%3E%3Ctext x='50' y='70' font-family='Georgia,serif' font-size='62' fill='%23C8A24E' text-anchor='middle'%3EE%3C/text%3E%3C/svg%3E">
  ${ld}
</head>`;
}

function header(L, current) {
  const P = "/" + L, cur = pg => current === pg ? 'aria-current="page"' : "";
  return `<header class="site-header"><div class="container nav">
  <div style="display:flex;align-items:center;gap:1.5rem">
    <button class="icon-btn menu-btn" data-menu-open aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    <a href="${P}/" class="brand">Elira Living</a>
  </div>
  <nav class="nav-links">
    <a href="${P}/shop.html" class="nav-link" ${cur("shop")}>${T(L, "nav.shop")}</a>
    <a href="${P}/shop.html?category=skincare" class="nav-link">${T(L, "nav.skincare")}</a>
    <a href="${P}/shop.html?category=haircare" class="nav-link">${T(L, "nav.haircare")}</a>
    <a href="${P}/about.html" class="nav-link" ${cur("about")}>${T(L, "nav.about")}</a>
  </nav>
  <div class="nav-actions">
    <select class="lang-select" data-lang aria-label="Language"><option value="de">DE</option><option value="nl">NL</option><option value="en">EN</option></select>
    <button class="icon-btn" data-cart-open aria-label="${escA(t(L, "nav.cart"))}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span class="cart-badge" data-cart-count style="display:none">0</span></button>
  </div>
</div></header>`;
}

function footer(L) {
  const P = "/" + L;
  const li = (href, label) => `<li><a class="link-underline" href="${href}">${label}</a></li>`;
  return `<footer class="site-footer footer"><div class="container" style="padding-top:4rem;padding-bottom:5rem">
  <div class="foot-grid" style="display:grid;gap:2.5rem">
    <div style="max-width:20rem"><div class="font-display" style="font-size:1.9rem;margin-bottom:.75rem">Elira Living</div><p class="muted" style="font-size:.875rem;line-height:1.6">${T(L, "foot.tag")}</p></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.shop")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/shop.html?category=skincare", T(L, "nav.skincare"))}${li(P + "/shop.html?category=haircare", T(L, "nav.haircare"))}${li(P + "/shop.html", T(L, "nav.shop"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.help")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/withdrawal.html", T(L, "foot.shipping"))}${li(P + "/terms.html", T(L, "foot.faq"))}${li("mailto:support@eliraliving.com", T(L, "foot.contact"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.company")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/about.html", T(L, "foot.about"))}${li(P + "/privacy.html", T(L, "foot.privacy"))}${li(P + "/impressum.html", T(L, "foot.imprint"))}</ul></div>
  </div>
  <div style="margin-top:3.5rem;padding-top:1.5rem;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;align-items:center;font-size:.75rem" class="muted">
    <div>© <span data-year></span> Elira Living · ${T(L, "foot.rights")}</div>
    <div style="display:flex;flex-wrap:wrap;gap:1.25rem">
      <a class="link-underline" href="${P}/privacy.html">${T(L, "foot.privacy")}</a>
      <a class="link-underline" href="${P}/terms.html">${T(L, "foot.terms")}</a>
      <a class="link-underline" href="${P}/withdrawal.html">${T(L, "foot.withdrawal")}</a>
      <a class="link-underline" href="${P}/impressum.html">${T(L, "foot.imprint")}</a>
      <a class="link-underline" href="#" data-consent-open>Cookies</a>
    </div>
    <div style="display:flex;gap:.5rem;opacity:.8"><span>Stripe</span><span>·</span><span>iDEAL</span><span>·</span><span>Klarna</span></div>
  </div>
</div></footer>`;
}

function drawerMenu(L) {
  const P = "/" + L;
  return `<div class="cart-overlay" data-cart-overlay></div>
<aside class="drawer" data-drawer aria-label="${escA(t(L, "cart.title"))}">
  <div class="drawer-head"><h2 class="font-display" style="font-size:1.25rem">${T(L, "cart.title")}</h2>
    <button class="icon-btn" data-cart-close aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <div class="drawer-body" data-drawer-body></div>
  <div class="drawer-foot" data-drawer-foot></div>
</aside>
<div class="menu-overlay" data-menu-overlay></div>
<div class="mobile-menu" data-mobile-menu>
  <div style="display:flex;justify-content:space-between;align-items:center"><span class="font-display" style="font-size:1.5rem">Elira Living</span>
    <button class="icon-btn" data-menu-close aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <nav><a href="${P}/shop.html">${T(L, "nav.shop")}</a><a href="${P}/shop.html?category=skincare">${T(L, "nav.skincare")}</a><a href="${P}/shop.html?category=haircare">${T(L, "nav.haircare")}</a><a href="${P}/about.html">${T(L, "nav.about")}</a></nav>
  <div class="muted" style="margin-top:auto;font-size:.875rem">${T(L, "foot.tag")}</div>
</div>`;
}

function scripts(L, o) {
  const libs = (o && o.home) ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
` : "";
  const v = "?v=" + ASSET_V;
  return `<script>window.LANG=${JSON.stringify(L)};</script>
<script src="/assets/data/catalog.js${v}"></script>
<script src="/assets/content/${L}.js${v}"></script>
<script src="/assets/data/analytics-config.js${v}"></script>
<script src="/assets/js/analytics.js${v}"></script>
<script src="/assets/js/consent-banner.js${v}"></script>
${libs}<script src="/assets/js/app.js${v}"></script>`;
}

function shell(L, o, bodyHtml) {
  const inline = o.inlineData ? `<script>${o.inlineData}</script>\n` : "";
  return head(L, o) + `\n<body data-page="${o.bodyPage}">\n` + gtmBody() + "\n" + header(L, o.current) + "\n" + bodyHtml + "\n" + footer(L) + "\n" + drawerMenu(L) + "\n" + inline + scripts(L, o) + "\n</body>\n</html>\n";
}

function card(L, p) {
  const badge = p.badge ? `<span class="tag" style="position:absolute;top:12px;left:12px;z-index:3">${p.badge === "new" ? "New" : "Bestseller"}</span>` : "";
  return `<article class="card" data-cat="${p.category}" data-price="${p.price}" data-name="${escA(pname(L, p.id))}">
  <a href="${url("product", L, p)}" style="display:block">
    <div class="media">${badge}<img src="${p.image}" alt="${escA(pname(L, p.id))}" loading="lazy" decoding="async">
      <button class="btn btn-primary quick" data-quick-add="${p.id}">${T(L, "pdp.add")}</button></div></a>
  <div class="meta"><div><a href="${url("product", L, p)}" class="name link-underline">${esc(pname(L, p.id))}</a><div class="desc">${esc(pdesc(L, p.id))}</div></div>
    <div class="price">${fmt(L, p.price)}</div></div>
</article>`;
}

/* ---- JSON-LD ----------------------------------------------------------- */
function ldOrg() {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Elira Living", url: BASE + "/", logo: OG, email: "support@eliraliving.com", founder: { "@type": "Person", name: "Zeerak Ata" }, address: { "@type": "PostalAddress", streetAddress: "Lapinrinne 1b", postalCode: "00180", addressLocality: "Helsinki", addressCountry: "FI" }, areaServed: ["DE", "NL"] });
}
function ldWebsite(L) { return JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Elira Living", url: BASE + "/", inLanguage: L }); }
function ldProduct(L, p) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: pname(L, p.id), sku: p.sku, image: [BASE + p.image], description: pdesc(L, p.id), brand: { "@type": "Brand", name: "Elira Living" }, category: t(L, "cat." + p.category), offers: { "@type": "Offer", url: BASE + url("product", L, p), priceCurrency: "EUR", price: (p.price / 100).toFixed(2), availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: "Elira Living" } } });
}
function ldBreadcrumb(L, p) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE + url("home", L) },
    { "@type": "ListItem", position: 2, name: t(L, "cat." + p.category), item: BASE + url("shop", L) + "?category=" + p.category },
    { "@type": "ListItem", position: 3, name: pname(L, p.id), item: BASE + url("product", L, p) }
  ] });
}

/* ---- PAGE: HOME -------------------------------------------------------- */
function renderHome(L) {
  const P = "/" + L;
  const m = meta(L).home;
  const cards = CAT.PRODUCTS.map(p => card(L, p)).join("\n");
  const body = `<main>
  <section class="hero">
    <div class="hero__bg" data-hero-bg><img src="/assets/img/shampoo.jpg" alt="${escA(t(L, "hero.lead"))}"></div>
    <div class="hero__veil"></div>
    <svg class="botanical" data-botanical style="top:18%;left:8%;width:70px" viewBox="0 0 64 64" fill="currentColor"><path d="M32 4C20 18 12 30 12 42a20 20 0 0 0 40 0c0-12-8-24-20-38Z" opacity=".5"/></svg>
    <svg class="botanical" data-botanical style="top:62%;left:14%;width:48px" viewBox="0 0 64 64" fill="currentColor"><path d="M32 4C20 18 12 30 12 42a20 20 0 0 0 40 0c0-12-8-24-20-38Z" opacity=".4"/></svg>
    <svg class="botanical" data-botanical style="top:26%;right:10%;width:56px" viewBox="0 0 64 64" fill="currentColor"><path d="M32 4C20 18 12 30 12 42a20 20 0 0 0 40 0c0-12-8-24-20-38Z" opacity=".45"/></svg>
    <div class="hero__content container">
      <div style="max-width:36rem" data-hero-text>
        <div class="kicker" style="margin-bottom:1.25rem">${T(L, "hero.kicker")}</div>
        <h1 class="hero__title"><span style="display:block">${T(L, "hero.title1")}</span><span class="accent" style="display:block">${T(L, "hero.title2")}</span></h1>
        <p class="muted" style="margin-top:1.5rem;font-size:1.125rem;line-height:1.7;max-width:30rem;color:var(--ink-soft)">${T(L, "hero.lead")}</p>
        <div style="margin-top:2.25rem;display:flex;flex-wrap:wrap;gap:.75rem">
          <a href="${P}/shop.html" class="btn btn-primary">${T(L, "hero.cta")}</a>
          <a href="${P}/about.html" class="btn btn-outline">${T(L, "hero.cta2")}</a>
        </div>
      </div>
      <div class="hero__badge">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" stroke-width="1.3"><path d="M12 2C7 6 5 9 5 13a7 7 0 0 0 14 0c0-4-2-7-7-11Z"/><path d="M12 9v8"/></svg>
        <div><div class="font-display" style="font-size:1.25rem;line-height:1">${T(L, "hero.badge1")}</div><div class="muted" style="font-size:.75rem;margin-top:.25rem">${T(L, "hero.badge2")}</div></div>
      </div>
    </div>
    <div class="wordmark-wrap"><div class="wordmark" data-wordmark>ELIRA LIVING</div></div>
    <div class="scroll-cue"><span></span></div>
  </section>

  <section class="cert-strip"><div class="marquee" style="padding:1rem 0"><div class="marquee__track font-display" style="font-size:1.75rem;color:var(--ink-soft)">
    ${[["marq.vegan"], ["marq.cosmos"], ["marq.made"], ["marq.derm"], ["marq.cruelty"], ["marq.vegan"], ["marq.cosmos"], ["marq.made"]].map(k => `<span style="margin:0 2.5rem">${T(L, k[0])}</span><span style="margin:0 .5rem;color:var(--gold)">✦</span>`).join("")}
  </div></div></section>

  <section class="chapter" data-chapter>
    <div class="chapter__stage"><div class="chapter__glow" data-chapter-glow></div>
      <div class="chapter__product" data-chapter-product><img src="/assets/img/toner.jpg" alt="${escA(pname(L, "purifying-toner"))}"></div></div>
    <div class="chapter__headlines" data-chapter-headlines>
      <div class="kicker" style="margin-bottom:.75rem">${T(L, "chapter.kicker")}</div>
      <h2 class="font-display" style="font-size:clamp(2rem,5vw,3.5rem);line-height:1.05"><span data-headline="0">${T(L, "chapter.head1")}</span><span data-headline="1" style="opacity:0">${T(L, "chapter.head2")}</span><span data-headline="2" style="opacity:0">${T(L, "chapter.head3")}</span></h2>
    </div>
    <div class="ingredient" data-ingredient style="top:24%;left:8%"><div class="ln"></div><h4 class="font-display">${T(L, "ing.1.t")}</h4><p>${T(L, "ing.1.d")}</p></div>
    <div class="ingredient" data-ingredient style="top:54%;right:9%;text-align:right"><div class="ln" style="margin-left:auto"></div><h4 class="font-display">${T(L, "ing.2.t")}</h4><p>${T(L, "ing.2.d")}</p></div>
    <div class="ingredient" data-ingredient style="bottom:16%;left:12%"><div class="ln"></div><h4 class="font-display">${T(L, "ing.3.t")}</h4><p>${T(L, "ing.3.d")}</p></div>
    <div style="position:absolute;bottom:7%;left:50%;transform:translateX(-50%);z-index:3"><a href="${url("product", L, { id: "purifying-toner" })}" class="btn btn-primary">${T(L, "chapter.cta")}</a></div>
  </section>

  <section class="container" style="padding:6rem 1.25rem">
    <div style="text-align:center;max-width:36rem;margin:0 auto 3.5rem">
      <div class="kicker reveal" style="margin-bottom:.75rem">${T(L, "best.kicker")}</div>
      <h2 class="font-display reveal" style="font-size:clamp(2.2rem,5vw,3.5rem)">${T(L, "best.title")}</h2>
      <p class="muted reveal" style="margin-top:1rem">${T(L, "best.lead")}</p>
    </div>
    <div class="grid-products">${cards}</div>
    <div style="text-align:center;margin-top:3.5rem" class="reveal"><a href="${P}/shop.html" class="btn btn-outline">${T(L, "best.viewall")}</a></div>
  </section>

  <section data-cert style="padding:7rem 1.25rem;text-align:center">
    <div class="container" style="max-width:56rem">
      <svg class="leaf-draw" data-leaf width="64" height="64" viewBox="0 0 64 64" style="margin:0 auto 2rem"><path d="M32 6C20 20 12 32 12 44a20 20 0 0 0 40 0C52 32 44 20 32 6Z"/><path d="M32 12v40"/></svg>
      <div class="kicker reveal" style="margin-bottom:1rem">${T(L, "cert.kicker")}</div>
      <div class="font-display count" data-count="99" data-suffix="%" style="font-size:clamp(3.5rem,12vw,9rem);line-height:1">0%</div>
      <h2 class="font-display reveal" style="font-size:clamp(1.8rem,4vw,3rem);margin-top:1rem">${T(L, "cert.title")}</h2>
      <p class="reveal" style="margin-top:1.25rem;color:var(--ink-soft);max-width:32rem;margin-left:auto;margin-right:auto">${T(L, "cert.lead")}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;max-width:36rem;margin:4rem auto 0;padding-top:2.5rem;border-top:1px solid var(--line)">
        <div class="reveal"><div class="font-display" style="font-size:clamp(2rem,4vw,3rem)">100%</div><div class="muted" style="font-size:.72rem;letter-spacing:.05em;margin-top:.5rem">${T(L, "about.stat2")}</div></div>
        <div class="reveal reveal-d1"><div class="font-display" style="font-size:clamp(2rem,4vw,3rem)">0</div><div class="muted" style="font-size:.72rem;letter-spacing:.05em;margin-top:.5rem">${T(L, "about.stat3")}</div></div>
        <div class="reveal reveal-d2"><div class="font-display" style="font-size:clamp(2rem,4vw,3rem)">EU</div><div class="muted" style="font-size:.72rem;letter-spacing:.05em;margin-top:.5rem">${T(L, "marq.made")}</div></div>
      </div>
    </div>
  </section>

  <section class="split">
    <div class="split-media" data-split><img src="/assets/img/cream.jpg" alt="${escA(t(L, "about.kicker"))}"></div>
    <div style="display:flex;align-items:center;background:var(--bg2);padding:5rem 1.5rem">
      <div style="max-width:28rem">
        <div class="kicker reveal" style="margin-bottom:.75rem">${T(L, "story.kicker")}</div>
        <h2 class="font-display reveal" style="font-size:clamp(2rem,4vw,3rem);line-height:1.05">${T(L, "story.title")}</h2>
        <p class="reveal" style="margin-top:1.5rem;font-size:1.05rem;line-height:1.7;color:var(--ink-soft)">${T(L, "story.body")}</p>
        <ul style="list-style:none;padding:0;margin:2rem 0 0;display:flex;flex-direction:column;gap:.75rem;font-size:.95rem">
          <li class="reveal" style="display:flex;gap:.75rem"><span style="color:var(--gold)">—</span><span>${T(L, "story.p1")}</span></li>
          <li class="reveal reveal-d1" style="display:flex;gap:.75rem"><span style="color:var(--gold)">—</span><span>${T(L, "story.p2")}</span></li>
          <li class="reveal reveal-d2" style="display:flex;gap:.75rem"><span style="color:var(--gold)">—</span><span>${T(L, "story.p3")}</span></li>
        </ul>
        <a href="${P}/about.html" class="btn btn-outline reveal" style="margin-top:2.25rem">${T(L, "story.cta")}</a>
      </div>
    </div>
  </section>

  <section class="container" style="padding:6rem 1.25rem">
    <div style="border:1px solid var(--line);background:var(--surface);padding:4rem 1.5rem;text-align:center" class="reveal">
      <div class="kicker" style="margin-bottom:.75rem">${T(L, "news.kicker")}</div>
      <h2 class="font-display" style="font-size:clamp(2rem,4vw,3rem);max-width:36rem;margin:0 auto">${T(L, "news.title")}</h2>
      <p class="muted" style="margin-top:1rem;max-width:28rem;margin-left:auto;margin-right:auto">${T(L, "news.lead")}</p>
      <form data-newsletter style="margin-top:2rem;max-width:28rem;margin-left:auto;margin-right:auto;display:flex;flex-wrap:wrap;gap:.75rem">
        <label class="sr-only" for="nl">${T(L, "news.placeholder")}</label>
        <input id="nl" type="email" required placeholder="${escA(t(L, "news.placeholder"))}" style="flex:1;min-width:12rem">
        <button class="btn btn-primary" type="submit">${T(L, "news.btn")}</button>
      </form>
      <p class="muted" style="font-size:.75rem;margin-top:1rem">${T(L, "news.consent")}</p>
    </div>
  </section>
</main>`;
  return shell(L, { page: "home", bodyPage: "home", current: "home", home: true, title: m.title, description: m.description, keywords: m.keywords, ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: SHOP -------------------------------------------------------- */
function renderShop(L) {
  const m = meta(L).shop;
  const cards = CAT.PRODUCTS.map(p => card(L, p)).join("\n");
  const opt = (v, k) => `<option value="${v}">${escA(t(L, k))}</option>`;
  const body = `<main class="page-main"><div class="container" style="padding-bottom:6rem">
  <div style="max-width:40rem" class="reveal in">
    <div class="kicker" style="margin-bottom:.5rem">${T(L, "cat.kicker")}</div>
    <h1 class="font-display" style="font-size:clamp(2.6rem,6vw,4rem)">${T(L, "shop.title")}</h1>
    <p class="muted" style="margin-top:1rem">${T(L, "shop.lead")}</p>
  </div>
  <div style="margin-top:2.5rem;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:center">
    <div style="display:flex;flex-wrap:wrap;gap:.5rem">
      <button class="chip" data-filter-cat="all">${T(L, "shop.all")}</button>
      <button class="chip" data-filter-cat="skincare">${T(L, "cat.skincare")}</button>
      <button class="chip" data-filter-cat="haircare">${T(L, "cat.haircare")}</button>
    </div>
    <div style="display:flex;align-items:center;gap:1rem">
      <span class="muted" style="font-size:.875rem" data-shop-count></span>
      <select class="sort-select" data-sort>${opt("featured", "shop.sort.featured")}${opt("priceAsc", "shop.sort.priceAsc")}${opt("priceDesc", "shop.sort.priceDesc")}${opt("name", "shop.sort.name")}</select>
    </div>
  </div>
  <div class="grid-products" data-shop-grid style="margin-top:3rem">${cards}</div>
</div></main>`;
  return shell(L, { page: "shop", bodyPage: "shop", current: "shop", title: m.title, description: m.description, keywords: m.keywords, ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: PRODUCT ----------------------------------------------------- */
function renderProduct(L, p) {
  const m = meta(L);
  const title = pname(L, p.id) + " – " + t(L, "cat." + p.category) + " | Elira Living";
  const description = pdesc(L, p.id) + " " + m.productShippingNote;
  const related = CAT.PRODUCTS.filter(x => x.id !== p.id).slice(0, 4);
  const features = (CAT.getProduct(p.id).featureKeys || []).map(k => `<span class="tag">${esc(feat(L, k))}</span>`).join("");
  const body = `<main class="page-main" data-product="${p.id}"><div class="container" style="padding-bottom:6rem">
  <a href="${url("shop", L)}" class="link-underline muted" style="display:inline-block;font-size:.875rem;margin-bottom:2rem">← ${T(L, "pdp.back")}</a>
  <div class="pdp-grid">
    <div class="reveal in"><div style="aspect-ratio:4/5;background:var(--stone);overflow:hidden;border:1px solid var(--line)"><img src="${p.image}" alt="${escA(pname(L, p.id))}" style="width:100%;height:100%;object-fit:cover"></div></div>
    <div class="reveal in">
      <div class="kicker">${T(L, "cat." + p.category)}</div>
      <h1 class="font-display" style="font-size:clamp(2.2rem,5vw,3.2rem);margin-top:.75rem;line-height:1.05">${esc(pname(L, p.id))}</h1>
      <div class="font-display" style="font-size:1.5rem;margin-top:1rem">${fmt(L, p.price)}</div>
      <p style="margin-top:1.25rem;line-height:1.7;color:var(--ink-soft);max-width:34rem">${esc(pdesc(L, p.id))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem">${features}</div>
      <div style="margin-top:1.5rem"><span class="kicker">${T(L, "pdp.size")}</span><div style="margin-top:.75rem"><button class="swatch-size" aria-pressed="true">${esc(p.size)}</button></div></div>
      <div style="margin-top:1.75rem;display:flex;align-items:center;gap:1rem">
        <div class="qty"><button data-dec aria-label="-">–</button><input data-qin type="number" min="1" value="1" aria-label="${escA(t(L, "pdp.qty"))}"><button data-inc aria-label="+">+</button></div>
        <button class="btn btn-primary" style="flex:1" data-add>${T(L, "pdp.add")}</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:.75rem" data-buy>${T(L, "pdp.buy")}</button>
      <div style="margin-top:2.25rem">
        <details class="acc" open><summary><span class="kicker">${T(L, "pdp.ingredients")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(ping(L, p.id))}</p></details>
        <details class="acc"><summary><span class="kicker">${T(L, "pdp.shipping")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${T(L, "pdp.shippingText")}</p></details>
      </div>
    </div>
  </div>
  <section style="margin-top:6rem">
    <h2 class="font-display reveal" style="font-size:clamp(1.8rem,4vw,2.5rem);margin-bottom:2rem">${T(L, "pdp.related")}</h2>
    <div class="grid-products">${related.map(r => card(L, r)).join("\n")}</div>
  </section>
</div></main>`;
  return shell(L, { page: "product", p, bodyPage: "product", title, description, ogType: "product", image: BASE + p.image, inlineData: `window.ELIRA_PAGE={type:"product",id:${JSON.stringify(p.id)}};`, keywords: [pname(L, p.id), t(L, "cat." + p.category), "Elira Living", "vegan", "COSMOS", "ECOCERT"].join(", "), ld: [ldOrg(), ldProduct(L, p), ldBreadcrumb(L, p)] }, body);
}

/* ---- PAGE: ABOUT ------------------------------------------------------- */
function renderAbout(L) {
  const m = meta(L).about; const P = "/" + L;
  const body = `<main class="page-main">
  <section class="container" style="text-align:center;padding-bottom:4rem">
    <div class="kicker reveal in" style="margin-bottom:1rem">${T(L, "about.kicker")}</div>
    <h1 class="font-display reveal in" style="font-size:clamp(2.6rem,7vw,5rem);line-height:1;max-width:60rem;margin:0 auto">${T(L, "about.title")}</h1>
    <p class="muted reveal in" style="margin-top:1.5rem;font-size:1.125rem;max-width:36rem;margin-left:auto;margin-right:auto">${T(L, "about.lead")}</p>
  </section>
  <section style="max-width:72rem;margin:0 auto;padding:0 1.25rem">
    <div style="aspect-ratio:16/8;overflow:hidden;border:1px solid var(--line)" class="reveal"><img src="/assets/img/cream.jpg" alt="${escA(t(L, "about.kicker"))}" style="width:100%;height:100%;object-fit:cover"></div>
  </section>
  <section style="max-width:46rem;margin:0 auto;padding:5rem 1.25rem">
    <p class="font-display reveal" style="font-size:clamp(1.4rem,3vw,2rem);line-height:1.4">${T(L, "about.body1")}</p>
    <p class="reveal reveal-d1" style="margin-top:2rem;font-size:1.05rem;line-height:1.7;color:var(--ink-soft)">${T(L, "about.body2")}</p>
  </section>
  <section style="background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
    <div class="container" style="padding:5rem 1.25rem;display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;text-align:center">
      <div class="reveal"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">≤99%</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat1")}</div></div>
      <div class="reveal reveal-d1"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">100%</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat2")}</div></div>
      <div class="reveal reveal-d2"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">0</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat3")}</div></div>
    </div>
  </section>
  <section class="container" style="padding:6rem 1.25rem;text-align:center">
    <h2 class="font-display reveal" style="font-size:clamp(2rem,5vw,3rem);margin-bottom:2rem">${T(L, "story.title")}</h2>
    <a href="${P}/shop.html" class="btn btn-primary reveal reveal-d1">${T(L, "about.cta")}</a>
  </section>
</main>`;
  return shell(L, { page: "about", bodyPage: "about", current: "about", title: m.title, description: m.description, keywords: m.keywords, ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: CART / SUCCESS / CANCEL ------------------------------------ */
function renderCart(L) {
  const body = `<main class="page-main"><div class="container" style="padding-bottom:6rem">
  <h1 class="font-display" style="font-size:clamp(2.6rem,6vw,4rem);margin-bottom:2.5rem">${T(L, "cart.title")}</h1>
  <div data-cart-page></div>
</div></main>`;
  return shell(L, { page: "cart", bodyPage: "cart", title: meta(L).cart.title, description: t(L, "cart.title"), noindex: true }, body);
}
function renderSimple(L, page, titleKey, leadKey, ctaKey, ctaHref, icon) {
  const body = `<main class="page-main" style="min-height:60vh;display:grid;place-items:center"><div class="container" style="text-align:center;max-width:32rem;padding:4rem 1.25rem">
  ${icon || ""}
  <h1 class="font-display" style="font-size:clamp(2.2rem,5vw,3rem);margin-top:1.5rem">${T(L, titleKey)}</h1>
  <p class="muted" style="margin-top:1rem">${T(L, leadKey)}</p>
  <a href="${ctaHref}" class="btn btn-primary" style="margin-top:2rem">${T(L, ctaKey)}</a>
</div></main>`;
  return shell(L, { page, bodyPage: page, title: meta(L)[page].title, description: t(L, leadKey), noindex: true }, body);
}

/* ---- PAGE: LEGAL (localised content from assets/data/legal-content.js) - */
function legalPage(L, type) {
  const d = (LEGAL[L] && LEGAL[L][type]) || LEGAL.en[type];
  const inner = d.body.replace(/{{withdrawalUrl}}/g, url("withdrawal", L));
  const disclaimer = DISCLAIMER[L] || DISCLAIMER.en;
  const body = `<main class="page-main"><article class="container legal-prose" style="padding-bottom:6rem">
  <h1 class="font-display">${d.title}</h1>
  <p class="muted">${d.subtitle}</p>
  ${inner}
  <p class="legal-disclaimer">${disclaimer}</p>
</article></main>`;
  return shell(L, { page: type, bodyPage: "legal", title: meta(L)[type].title, description: d.title + " — Elira Living.", noindex: false, ld: [ldOrg()] }, body);
}
const renderImpressum = (L) => legalPage(L, "impressum");
const renderPrivacy = (L) => legalPage(L, "privacy");
const renderTerms = (L) => legalPage(L, "terms");
const renderWithdrawal = (L) => legalPage(L, "withdrawal");

/* ---- WRITE ------------------------------------------------------------- */
function write(rel, html) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, "utf8");
}
function clean(dir) { const d = path.join(ROOT, dir); if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true }); }

function build() {
  let count = 0;
  LANGS.forEach(L => {
    clean(L);
    write(`${L}/index.html`, renderHome(L)); count++;
    write(`${L}/shop.html`, renderShop(L)); count++;
    write(`${L}/about.html`, renderAbout(L)); count++;
    write(`${L}/cart.html`, renderCart(L)); count++;
    const okIcon = `<div style="width:4rem;height:4rem;margin:0 auto;border:1px solid var(--gold);border-radius:50%;display:grid;place-items:center"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M5 13l4 4L19 7"/></svg></div>`;
    write(`${L}/success.html`, renderSimple(L, "success", "success.title", "success.lead", "success.cta", "/" + L + "/shop.html", okIcon)); count++;
    write(`${L}/cancel.html`, renderSimple(L, "cancel", "cancel.title", "cancel.lead", "cancel.cta", "/" + L + "/cart.html", "")); count++;
    write(`${L}/impressum.html`, renderImpressum(L)); count++;
    write(`${L}/privacy.html`, renderPrivacy(L)); count++;
    write(`${L}/terms.html`, renderTerms(L)); count++;
    write(`${L}/withdrawal.html`, renderWithdrawal(L)); count++;
    CAT.PRODUCTS.forEach(p => { write(`${L}/products/${p.id}.html`, renderProduct(L, p)); count++; });
  });
  writeRoot();
  writeSitemap();
  console.log("Built " + count + " localized pages across " + LANGS.join(", ") + " + root redirect + sitemap.");
}

function writeRoot() {
  const links = LANGS.map(L => `<a href="/${L}/">${L.toUpperCase()}</a>`).join(" · ");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Elira Living — Natural Vegan Skincare & Haircare</title>
<meta name="description" content="Vegan, ECOCERT COSMOS-certified natural skincare and haircare. Made in the EU. Shipping to Germany & the Netherlands.">
<link rel="canonical" href="${BASE}/en/">
${LANGS.map(L => `<link rel="alternate" hreflang="${L}" href="${BASE}/${L}/">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${BASE}/en/">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230F120D'/%3E%3Ctext x='50' y='70' font-family='Georgia,serif' font-size='62' fill='%23C8A24E' text-anchor='middle'%3EE%3C/text%3E%3C/svg%3E">
<style>html,body{height:100%;margin:0;background:#0F120D;color:#ECE7DB;font-family:system-ui,sans-serif;display:grid;place-items:center;text-align:center}a{color:#C8A24E}</style>
<script>
  var supported=["en","de","nl"];
  var l=(navigator.language||"en").slice(0,2).toLowerCase();
  if(supported.indexOf(l)<0)l="en";
  location.replace("/"+l+"/");
</script></head>
<body><div><h1 style="font-family:Georgia,serif">Elira Living</h1><p>Choose your language: ${links}</p></div></body></html>`;
  write("index.html", html);
}

function writeSitemap() {
  const pagesFor = L => {
    const list = [
      { page: "home", pr: "1.0", cf: "weekly" },
      { page: "shop", pr: "0.9", cf: "weekly" },
      { page: "about", pr: "0.6" },
      { page: "impressum", pr: "0.2" }, { page: "privacy", pr: "0.2" }, { page: "terms", pr: "0.2" }, { page: "withdrawal", pr: "0.2" }
    ];
    CAT.PRODUCTS.forEach(p => list.push({ page: "product", p, pr: "0.8" }));
    return list;
  };
  let urls = "";
  LANGS.forEach(L => pagesFor(L).forEach(it => {
    const loc = BASE + url(it.page, L, it.p);
    const alts = LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${BASE + url(it.page, x, it.p)}"/>`).join("\n") +
      `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE + url(it.page, "en", it.p)}"/>`;
    urls += `  <url>\n    <loc>${loc}</loc>\n${alts}\n${it.cf ? `    <changefreq>${it.cf}</changefreq>\n` : ""}    <priority>${it.pr}</priority>\n  </url>\n`;
  }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}</urlset>\n`;
  write("sitemap.xml", xml);
}

build();
