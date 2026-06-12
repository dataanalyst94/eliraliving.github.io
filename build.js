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
const { USAGE, PRODUCT_FAQ, INGREDIENTS, INGREDIENTS_PAGE } = require("./assets/data/faq-content.js");
const { BLOG_UI, POSTS } = require("./assets/data/blog-content.js");
const { REVIEWS, REVIEW_UI } = require("./assets/data/reviews-content.js");
const FAQ_H = { en: "Frequently asked questions", de: "Häufige Fragen", nl: "Veelgestelde vragen" };
const USE_H = { en: "How to use", de: "Anwendung", nl: "Gebruik" };
const FREESHIP_H = { en: "Free shipping on this item", de: "Kostenloser Versand für diesen Artikel", nl: "Gratis verzending voor dit artikel" };

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
const LOGO = BASE + "/assets/img/brand/logo-512.png"; // clean brand logo for schema.org
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..700&family=Jost:wght@300;400;500;600&display=swap";

// <picture> with responsive WebP + JPEG fallback. PNG/other sources pass through.
// Widths come from assets/data/responsive-manifest.json (tools/responsive-images.js)
// so phones download a 480/960px image instead of the full-size one.
// CSS `picture{display:contents}` keeps layout identical to a bare <img>.
const RESP = require("./assets/data/responsive-manifest.json");
const webpOf = src => src.replace(/\.jpe?g$/i, ".webp");
function pic(src, imgAttrs = "", sizes = "100vw") {
  if (!/\.jpe?g$/i.test(src)) return `<img src="${src}" ${imgAttrs}>`;
  const tiers = RESP[src];
  if (tiers && tiers.length) {
    const webpSet = tiers.map(t => `${t[1]} ${t[0]}w`).join(", ");
    const jpgSet = tiers.map(t => `${t[2]} ${t[0]}w`).join(", ");
    return `<picture><source type="image/webp" srcset="${webpSet}" sizes="${sizes}"><img src="${src}" srcset="${jpgSet}" sizes="${sizes}" ${imgAttrs}></picture>`;
  }
  return `<picture><source srcset="${webpOf(src)}" type="image/webp"><img src="${src}" ${imgAttrs}></picture>`;
}
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
    case "ingredients": return P + "/ingredients.html";
    case "blog": return P + "/blog/";
    case "post": return P + "/blog/" + p.slug + ".html";
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
  <link rel="preload" as="style" href="${FONT_CSS}">
  <link rel="stylesheet" href="${FONT_CSS}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${FONT_CSS}"></noscript>
  <link rel="stylesheet" href="/assets/css/app.css?v=${ASSET_V}">
  ${o.home ? `<link rel="stylesheet" href="/assets/css/home.css?v=${ASSET_V}">` : ""}
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/brand/favicon-32.png?v=${ASSET_V}">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/img/brand/favicon-16.png?v=${ASSET_V}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/brand/apple-touch-icon.png?v=${ASSET_V}">
  <meta name="theme-color" content="#0F120D">
  <link rel="manifest" href="/site.webmanifest">
  ${o.home ? `<link rel="preload" as="image" type="image/webp" imagesrcset="${RESP["/assets/img/shampoo.jpg"].map(t => `${t[1]} ${t[0]}w`).join(", ")}" imagesizes="100vw" fetchpriority="high">
  <style>.pre-anim [data-hero-text]>*,.pre-anim [data-wordmark]{opacity:0}</style>
  <script>if(matchMedia("(min-width:760px)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches){document.documentElement.className+=" pre-anim"}</script>` : ""}
  ${ld}
</head>`;
}

function header(L, current) {
  const P = "/" + L, cur = pg => current === pg ? 'aria-current="page"' : "";
  return `<header class="site-header"><div class="container nav">
  <div style="display:flex;align-items:center;gap:1.5rem">
    <button class="icon-btn menu-btn" data-menu-open aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    <a href="${P}/" class="brand" aria-label="Elira Living — home"><img src="/assets/img/brand/logo-white.png" alt="Elira Living" class="brand-logo" width="44" height="32" decoding="async"></a>
  </div>
  <nav class="nav-links">
    <a href="${P}/shop.html" class="nav-link" ${cur("shop")}>${T(L, "nav.shop")}</a>
    <a href="${P}/shop.html?category=skincare" class="nav-link">${T(L, "nav.skincare")}</a>
    <a href="${P}/shop.html?category=haircare" class="nav-link">${T(L, "nav.haircare")}</a>
    <a href="${P}/blog/" class="nav-link" ${cur("blog")}>${esc(BLOG_UI[L].nav)}</a>
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
    <div style="max-width:20rem"><img src="/assets/img/brand/logo-white.png" alt="Elira Living" class="footer-logo" width="69" height="50" loading="lazy" decoding="async" style="margin-bottom:1rem"><p class="muted" style="font-size:.875rem;line-height:1.6">${T(L, "foot.tag")}</p></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.shop")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/shop.html?category=skincare", T(L, "nav.skincare"))}${li(P + "/shop.html?category=haircare", T(L, "nav.haircare"))}${li(P + "/shop.html", T(L, "nav.shop"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.help")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/withdrawal.html", T(L, "foot.shipping"))}${li(P + "/terms.html", T(L, "foot.faq"))}${li("mailto:support@eliraliving.com", T(L, "foot.contact"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.company")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/about.html", T(L, "foot.about"))}${li(P + "/blog/", esc(BLOG_UI[L].nav))}${li(P + "/ingredients.html", esc(INGREDIENTS_PAGE[L].title))}${li(P + "/privacy.html", T(L, "foot.privacy"))}${li(P + "/impressum.html", T(L, "foot.imprint"))}</ul></div>
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
  <div style="display:flex;justify-content:space-between;align-items:center"><img src="/assets/img/brand/logo-white.png" alt="Elira Living" width="55" height="40" decoding="async">
    <button class="icon-btn" data-menu-close aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <nav><a href="${P}/shop.html">${T(L, "nav.shop")}</a><a href="${P}/shop.html?category=skincare">${T(L, "nav.skincare")}</a><a href="${P}/shop.html?category=haircare">${T(L, "nav.haircare")}</a><a href="${P}/blog/">${esc(BLOG_UI[L].nav)}</a><a href="${P}/about.html">${T(L, "nav.about")}</a></nav>
  <div class="muted" style="margin-top:auto;font-size:.875rem">${T(L, "foot.tag")}</div>
</div>`;
}

function scripts(L, o) {
  const v = "?v=" + ASSET_V;
  // All scripts deferred — never block parsing/first paint. The heavy animation
  // libs (GSAP/ScrollTrigger/Lenis) are NOT loaded here; app.js fetches them at
  // runtime on desktop only (self-hosted, same-origin), so phones skip ~128KB.
  return `<script>window.LANG=${JSON.stringify(L)};window.ELIRA_V=${JSON.stringify(ASSET_V)};</script>
<script defer src="/assets/data/catalog.js${v}"></script>
<script defer src="/assets/content/${L}.js${v}"></script>
<script defer src="/assets/data/analytics-config.js${v}"></script>
<script defer src="/assets/js/analytics.js${v}"></script>
<script defer src="/assets/js/consent-banner.js${v}"></script>
<script defer src="/assets/js/app.js${v}"></script>`;
}

function shell(L, o, bodyHtml) {
  const inline = o.inlineData ? `<script>${o.inlineData}</script>\n` : "";
  return head(L, o) + `\n<body data-page="${o.bodyPage}">\n` + gtmBody() + "\n" + header(L, o.current) + "\n" + bodyHtml + "\n" + footer(L) + "\n" + drawerMenu(L) + "\n" + inline + scripts(L, o) + "\n</body>\n</html>\n";
}

function card(L, p) {
  const badge = p.badge ? `<span class="tag" style="position:absolute;top:12px;left:12px;z-index:3">${p.badge === "new" ? "New" : "Bestseller"}</span>` : "";
  return `<article class="card" data-cat="${p.category}" data-price="${p.price}" data-name="${escA(pname(L, p.id))}">
  <a href="${url("product", L, p)}" style="display:block">
    <div class="media">${badge}${pic(p.image, `alt="${escA(pname(L, p.id))}" loading="lazy" decoding="async"`, "(min-width:880px) 24vw, (min-width:560px) 30vw, 45vw")}
      <button class="btn btn-primary quick" data-quick-add="${p.id}">${T(L, "pdp.add")}</button></div></a>
  <div class="meta"><div><a href="${url("product", L, p)}" class="name link-underline">${esc(pname(L, p.id))}</a><div class="desc">${esc(pdesc(L, p.id))}</div></div>
    <div class="price">${fmt(L, p.price)}</div></div>
</article>`;
}

/* ---- JSON-LD ----------------------------------------------------------- */
function ldOrg() {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Elira Living", url: BASE + "/", logo: LOGO, image: OG, email: "support@eliraliving.com", founder: { "@type": "Person", name: "Zeerak Ata" }, address: { "@type": "PostalAddress", streetAddress: "Lapinrinne 1b", postalCode: "00180", addressLocality: "Helsinki", addressCountry: "FI" }, areaServed: ["DE", "NL"] });
}
function ldWebsite(L) { return JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Elira Living", url: BASE + "/", inLanguage: L }); }
function ldProduct(L, p) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: pname(L, p.id), sku: p.sku, image: (p.images && p.images.length ? p.images : [p.image]).map(i => BASE + i), description: pdesc(L, p.id), brand: { "@type": "Brand", name: "Elira Living" }, category: t(L, "cat." + p.category), offers: { "@type": "Offer", url: BASE + url("product", L, p), priceCurrency: "EUR", price: (p.price / 100).toFixed(2), availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: "Elira Living" } } });
}
function ldBreadcrumb(L, p) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE + url("home", L) },
    { "@type": "ListItem", position: 2, name: t(L, "cat." + p.category), item: BASE + url("shop", L) + "?category=" + p.category },
    { "@type": "ListItem", position: 3, name: pname(L, p.id), item: BASE + url("product", L, p) }
  ] });
}
function ldFAQ(faqs) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
}
function ldArticle(L, post, c) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: c.title, description: c.description,
    image: [BASE + post.image], inLanguage: L,
    datePublished: post.date, dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: "Elira Living", url: BASE + "/" },
    publisher: { "@type": "Organization", name: "Elira Living", logo: { "@type": "ImageObject", url: LOGO } },
    mainEntityOfPage: { "@type": "WebPage", "@id": BASE + url("post", L, post) }
  });
}
function ldPostBreadcrumb(L, post, c) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: BLOG_UI[L].crumbHome, item: BASE + url("home", L) },
    { "@type": "ListItem", position: 2, name: BLOG_UI[L].nav, item: BASE + url("blog", L) },
    { "@type": "ListItem", position: 3, name: c.title, item: BASE + url("post", L, post) }
  ] });
}

/* ---- Reviews: 3D scroll-reveal social proof (home) --------------------- */
function flagSVG(country) {
  // Tiny, crisp SVG flags (emoji flags don't render on Windows) — 21x14, rounded.
  if (country === "de") return `<svg class="r-flag" viewBox="0 0 5 3" width="21" height="13" aria-hidden="true"><rect width="5" height="3" fill="#000"/><rect width="5" height="2" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>`;
  return `<svg class="r-flag" viewBox="0 0 9 6" width="21" height="13" aria-hidden="true"><rect width="9" height="6" fill="#fff"/><rect width="9" height="2" fill="#AE1C28"/><rect width="9" height="2" y="4" fill="#21468B"/></svg>`;
}
function starsSVG(rating) {
  const star = (on) => `<svg viewBox="0 0 24 24" width="16" height="16" class="r-star${on ? " on" : ""}" aria-hidden="true"><path d="M12 2.3l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.6l-5.8 3.07 1.1-6.47L2.6 9.6l6.5-.95z"/></svg>`;
  let s = "";
  for (let i = 1; i <= 5; i++) s += star(i <= rating);
  return `<div class="r-stars" role="img" aria-label="${rating} / 5">${s}</div>`;
}
function reviewCard(L, r, i) {
  const ui = REVIEW_UI[L];
  const col = i % 3;            // depth tier for the 3D reveal (0|1|2)
  return `<figure class="r-card" data-rcard data-col="${col}">
    <span class="r-quote" aria-hidden="true">&ldquo;</span>
    ${starsSVG(r.rating)}
    <blockquote class="r-text">${esc(r.text)}</blockquote>
    <figcaption class="r-meta">
      <span class="r-avatar" aria-hidden="true">${esc(r.name.charAt(0))}</span>
      <span class="r-who"><span class="r-name">${esc(r.name)}</span><span class="r-loc">${flagSVG(r.country)} ${esc(ui.country[r.country])}</span></span>
      <span class="r-badge"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(ui.verified)}</span>
    </figcaption>
  </figure>`;
}
function reviewsSection(L) {
  const ui = REVIEW_UI[L];
  const n = REVIEWS.length;
  const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / n;
  const avgStr = avg.toFixed(1).replace(".", L === "en" ? "." : ",");
  const cards = REVIEWS.map((r, i) => reviewCard(L, r, i)).join("\n");
  return `<section class="reviews" data-reviews>
    <div class="reviews__blob reviews__blob--a"></div>
    <div class="reviews__blob reviews__blob--b"></div>
    <div class="reviews__head">
      <div class="kicker reveal" style="margin-bottom:.75rem">${esc(ui.kicker)}</div>
      <h2 class="font-display reveal" style="font-size:clamp(2.2rem,5vw,3.5rem);line-height:1.05">${esc(ui.title)}</h2>
      <div class="reviews__agg reveal">
        <span class="reviews__score font-display">${avgStr}</span>
        ${starsSVG(Math.round(avg))}
        <span class="reviews__count muted">${esc(ui.aggSuffix.replace("{n}", n))}</span>
      </div>
    </div>
    <div class="reviews__grid" data-reviews-grid>${cards}</div>
  </section>`;
}

/* ---- PAGE: HOME -------------------------------------------------------- */
function renderHome(L) {
  const P = "/" + L;
  const m = meta(L).home;
  const cards = CAT.PRODUCTS.map(p => card(L, p)).join("\n");
  const body = `<main>
  <section class="hero">
    <div class="hero__bg" data-hero-bg>${pic("/assets/img/shampoo.jpg", `alt="${escA(t(L, "hero.lead"))}" fetchpriority="high" decoding="async"`, "100vw")}</div>
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
      <div class="chapter__product" data-chapter-product>${pic("/assets/img/toner.jpg", `alt="${escA(pname(L, "purifying-toner"))}" loading="lazy" decoding="async"`, "(min-width:880px) 42vw, 75vw")}</div></div>
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
    <div class="split-media" data-split>${pic("/assets/img/cream.jpg", `alt="${escA(t(L, "about.kicker"))}" loading="lazy" decoding="async"`, "(min-width:880px) 50vw, 100vw")}</div>
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

  ${reviewsSection(L)}

  ${POSTS.length ? `<section class="container" style="padding:6rem 1.25rem">
    <div style="text-align:center;max-width:36rem;margin:0 auto 3.5rem">
      <div class="kicker reveal" style="margin-bottom:.75rem">${esc(BLOG_UI[L].kicker)}</div>
      <h2 class="font-display reveal" style="font-size:clamp(2.2rem,5vw,3.5rem)">${esc(BLOG_UI[L].heading)}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:2.75rem 2rem">${POSTS.slice(0, 3).map(p => blogCard(L, p)).join("\n")}</div>
    <div style="text-align:center;margin-top:3.5rem" class="reveal"><a href="${P}/blog/" class="btn btn-outline">${esc(BLOG_UI[L].back)}</a></div>
  </section>` : ""}

  <section class="container" style="padding:6rem 1.25rem">
    <div style="border:1px solid var(--line);background:var(--surface);padding:4rem 1.5rem;text-align:center" class="reveal">
      <div class="kicker" style="margin-bottom:.75rem">${T(L, "news.kicker")}</div>
      <h2 class="font-display" style="font-size:clamp(2rem,4vw,3rem);max-width:36rem;margin:0 auto">${T(L, "news.title")}</h2>
      <p class="muted" style="margin-top:1rem;max-width:28rem;margin-left:auto;margin-right:auto">${T(L, "news.lead")}</p>
      <form data-newsletter style="margin-top:2rem;max-width:28rem;margin-left:auto;margin-right:auto;display:flex;flex-wrap:wrap;gap:.75rem">
        <label class="sr-only" for="nl-name">${T(L, "form.firstName")}</label>
        <input id="nl-name" type="text" data-fname placeholder="${escA(t(L, "form.firstName"))}" autocomplete="given-name" style="flex:1;min-width:8rem">
        <label class="sr-only" for="nl">${T(L, "news.placeholder")}</label>
        <input id="nl" type="email" required placeholder="${escA(t(L, "news.placeholder"))}" style="flex:1;min-width:10rem">
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
  const faqs = (PRODUCT_FAQ[p.id] && (PRODUCT_FAQ[p.id][L] || PRODUCT_FAQ[p.id].en)) || [];
  const usage = (USAGE[p.id] && (USAGE[p.id][L] || USAGE[p.id].en)) || "";
  const imgs = (p.images && p.images.length) ? p.images : [p.image];
  const body = `<main class="page-main" data-product="${p.id}"><div class="container" style="padding-bottom:6rem">
  <a href="${url("shop", L)}" class="link-underline muted" style="display:inline-block;font-size:.875rem;margin-bottom:2rem">← ${T(L, "pdp.back")}</a>
  <div class="pdp-grid">
    <div class="reveal in" data-gallery>
      <div class="pdp-main" data-gallery-main tabindex="0" role="button" aria-label="${escA(pname(L, p.id))} — zoom">${pic(imgs[0], `alt="${escA(pname(L, p.id))}" fetchpriority="high" decoding="async" data-gallery-img`, "(min-width:880px) 46vw, 100vw")}</div>
      ${imgs.length > 1 ? `<div class="pdp-thumbs">${imgs.map((src, i) => `<button class="pdp-thumb${i === 0 ? " active" : ""}" data-gallery-thumb="${src}" aria-label="View image ${i + 1} of ${imgs.length}">${pic(src, `alt="" loading="lazy"`, "64px")}</button>`).join("")}</div>` : ""}
    </div>
    <div class="reveal in">
      <div class="kicker">${T(L, "cat." + p.category)}</div>
      <h1 class="font-display" style="font-size:clamp(2.2rem,5vw,3.2rem);margin-top:.75rem;line-height:1.05">${esc(pname(L, p.id))}</h1>
      <div class="font-display" style="font-size:1.5rem;margin-top:1rem">${fmt(L, p.price)}</div>
      ${p.freeShipping ? `<div style="display:inline-flex;align-items:center;gap:.4rem;margin-top:.6rem;font-size:.8rem;color:var(--sage)"><span style="color:var(--gold)">✦</span>${esc(FREESHIP_H[L])}</div>` : ""}
      <p style="margin-top:1.25rem;line-height:1.7;color:var(--ink-soft);max-width:34rem">${esc(pdesc(L, p.id))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem">${features}</div>
      <div style="margin-top:1.5rem"><span class="kicker">${T(L, "pdp.size")}</span><div style="margin-top:.75rem"><button class="swatch-size" aria-pressed="true">${esc(p.size)}</button></div></div>
      <div style="margin-top:1.75rem;display:flex;align-items:center;gap:1rem">
        <div class="qty"><button data-dec aria-label="-">–</button><input data-qin type="number" min="1" value="1" aria-label="${escA(t(L, "pdp.qty"))}"><button data-inc aria-label="+">+</button></div>
        <button class="btn btn-primary" style="flex:1" data-add>${T(L, "pdp.add")}</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:.75rem" data-buy>${T(L, "pdp.buy")}</button>
      <div style="margin-top:2.25rem">
        <details class="acc" open><summary><span class="kicker">${T(L, "pdp.ingredients")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(ping(L, p.id))} <a href="${url("ingredients", L)}" ${'class="link-underline"'}>${esc(INGREDIENTS_PAGE[L].title)} →</a></p></details>
        <details class="acc"><summary><span class="kicker">${USE_H[L]}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(usage)}</p></details>
        <details class="acc"><summary><span class="kicker">${T(L, "pdp.shipping")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${T(L, "pdp.shippingText")}</p></details>
      </div>
    </div>
  </div>
  <section style="margin-top:5rem;max-width:46rem">
    <h2 class="font-display" style="font-size:clamp(1.6rem,3.5vw,2.2rem);margin-bottom:1.5rem">${FAQ_H[L]}</h2>
    <div>${faqs.map(f => `<details class="acc"><summary><span style="font-weight:500;color:var(--ink)">${esc(f.q)}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(f.a)}</p></details>`).join("\n")}</div>
  </section>
  <section style="margin-top:5rem">
    <h2 class="font-display reveal" style="font-size:clamp(1.8rem,4vw,2.5rem);margin-bottom:2rem">${T(L, "pdp.related")}</h2>
    <div class="grid-products">${related.map(r => card(L, r)).join("\n")}</div>
  </section>
</div>
<div class="sticky-cart" data-sticky-cart aria-hidden="true"><div class="container" style="display:flex;align-items:center;gap:1rem;justify-content:space-between">
  <div style="min-width:0"><div class="font-display" style="font-size:1rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(pname(L, p.id))}</div><div class="muted" style="font-size:.85rem">${fmt(L, p.price)}</div></div>
  <button class="btn btn-primary" data-sticky-add style="flex:none">${T(L, "pdp.add")}</button>
</div></div>
</main>`;
  return shell(L, { page: "product", p, bodyPage: "product", title, description, ogType: "product", image: BASE + p.image, inlineData: `window.ELIRA_PAGE={type:"product",id:${JSON.stringify(p.id)}};`, keywords: [pname(L, p.id), t(L, "cat." + p.category), "Elira Living", "vegan", "COSMOS", "ECOCERT"].join(", "), ld: [ldOrg(), ldProduct(L, p), ldBreadcrumb(L, p), ldFAQ(faqs)] }, body);
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
    <div style="aspect-ratio:16/8;overflow:hidden;border:1px solid var(--line)" class="reveal">${pic("/assets/img/cream.jpg", `alt="${escA(t(L, "about.kicker"))}" fetchpriority="high" decoding="async" style="width:100%;height:100%;object-fit:cover"`, "(min-width:1040px) 60rem, 100vw")}</div>
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

/* ---- PAGE: INGREDIENTS (AIEO) ----------------------------------------- */
function renderIngredients(L) {
  const ip = INGREDIENTS_PAGE[L] || INGREDIENTS_PAGE.en;
  const list = INGREDIENTS[L] || INGREDIENTS.en;
  const items = list.map(ing => `
    <div style="border-top:1px solid var(--line);padding:1.5rem 0">
      <h2 class="font-display" style="font-size:1.5rem">${esc(ing.name)}</h2>
      <div class="muted" style="font-size:.8rem;letter-spacing:.04em;margin:.25rem 0 .75rem">INCI: ${esc(ing.inci)}</div>
      <p style="margin:0 0 .5rem;color:var(--ink-soft)"><strong style="color:var(--ink)">${L === "de" ? "Was es ist" : L === "nl" ? "Wat het is" : "What it is"}:</strong> ${esc(ing.what)}</p>
      <p style="margin:0;color:var(--ink-soft)"><strong style="color:var(--ink)">${L === "de" ? "Warum wir es verwenden" : L === "nl" ? "Waarom wij het gebruiken" : "Why we use it"}:</strong> ${esc(ing.why)}</p>
    </div>`).join("");
  const body = `<main class="page-main"><div class="container" style="max-width:52rem;padding-bottom:6rem">
  <div class="kicker" style="margin-bottom:.5rem">${T(L, "cat.kicker")}</div>
  <h1 class="font-display" style="font-size:clamp(2.4rem,6vw,3.6rem)">${esc(ip.title)}</h1>
  <p style="margin-top:1rem;font-size:1.1rem;color:var(--ink-soft)">${esc(ip.lead)}</p>
  <p style="margin-top:1rem;color:var(--ink-soft);line-height:1.7">${esc(ip.intro)}</p>
  <div style="margin-top:2.5rem">${items}</div>
  <div style="margin-top:3rem"><a href="${url("shop", L)}" class="btn btn-primary">${T(L, "best.viewall")}</a></div>
</div></main>`;
  const meta = { en: "Vegan, ECOCERT COSMOS-certified ingredients — what's in Elira Living skincare & haircare and why.",
    de: "Vegane, ECOCERT COSMOS-zertifizierte Inhaltsstoffe — was in der Elira Living Haut- & Haarpflege steckt und warum.",
    nl: "Veganistische, ECOCERT COSMOS-gecertificeerde ingrediënten — wat er in Elira Living huid- & haarverzorging zit en waarom." };
  return shell(L, { page: "ingredients", bodyPage: "legal", title: ip.title + " | Elira Living", description: meta[L], keywords: "ingredients, INCI, natural skincare ingredients, vegan, ECOCERT COSMOS, salicylic acid, lavender water, Elira Living", ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: BLOG / JOURNAL (Phase 1 — SEO content engine) -------------- */
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
function blogDate(L, iso) {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d)) return iso;
  return new Intl.DateTimeFormat(LOCALES[L], { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(d);
}
function postContent(L, post) { return post.i18n[L] || post.i18n.en; }

function productCallout(L, id) {
  const p = CAT.getProduct(id);
  if (!p) return "";
  const purl = url("product", L, p);
  return `<aside class="blog-product" style="display:flex;gap:1.25rem;align-items:center;border:1px solid var(--line);background:var(--surface);padding:1.25rem;margin:2rem 0">
  <a href="${purl}" style="flex:0 0 auto" aria-label="${escA(pname(L, p.id))}">${pic(p.image, `alt="${escA(pname(L, p.id))}" loading="lazy" style="width:84px;height:105px;object-fit:cover;border:1px solid var(--line)"`, "84px")}</a>
  <div style="flex:1;min-width:0">
    <div class="kicker" style="margin-bottom:.3rem">${T(L, "cat." + p.category)}</div>
    <a href="${purl}" class="font-display link-underline" style="font-size:1.15rem;display:inline-block;line-height:1.2">${esc(pname(L, p.id))}</a>
    <p class="muted" style="font-size:.85rem;margin:.45rem 0 .8rem;line-height:1.5">${esc(pdesc(L, p.id))}</p>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <span class="font-display">${fmt(L, p.price)}</span>
      <a href="${purl}" class="btn btn-outline" style="padding:.4rem 1.1rem;font-size:.78rem">${esc(BLOG_UI[L].learn)}</a>
    </div>
  </div>
</aside>`;
}
function renderBody(L, blocks) {
  return (blocks || []).map(b => {
    switch (b.type) {
      case "h2": return `<h2 class="font-display" id="${slugify(b.text)}" style="font-size:clamp(1.5rem,3.2vw,2.1rem);margin:2.5rem 0 1rem;line-height:1.15">${esc(b.text)}</h2>`;
      case "h3": return `<h3 class="font-display" style="font-size:1.25rem;margin:1.75rem 0 .75rem">${esc(b.text)}</h3>`;
      case "ul": return `<ul style="margin:1rem 0 1.25rem;padding-left:1.2rem;display:flex;flex-direction:column;gap:.5rem;color:var(--ink-soft)">${(b.items || []).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
      case "ol": return `<ol style="margin:1rem 0 1.25rem;padding-left:1.4rem;display:flex;flex-direction:column;gap:.5rem;color:var(--ink-soft)">${(b.items || []).map(i => `<li>${esc(i)}</li>`).join("")}</ol>`;
      case "quote": return `<blockquote style="margin:1.75rem 0;padding:.5rem 0 .5rem 1.25rem;border-left:2px solid var(--gold);font-style:italic;color:var(--ink-soft)">${esc(b.text)}</blockquote>`;
      case "product": return productCallout(L, b.id);
      case "p": default: return `<p style="margin:0 0 1.15rem;line-height:1.75;color:var(--ink-soft)">${esc(b.text)}</p>`;
    }
  }).join("\n");
}
function blogCard(L, post) {
  const c = postContent(L, post);
  const purl = url("post", L, post);
  return `<article class="blog-card reveal" style="display:flex;flex-direction:column">
  <a href="${purl}" aria-label="${escA(c.title)}"><div style="aspect-ratio:16/10;overflow:hidden;border:1px solid var(--line);background:var(--stone)">${pic(post.image, `alt="${escA(c.title)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover"`, "(min-width:900px) 30vw, (min-width:560px) 45vw, 90vw")}</div></a>
  <div style="padding-top:1.1rem;display:flex;flex-direction:column;flex:1">
    <div class="kicker" style="margin-bottom:.5rem">${T(L, "cat." + post.category)} · ${esc(blogDate(L, post.date))}</div>
    <a href="${purl}" class="font-display link-underline" style="font-size:1.35rem;line-height:1.2">${esc(c.title)}</a>
    <p class="muted" style="margin:.6rem 0 1rem;font-size:.9rem;line-height:1.6">${esc(c.excerpt)}</p>
    <a href="${purl}" class="link-underline" style="margin-top:auto;font-size:.85rem;color:var(--gold)">${esc(BLOG_UI[L].readMore)} →</a>
  </div>
</article>`;
}
function renderBlogIndex(L) {
  const ui = BLOG_UI[L];
  const cards = POSTS.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:2.5rem 2rem;margin-top:3.5rem">${POSTS.map(p => blogCard(L, p)).join("\n")}</div>`
    : `<p class="muted" style="margin-top:3rem">${esc(ui.empty)}</p>`;
  const itemList = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: POSTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: BASE + url("post", L, p), name: postContent(L, p).title })) });
  const body = `<main class="page-main"><div class="container" style="padding-bottom:6rem">
  <div style="max-width:42rem" class="reveal in">
    <div class="kicker" style="margin-bottom:.5rem">${esc(ui.kicker)}</div>
    <h1 class="font-display" style="font-size:clamp(2.6rem,6vw,4rem);line-height:1.02">${esc(ui.heading)}</h1>
    <p class="muted" style="margin-top:1rem;font-size:1.05rem">${esc(ui.lead)}</p>
  </div>
  ${cards}
</div></main>`;
  return shell(L, { page: "blog", bodyPage: "blog", current: "blog", title: ui.indexTitle, description: ui.indexDescription, keywords: ui.indexKeywords, ld: [ldOrg(), ldWebsite(L), itemList] }, body);
}
function renderPost(L, post) {
  const c = postContent(L, post);
  const ui = BLOG_UI[L];
  const title = c.title + " | Elira Living";
  const faqs = c.faq || [];
  const related = (post.related || []).map(id => CAT.getProduct(id)).filter(Boolean);
  const crumbs = `<nav aria-label="Breadcrumb" class="muted" style="font-size:.8rem;margin-bottom:1.5rem"><a href="${url("home", L)}" class="link-underline">${esc(ui.crumbHome)}</a> / <a href="${url("blog", L)}" class="link-underline">${esc(ui.nav)}</a></nav>`;
  const metaLine = `<div class="kicker" style="margin-top:1rem">${T(L, "cat." + post.category)} · ${esc(blogDate(L, post.date))} · ${c.readMins || 5} ${esc(ui.minRead)}</div>`;
  const faqSection = faqs.length ? `<section style="margin-top:4rem;max-width:44rem">
    <h2 class="font-display" style="font-size:clamp(1.6rem,3.5vw,2.2rem);margin-bottom:1.5rem">${esc(ui.faqHeading)}</h2>
    <div>${faqs.map(f => `<details class="acc"><summary><span style="font-weight:500;color:var(--ink)">${esc(f.q)}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(f.a)}</p></details>`).join("\n")}</div>
  </section>` : "";
  const relatedSection = related.length ? `<section style="margin-top:4.5rem">
    <h2 class="font-display reveal" style="font-size:clamp(1.5rem,3.5vw,2.1rem);margin-bottom:2rem">${esc(ui.related)}</h2>
    <div class="grid-products">${related.map(r => card(L, r)).join("\n")}</div>
  </section>` : "";
  const body = `<main class="page-main"><article class="container" style="padding-bottom:6rem">
  <div style="max-width:44rem">
    ${crumbs}
    <h1 class="font-display" style="font-size:clamp(2.2rem,5.5vw,3.4rem);line-height:1.05">${esc(c.title)}</h1>
    ${metaLine}
  </div>
  <div style="aspect-ratio:16/8;overflow:hidden;border:1px solid var(--line);margin:2rem 0 2.5rem;max-width:60rem" class="reveal">${pic(post.image, `alt="${escA(c.title)}" fetchpriority="high" decoding="async" style="width:100%;height:100%;object-fit:cover"`, "(min-width:1040px) 60rem, 100vw")}</div>
  <div class="blog-prose" style="max-width:44rem;font-size:1.05rem">
    ${renderBody(L, c.body)}
  </div>
  ${faqSection}
  ${relatedSection}
  <div style="margin-top:3.5rem"><a href="${url("blog", L)}" class="link-underline" style="color:var(--gold)">← ${esc(ui.back)}</a></div>
</article></main>`;
  const ld = [ldOrg(), ldArticle(L, post, c), ldPostBreadcrumb(L, post, c)];
  if (faqs.length) ld.push(ldFAQ(faqs));
  return shell(L, { page: "post", p: post, bodyPage: "blog", title, description: c.description, keywords: c.keywords, ogType: "article", image: BASE + post.image, ld }, body);
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
    write(`${L}/ingredients.html`, renderIngredients(L)); count++;
    write(`${L}/blog/index.html`, renderBlogIndex(L)); count++;
    POSTS.forEach(post => { write(`${L}/blog/${post.slug}.html`, renderPost(L, post)); count++; });
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
  writeLlms();
  writePrices();
  writeRobots();
  write404();
  writeManifest();
  writeFeed();
  console.log("Built " + count + " localized pages across " + LANGS.join(", ") + " + root + sitemap + llms.txt + prices.json + robots + 404 + manifest + feed.");
}

/* ---- robots.txt (kept in sync with baseUrl) --------------------------- */
function writeRobots() {
  write("robots.txt", `User-agent: *
Allow: /
Disallow: /*/cart.html
Disallow: /*/success.html
Disallow: /*/cancel.html

Sitemap: ${BASE}/sitemap.xml
`);
}

/* ---- web manifest ----------------------------------------------------- */
function writeManifest() {
  write("site.webmanifest", JSON.stringify({
    name: "Elira Living", short_name: "Elira",
    description: "Vegan, ECOCERT COSMOS-certified natural skincare & haircare.",
    start_url: "/en/", scope: "/", display: "standalone",
    background_color: "#0F120D", theme_color: "#0F120D",
    icons: [
      { src: "/assets/img/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/img/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/img/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }, null, 2) + "\n");
}

/* ---- branded 404 (GitHub Pages serves /404.html for any missing path) - */
function write404() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page not found — Elira Living</title>
<meta name="robots" content="noindex,follow">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/brand/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0} html,body{height:100%}
  body{background:#0F120D;color:#ECE7DB;font-family:'Jost',system-ui,sans-serif;display:grid;place-items:center;text-align:center;padding:2rem;overflow:hidden}
  .wrap{max-width:34rem}
  .kicker{font-size:.72rem;letter-spacing:.32em;text-transform:uppercase;color:#C8A24E;margin-bottom:1.25rem}
  h1{font-family:'Bodoni Moda',Georgia,serif;font-weight:400;font-size:clamp(4rem,16vw,8rem);line-height:1;color:#ECE7DB}
  h2{font-family:'Bodoni Moda',Georgia,serif;font-weight:400;font-size:clamp(1.4rem,5vw,2rem);margin:.5rem 0 1rem}
  p{color:#8E8A78;line-height:1.7;margin-bottom:2rem}
  .btns{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center}
  a.btn{display:inline-flex;align-items:center;padding:.85rem 1.8rem;font-size:.95rem;letter-spacing:.02em;border:1px solid rgba(236,231,219,.32);color:#ECE7DB;text-decoration:none;transition:background .25s,color .25s}
  a.btn:hover{background:#C8A24E;color:#14160F;border-color:#C8A24E}
  a.btn.primary{background:#ECE7DB;color:#14160F;border-color:#ECE7DB}
  a.btn.primary:hover{background:#C8A24E;border-color:#C8A24E}
  .langs{margin-top:2rem;font-size:.8rem;color:#8E8A78}.langs a{color:#C8A24E;text-decoration:none;margin:0 .4rem}
</style></head>
<body><div class="wrap">
  <img src="/assets/img/brand/logo-white.png" alt="Elira Living" style="height:52px;width:auto;margin:0 auto 1.75rem;display:block">
  <h1>404</h1>
  <h2>This page wandered off.</h2>
  <p>The page you're looking for doesn't exist or has moved. Let's get you back to something lovely.</p>
  <div class="btns">
    <a class="btn primary" href="/en/">Home</a>
    <a class="btn" href="/en/shop.html">Shop</a>
    <a class="btn" href="/en/blog/">Journal</a>
  </div>
  <div class="langs">Language: <a href="/en/">EN</a>·<a href="/de/">DE</a>·<a href="/nl/">NL</a></div>
</div>
<script>try{var l=(navigator.language||'en').slice(0,2).toLowerCase();if(['de','nl'].indexOf(l)>-1){document.querySelectorAll('a.btn,.langs a').forEach(function(a){a.href=a.getAttribute('href').replace('/en/','/'+l+'/');});}}catch(e){}</script>
</body></html>`;
  write("404.html", html);
}

/* ---- Google Merchant product feed (feed.xml) -------------------------- */
function writeFeed() {
  const items = CAT.PRODUCTS.map(p => {
    const L = "en";
    const gcat = p.category === "haircare"
      ? "Health &amp; Beauty &gt; Personal Care &gt; Hair Care"
      : "Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Skin Care";
    return `    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title>${esc(pname(L, p.id))}</g:title>
      <g:description>${esc(pdesc(L, p.id))}</g:description>
      <g:link>${BASE + url("product", L, p)}</g:link>
      <g:image_link>${BASE + p.image}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${(p.price / 100).toFixed(2)} EUR</g:price>
      <g:brand>Elira Living</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${gcat}</g:google_product_category>
      <g:shipping><g:country>DE</g:country><g:service>Standard</g:service><g:price>4.95 EUR</g:price></g:shipping>
      <g:shipping><g:country>NL</g:country><g:service>Standard</g:service><g:price>4.95 EUR</g:price></g:shipping>
    </item>`;
  }).join("\n");
  write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Elira Living</title>
    <link>${BASE}/</link>
    <description>Vegan, ECOCERT COSMOS-certified natural skincare &amp; haircare. Made in the EU.</description>
${items}
  </channel>
</rss>
`);
}

/* ---- prices.json (single source of truth for the checkout worker) ------ */
function writePrices() {
  const prices = {};
  CAT.PRODUCTS.forEach(p => { prices[p.id] = p.price; });
  const data = {
    _comment: "Auto-generated from assets/data/catalog.js by build.js. Do not edit by hand — edit catalog.js. The checkout worker reads this so displayed and charged prices always match.",
    currency: CAT.CONFIG.currency,
    freeShippingThreshold: CAT.CONFIG.freeShippingThreshold,
    shippingFlat: CAT.CONFIG.shippingFlat,
    freeShipping: CAT.PRODUCTS.filter(p => p.freeShipping).map(p => p.id),
    prices
  };
  write("assets/data/prices.json", JSON.stringify(data, null, 2) + "\n");
}

function writeRoot() {
  const hm = meta("en").home; // keep the bare domain's snippet identical to /en/
  const title = hm.title, desc = hm.description;
  const links = LANGS.map(L => `<a href="/${L}/">${L.toUpperCase()}</a>`).join(" · ");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escA(title)}</title>
<meta name="description" content="${escA(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${BASE}/en/">
${LANGS.map(L => `<link rel="alternate" hreflang="${L}" href="${BASE}/${L}/">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${BASE}/en/">
<meta property="og:site_name" content="Elira Living">
<meta property="og:type" content="website">
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(desc)}">
<meta property="og:url" content="${BASE}/">
<meta property="og:image" content="${OG}">
<meta property="og:locale" content="en_GB">
<meta property="og:locale:alternate" content="de_DE">
<meta property="og:locale:alternate" content="nl_NL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escA(title)}">
<meta name="twitter:description" content="${escA(desc)}">
<meta name="twitter:image" content="${OG}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/brand/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/img/brand/favicon-16.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/brand/apple-touch-icon.png">
<meta name="theme-color" content="#0F120D">
<link rel="manifest" href="/site.webmanifest">
<script type="application/ld+json">${ldOrg()}</script>
<script type="application/ld+json">${ldWebsite("en")}</script>
<style>html,body{height:100%;margin:0;background:#0F120D;color:#ECE7DB;font-family:'Jost',system-ui,sans-serif;display:grid;place-items:center;text-align:center;padding:2rem}a{color:#C8A24E;text-decoration:none}.logo{height:64px;width:auto;margin-bottom:1.5rem}h1{font-family:Georgia,serif;font-weight:400;font-size:1.75rem;margin:0 0 .5rem}p{color:#C7C1B1;line-height:1.6;max-width:30rem;margin:.4rem auto}.l{margin-top:1.5rem;font-size:.85rem;letter-spacing:.08em}</style>
<script>
  var supported=["en","de","nl"];
  var l=(navigator.language||"en").slice(0,2).toLowerCase();
  if(supported.indexOf(l)<0)l="en";
  location.replace("/"+l+"/");
</script></head>
<body><main><img class="logo" src="/assets/img/brand/logo-white.png" alt="Elira Living">
<h1>Elira Living — Natural Vegan Skincare &amp; Haircare</h1>
<p>${escA(desc)}</p>
<p class="l">${links}</p></main></body></html>`;
  write("index.html", html);
}

function writeSitemap() {
  const pagesFor = L => {
    const list = [
      { page: "home", pr: "1.0", cf: "weekly" },
      { page: "shop", pr: "0.9", cf: "weekly" },
      { page: "about", pr: "0.6" },
      { page: "ingredients", pr: "0.7" },
      { page: "blog", pr: "0.7", cf: "weekly" },
      { page: "impressum", pr: "0.2" }, { page: "privacy", pr: "0.2" }, { page: "terms", pr: "0.2" }, { page: "withdrawal", pr: "0.2" }
    ];
    CAT.PRODUCTS.forEach(p => list.push({ page: "product", p, pr: "0.8" }));
    POSTS.forEach(post => list.push({ page: "post", p: post, pr: "0.6" }));
    return list;
  };
  const lastmod = new Date().toISOString().slice(0, 10);
  let urls = "";
  LANGS.forEach(L => pagesFor(L).forEach(it => {
    const loc = BASE + url(it.page, L, it.p);
    const alts = LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${BASE + url(it.page, x, it.p)}"/>`).join("\n") +
      `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE + url(it.page, "en", it.p)}"/>`;
    urls += `  <url>\n    <loc>${loc}</loc>\n${alts}\n    <lastmod>${lastmod}</lastmod>\n${it.cf ? `    <changefreq>${it.cf}</changefreq>\n` : ""}    <priority>${it.pr}</priority>\n  </url>\n`;
  }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}</urlset>\n`;
  write("sitemap.xml", xml);
}

/* ---- llms.txt (AI crawler brand facts) -------------------------------- */
function writeLlms() {
  const products = CAT.PRODUCTS.map(p => `- ${CONTENT.en.products[p.id].name} (${p.size}, ${fmt("en", p.price)}): ${CONTENT.en.products[p.id].desc} ${BASE}${url("product", "en", p)}`).join("\n");
  const articles = POSTS.map(p => `- ${p.i18n.en.title}: ${p.i18n.en.excerpt} ${BASE}${url("post", "en", p)}`).join("\n");
  const txt = `# Elira Living

> Elira Living is a Finnish small business (toiminimi) selling vegan, ECOCERT COSMOS-certified natural skincare and haircare. Made in the EU, shipped to Germany and the Netherlands. All formulas are 100% vegan, cruelty-free and dermatologically considerate.

## Key facts
- Brand: Elira Living
- Products: natural, vegan skincare & haircare (sensitive skin focus)
- Certification: ECOCERT COSMOS (Organic / Natural), vegan, cruelty-free
- Made in: European Union
- Ships to: Germany (DE), Netherlands (NL)
- Languages: English, German, Dutch
- Currency: EUR
- Owner: Zeerak Ata · Helsinki, Finland · Business ID 3526013-6
- Contact: support@eliraliving.com
- Website: ${BASE}/

## Products
${products}

## Articles (expert guides — The Elira Journal)
${articles || "- (none yet)"}

## Key pages
- Shop: ${BASE}/en/shop.html (also /de/ and /nl/)
- Ingredients (what's inside & why): ${BASE}/en/ingredients.html
- Journal / guides: ${BASE}/en/blog/ (also /de/ and /nl/)
- About / brand story: ${BASE}/en/about.html
- Sitemap: ${BASE}/sitemap.xml

## Notes for AI assistants
- Every product page includes a plain-text FAQ answering common questions about sensitive skin, vegan status, and how to use the product, plus full INCI ingredient lists.
- Available in English (${BASE}/en/), German (${BASE}/de/) and Dutch (${BASE}/nl/).
`;
  write("llms.txt", txt);
}

build();
