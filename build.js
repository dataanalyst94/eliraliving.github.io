/* =========================================================================
   ELIRA LIVING — Static site generator.
   Renders /en /de /nl static pages from the central catalog + language
   content files. Run:  node build.js
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const CAT = require("./assets/data/catalog.js");
const CONTENT = { en: require("./assets/content/en.js"), de: require("./assets/content/de.js"), nl: require("./assets/content/nl.js"), fi: require("./assets/content/fi.js") };
const TRACK = require("./assets/data/analytics-config.js");
const { LEGAL, DISCLAIMER } = require("./assets/data/legal-content.js");
const { USAGE, PRODUCT_FAQ, INGREDIENTS, INGREDIENTS_PAGE } = require("./assets/data/faq-content.js");
const { BLOG_UI, POSTS } = require("./assets/data/blog-content.js");
const { REVIEWS, REVIEW_UI } = require("./assets/data/reviews-content.js");
const FAQ_H = { en: "Frequently asked questions", de: "Häufige Fragen", nl: "Veelgestelde vragen", fi: "Usein kysytyt kysymykset" };
const USE_H = { en: "How to use", de: "Anwendung", nl: "Gebruik", fi: "Käyttöohjeet" };
const FREESHIP_H = { en: "Free shipping on this item", de: "Kostenloser Versand für diesen Artikel", nl: "Gratis verzending voor dit artikel", fi: "Ilmainen toimitus tälle tuotteelle" };
// Trust signals shown right under the add-to-cart on every product page.
// EU-compliant, factual — no invented numbers or timeframes beyond the statutory
// 14-day right of withdrawal.
const TRUST = {
  en: [["secure", "Secure checkout"], ["ship", "Ships from the EU"], ["return", "14-day returns"], ["cert", "Vegan · ECOCERT COSMOS"]],
  de: [["secure", "Sicherer Bezahlvorgang"], ["ship", "Versand aus der EU"], ["return", "14 Tage Widerrufsrecht"], ["cert", "Vegan · ECOCERT COSMOS"]],
  nl: [["secure", "Veilig afrekenen"], ["ship", "Verzending uit de EU"], ["return", "14 dagen retourrecht"], ["cert", "Vegan · ECOCERT COSMOS"]],
  fi: [["secure", "Turvallinen maksu"], ["ship", "Toimitus EU:sta"], ["return", "14 päivän palautusoikeus"], ["cert", "Vegaaninen · ECOCERT COSMOS"]],
};
const TRUST_ICONS = {
  secure: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ship: '<path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.4"/><circle cx="17" cy="18" r="1.4"/>',
  return: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  cert: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
};
const trustRow = (L) => `<div class="pdp-trust">${(TRUST[L] || TRUST.en).map(([k, label]) =>
  `<div class="pdp-trust__item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${TRUST_ICONS[k]}</svg><span>${esc(label)}</span></div>`).join("")}</div>`;
const JOURNAL_H = { en: "From the Journal", de: "Aus dem Journal", nl: "Uit het Journal", fi: "Journalista" };

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

// Content-Security-Policy — locks the page to exactly the origins this site uses
// (payments, analytics, fonts). Blocks scripts/connections to anything else, so an
// injected <script src> or data-exfil to an attacker domain is refused by the browser.
// 'unsafe-inline' is required for GTM + the static site's inline snippets; everything
// else is tightly scoped. (frame-ancestors/HSTS need real HTTP headers — see Cloudflare note.)
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://static.klaviyo.com https://js.stripe.com https://connect.facebook.net https://analytics.tiktok.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://elira-checkout.elira-living.workers.dev https://elira-tracking.elira-living.workers.dev https://api.stripe.com https://a.klaviyo.com https://*.klaviyo.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://analytics.tiktok.com https://*.tiktok.com https://www.facebook.com https://connect.facebook.net https://www.googletagmanager.com https://googleads.g.doubleclick.net",
  "frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://td.doubleclick.net https://www.googletagmanager.com https://bid.g.doubleclick.net",
  "form-action 'self' https://checkout.stripe.com"
].join("; ");

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
const OGLOC = { en: "en_GB", de: "de_DE", nl: "nl_NL", fi: "fi_FI" };
const LANGS = ["en", "de", "nl", "fi"];
const LOCALES = { de: "de-DE", nl: "nl-NL", en: "en-IE", fi: "fi-FI" };
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
    case "certifications": return P + "/certifications.html";
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  ${gtmHead()}
  <title>${escA(o.title)}</title>
  <meta name="description" content="${escA(o.description)}">
  ${o.keywords ? `<meta name="keywords" content="${escA(o.keywords)}">` : ""}
  <meta name="robots" content="${o.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
  ${TRACK.GSC_VERIFICATION ? `<meta name="google-site-verification" content="${escA(TRACK.GSC_VERIFICATION)}">` : ""}
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
  ${o.home ? `<link rel="preload" as="image" type="image/webp" imagesrcset="${RESP["/assets/img/hero.jpg"].map(t => `${t[1]} ${t[0]}w`).join(", ")}" imagesizes="100vw" fetchpriority="high">
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
    <a href="${P}/shop.html" class="nav-link" data-nav="shop" ${cur("shop")}>${T(L, "nav.shop")}</a>
    <a href="${P}/shop.html?category=skincare" class="nav-link" data-nav="skincare">${T(L, "nav.skincare")}</a>
    <a href="${P}/shop.html?category=haircare" class="nav-link" data-nav="haircare">${T(L, "nav.haircare")}</a>
    <a href="${P}/blog/" class="nav-link" ${cur("blog")}>${esc(BLOG_UI[L].nav)}</a>
    <a href="${P}/about.html" class="nav-link" ${cur("about")}>${T(L, "nav.about")}</a>
    <a href="${P}/ingredients.html" class="nav-link" ${cur("ingredients")}>${T(L, "nav.ingredients")}</a>
    <a href="${P}/certifications.html" class="nav-link" ${cur("certifications")}>${T(L, "nav.certifications")}</a>
  </nav>
  <div class="nav-actions">
    <select class="lang-select" data-lang aria-label="Language"><option value="de">DE</option><option value="nl">NL</option><option value="en">EN</option><option value="fi">FI</option></select>
    <button class="icon-btn" data-cart-open aria-label="${escA(t(L, "nav.cart"))}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span class="cart-badge" data-cart-count style="display:none">0</span></button>
  </div>
</div></header>`;
}

function footer(L) {
  const P = "/" + L;
  const li = (href, label) => `<li><a class="link-underline" href="${href}">${label}</a></li>`;
  return `<footer class="site-footer footer"><div class="container" style="padding-top:4rem;padding-bottom:5rem">
  <div class="foot-grid" style="display:grid;gap:2.5rem">
    <div style="max-width:20rem"><img src="/assets/img/brand/logo-white.png" alt="Elira Living" class="footer-logo" width="69" height="50" loading="lazy" decoding="async" style="margin-bottom:1rem"><p class="muted" style="font-size:.875rem;line-height:1.6">${T(L, "foot.tag")}</p>
      <div class="foot-social">${SOCIALS.map(s => `<a class="foot-social__a" href="${s.url}" target="_blank" rel="me noopener" aria-label="Elira Living on ${s.name}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${s.icon}</svg></a>`).join("")}</div></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.shop")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/shop.html?category=skincare", T(L, "nav.skincare"))}${li(P + "/shop.html?category=haircare", T(L, "nav.haircare"))}${li(P + "/shop.html", T(L, "nav.shop"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.help")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/withdrawal.html", T(L, "foot.shipping"))}${li(P + "/terms.html", T(L, "foot.faq"))}${li("mailto:support@eliraliving.com", T(L, "foot.contact"))}</ul></div>
    <div><h3 class="kicker" style="margin-bottom:1rem">${T(L, "foot.company")}</h3><ul style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem">
      ${li(P + "/about.html", T(L, "foot.about"))}${li(P + "/blog/", esc(BLOG_UI[L].nav))}${li(P + "/ingredients.html", esc(INGREDIENTS_PAGE[L].title))}${li(P + "/certifications.html", T(L, "nav.certifications"))}${li(P + "/privacy.html", T(L, "foot.privacy"))}${li(P + "/impressum.html", T(L, "foot.imprint"))}</ul></div>
  </div>
  <div style="margin-top:3.5rem;padding-top:1.5rem;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;align-items:center;font-size:.75rem" class="muted">
    <div>© <span data-year></span> Elira Living · ${T(L, "foot.rights")} · ${T(L, "foot.businessId")}</div>
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
  <nav><a href="${P}/shop.html" data-nav="shop">${T(L, "nav.shop")}</a><a href="${P}/shop.html?category=skincare" data-nav="skincare">${T(L, "nav.skincare")}</a><a href="${P}/shop.html?category=haircare" data-nav="haircare">${T(L, "nav.haircare")}</a><a href="${P}/blog/">${esc(BLOG_UI[L].nav)}</a><a href="${P}/about.html">${T(L, "nav.about")}</a><a href="${P}/ingredients.html">${T(L, "nav.ingredients")}</a><a href="${P}/certifications.html">${T(L, "nav.certifications")}</a></nav>
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

const BADGE_LABEL = {
  en: { new: "New", bestseller: "Bestseller", bundle: "Save 10%" },
  de: { new: "Neu", bestseller: "Bestseller", bundle: "10% sparen" },
  nl: { new: "Nieuw", bestseller: "Bestseller", bundle: "10% korting" },
};
function card(L, p) {
  const badge = p.badge ? `<span class="tag" style="position:absolute;top:12px;left:12px;z-index:3">${esc((BADGE_LABEL[L] || BADGE_LABEL.en)[p.badge] || "Bestseller")}</span>` : "";
  return `<article class="card" data-cat="${p.category}" data-price="${p.price}" data-name="${escA(pname(L, p.id))}">
  <a href="${url("product", L, p)}" style="display:block">
    <div class="media">${badge}${pic(p.image, `alt="${escA(pname(L, p.id))}" loading="lazy" decoding="async"`, "(min-width:880px) 24vw, (min-width:560px) 30vw, 45vw")}
      <button class="btn btn-primary quick" data-quick-add="${p.id}">${T(L, "pdp.add")}</button></div></a>
  <div class="meta"><div><a href="${url("product", L, p)}" class="name link-underline">${esc(pname(L, p.id))}</a><div class="desc">${esc(pdesc(L, p.id))}</div></div>
    <div class="price">${fmt(L, p.price)}</div></div>
</article>`;
}

/* ---- JSON-LD ----------------------------------------------------------- */
// Entity `sameAs` — links the Elira brand entity to its official profiles.
// This is a core AI-SEO / Knowledge-Graph signal: it's how Google and LLMs
// confirm "this brand = these profiles" and decide what to cite. Paste your
// REAL profile URLs here as they go live (Instagram, Facebook, Pinterest,
// LinkedIn, Trustpilot, Crunchbase, Wikidata, etc.). Leave empty until real —
// never point sameAs at a profile that doesn't exist. When non-empty it is
// emitted on every page's Organization schema automatically.
const SAMEAS = [
  "https://www.instagram.com/eliralivingeu",
  "https://www.facebook.com/eliralivingeu",
  "https://www.tiktok.com/@eliralivingeu",
  "https://www.trustpilot.com/review/eliraliving.com",
  "https://www.crunchbase.com/organization/elira-living",
  "https://www.linkedin.com/company/elira-living",
  // Wikidata intentionally skipped (notability risk for a new brand).
];
// Footer social links (also drive entity reciprocity via rel="me").
const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/eliralivingeu", icon: '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.2 1 .47 1.4.9.4.4.7.8.9 1.4.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-.9.04-1.4.2-1.7.32-.43.17-.74.37-1.06.7-.32.32-.52.63-.7 1.06-.12.3-.28.8-.32 1.7C3.25 8.5 3.24 8.9 3.24 12s0 3.5.07 4.7c.04.9.2 1.4.32 1.7.17.43.37.74.7 1.06.32.32.63.52 1.06.7.3.12.8.28 1.7.32 1.2.06 1.6.07 4.7.07s3.5 0 4.7-.07c.9-.04 1.4-.2 1.7-.32.43-.17.74-.37 1.06-.7.32-.32.52-.63.7-1.06.12-.3.28-.8.32-1.7.06-1.2.07-1.6.07-4.7s0-3.5-.07-4.7c-.04-.9-.2-1.4-.32-1.7a2.86 2.86 0 0 0-.7-1.06 2.86 2.86 0 0 0-1.06-.7c-.3-.12-.8-.28-1.7-.32C15.5 4 15.1 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.15-.6a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z"/>' },
  { name: "Facebook", url: "https://www.facebook.com/eliralivingeu", icon: '<path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>' },
  { name: "TikTok", url: "https://www.tiktok.com/@eliralivingeu", icon: '<path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.6a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.3a5.9 5.9 0 1 0 5.02 5.84V9.01a7.5 7.5 0 0 0 4.36 1.4V7.2a4.28 4.28 0 0 1-3.3-1.38Z"/>' },
];
function ldOrg() {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Elira Living", url: BASE + "/", logo: LOGO, image: OG, email: "support@eliraliving.com", founder: { "@type": "Person", name: "Zeerak Ata" }, address: { "@type": "PostalAddress", streetAddress: "Lapinrinne 1b", postalCode: "00180", addressLocality: "Helsinki", addressCountry: "FI" }, areaServed: ["DE", "NL"], ...(SAMEAS.length ? { sameAs: SAMEAS } : {}) });
}
function ldWebsite(L) { return JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Elira Living", url: BASE + "/", inLanguage: L }); }
// Verified reviews for a given product (genuine buyers; see reviews-content.js).
function productReviews(id) { return REVIEWS.filter(r => r.product === id); }
function productAgg(id) {
  const revs = productReviews(id);
  if (!revs.length) return null;
  const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
  return { revs, avg, count: revs.length };
}
function ldProduct(L, p) {
  const obj = { "@context": "https://schema.org", "@type": "Product", name: pname(L, p.id), sku: p.sku, image: (p.images && p.images.length ? p.images : [p.image]).map(i => BASE + i), description: pdesc(L, p.id), brand: { "@type": "Brand", name: "Elira Living" }, category: t(L, "cat." + p.category), offers: { "@type": "Offer", url: BASE + url("product", L, p), priceCurrency: "EUR", price: (p.price / 100).toFixed(2), availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: "Elira Living" } } };
  const agg = productAgg(p.id);
  if (agg) {
    obj.aggregateRating = { "@type": "AggregateRating", ratingValue: agg.avg.toFixed(1), reviewCount: agg.count, bestRating: 5, worstRating: 1 };
    obj.review = agg.revs.map(r => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 }, reviewBody: r.text }));
  }
  return JSON.stringify(obj);
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
// Lifestyle "trust strip" — real people using the real products. Strong social
// proof / trust signal placed just before the written reviews on the home page.
const TRUST_IMGS = [
  ["/assets/img/lifestyle/hold-serum-f.jpg", "A woman holding the Elira peptide serum"],
  ["/assets/img/lifestyle/hold-cleanser-f.jpg", "A woman with the Elira cleanser"],
  ["/assets/img/lifestyle/hold-shampoo-m.jpg", "A man holding the Elira shampoo"],
  ["/assets/img/lifestyle/ritual.jpg", "A calm skincare ritual moment"],
];
function trustStrip(L) {
  const items = TRUST_IMGS.map(([src, alt]) =>
    `<figure class="trust-strip__item reveal" style="margin:0">${pic(src, `alt="${escA(alt)}" loading="lazy" decoding="async"`, "(min-width:760px) 22vw, 45vw")}</figure>`).join("");
  return `<section class="container" style="padding:5rem 1.25rem 4rem">
    <div style="text-align:center;max-width:38rem;margin:0 auto 2.75rem">
      <div class="kicker reveal" style="margin-bottom:.75rem">${T(L, "trust.kicker")}</div>
      <h2 class="font-display reveal" style="font-size:clamp(2rem,4.5vw,3rem);line-height:1.08">${T(L, "trust.title")}</h2>
      <p class="muted reveal" style="margin-top:1rem">${T(L, "trust.lead")}</p>
    </div>
    <div class="trust-strip">${items}</div>
  </section>`;
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

// Visible per-product reviews on the PDP — Google requires the rating that the
// schema declares to also be visible to users on the page.
const PDP_REVIEWS_H = { en: "What buyers say", de: "Was Käufer:innen sagen", nl: "Wat kopers zeggen", fi: "Mitä ostajat sanovat" };
function productReviewsSection(L, p) {
  const agg = productAgg(p.id);
  if (!agg) return "";
  const ui = REVIEW_UI[L];
  const avgStr = agg.avg.toFixed(1).replace(".", L === "en" ? "." : ",");
  const cards = agg.revs.map((r, i) => reviewCard(L, r, i)).join("\n");
  return `<section style="margin-top:5rem">
    <h2 class="font-display reveal" style="font-size:clamp(1.8rem,4vw,2.5rem)">${esc(PDP_REVIEWS_H[L])}</h2>
    <div class="reviews__agg reveal" style="margin-top:1rem;margin-bottom:2.5rem">
      <span class="reviews__score font-display">${avgStr}</span>
      ${starsSVG(Math.round(agg.avg))}
      <span class="reviews__count muted">${esc(ui.aggSuffix.replace("{n}", agg.count))}</span>
    </div>
    <div class="reviews__grid">${cards}</div>
  </section>`;
}

/* ---- PAGE: HOME -------------------------------------------------------- */
function renderHome(L) {
  const P = "/" + L;
  const m = meta(L).home;
  const cards = CAT.PRODUCTS.map(p => card(L, p)).join("\n");
  // Wet-bottle overlay: SVG condensation beads + running droplets + gloss sweep.
  // Sits inside each cp-face so it rotates with the coin-flip. Pure CSS motion.
  const drops = [[78,170,4],[120,150,3],[150,210,5],[95,250,3],[135,300,4],[70,340,3],[160,360,4],[110,400,6],[145,450,3],[85,470,4],[125,520,5],[160,560,3],[95,600,4],[135,640,3],[75,680,5],[150,700,3],[115,740,6],[90,790,3],[140,820,4],[110,870,5],[80,905,3],[150,935,4]];
  const beads = drops.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#drp)"/>`).join("");
  const WET = `<div class="cp-wet" aria-hidden="true"><svg class="beads" viewBox="0 0 234 1100" preserveAspectRatio="xMidYMid meet"><defs><radialGradient id="drp" cx="38%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="45%" stop-color="#dfe9df" stop-opacity=".35"/><stop offset="100%" stop-color="#a9bda0" stop-opacity="0"/></radialGradient></defs>${beads}</svg><span class="cp-drip d1"></span><span class="cp-drip d2"></span><span class="cp-drip d3"></span></div>`;
  const body = `<main>
  <section class="hero">
    <div class="hero__bg" data-hero-bg>${pic("/assets/img/hero.jpg", `alt="${escA(t(L, "hero.lead"))}" fetchpriority="high" decoding="async"`, "100vw")}</div>
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
    <div class="hero__ship-track"><p class="hero__ship"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.4"/><circle cx="17" cy="18" r="1.4"/></svg><span>${T(L, "hero.shipNote")}<span class="hero__ship-extra"> — ${T(L, "hero.shipNoteExtra")}</span></span></p></div>
    <div class="scroll-cue"><span></span></div>
  </section>

  <section class="cert-strip"><div class="marquee" style="padding:1rem 0"><div class="marquee__track font-display" style="font-size:1.75rem;color:var(--ink-soft)">
    ${[["marq.vegan"], ["marq.cosmos"], ["marq.made"], ["marq.derm"], ["marq.cruelty"], ["marq.vegan"], ["marq.cosmos"], ["marq.made"]].map(k => `<span style="margin:0 2.5rem">${T(L, k[0])}</span><span style="margin:0 .5rem;color:var(--gold)">✦</span>`).join("")}
  </div></div></section>

  <section class="chapter" data-chapter>
    <div class="chapter__stage"><div class="chapter__glow" data-chapter-glow></div>
      <div class="chapter__product" data-chapter-product><div class="cp-coin" data-chapter-coin>
        <div class="cp-face cp-front"><picture><source srcset="/assets/img/cream-hero.webp" type="image/webp"><img src="/assets/img/cream-hero.png" alt="${escA(pname(L, "sensitive-moisturizing-cream"))}" loading="lazy" decoding="async"></picture>${WET}</div>
        <div class="cp-face cp-back" aria-hidden="true"><picture><source srcset="/assets/img/cream-hero.webp" type="image/webp"><img src="/assets/img/cream-hero.png" alt="" loading="lazy" decoding="async"></picture>${WET}</div>
      </div></div></div>
    <div class="chapter__headlines" data-chapter-headlines>
      <div class="kicker" style="margin-bottom:.75rem">${T(L, "chapter.kicker")}</div>
      <h2 class="font-display" style="font-size:clamp(2rem,5vw,3.5rem);line-height:1.05"><span data-headline="0">${T(L, "chapter.head1")}</span><span data-headline="1" style="opacity:0">${T(L, "chapter.head2")}</span><span data-headline="2" style="opacity:0">${T(L, "chapter.head3")}</span></h2>
    </div>
    <div class="ingredient" data-ingredient style="top:24%;left:8%"><div class="ln"></div><h4 class="font-display">${T(L, "ing.1.t")}</h4><p>${T(L, "ing.1.d")}</p></div>
    <div class="ingredient" data-ingredient style="top:54%;right:9%;text-align:right"><div class="ln" style="margin-left:auto"></div><h4 class="font-display">${T(L, "ing.2.t")}</h4><p>${T(L, "ing.2.d")}</p></div>
    <div class="ingredient" data-ingredient style="bottom:16%;left:12%"><div class="ln"></div><h4 class="font-display">${T(L, "ing.3.t")}</h4><p>${T(L, "ing.3.d")}</p></div>
    <div style="position:absolute;bottom:7%;left:50%;transform:translateX(-50%);z-index:3"><a href="${url("product", L, { id: "sensitive-moisturizing-cream" })}" class="btn btn-primary">${T(L, "chapter.cta")}</a></div>
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
    <div class="split-media" data-split>${pic("/assets/img/lifestyle/hold-cream-f.jpg", `alt="${escA(t(L, "story.title"))}" loading="lazy" decoding="async"`, "(min-width:880px) 50vw, 100vw")}</div>
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

  ${trustStrip(L)}

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
  // Internal-link this product to the Journal articles that feature it (reverse
  // of each post's `related: [productId]`). Strong topical relevance for SEO + buyer education.
  const guides = POSTS.filter(post => (post.related || []).includes(p.id)).slice(0, 3);
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
      ${trustRow(L)}
      <div style="margin-top:2.25rem">
        <details class="acc" open><summary><span class="kicker">${T(L, "pdp.ingredients")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(ping(L, p.id))} <a href="${url("ingredients", L)}" ${'class="link-underline"'}>${esc(INGREDIENTS_PAGE[L].title)} →</a></p></details>
        <details class="acc"><summary><span class="kicker">${USE_H[L]}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(usage)}</p></details>
        <details class="acc"><summary><span class="kicker">${T(L, "pdp.shipping")}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${T(L, "pdp.shippingText")}</p></details>
      </div>
    </div>
  </div>
  ${productReviewsSection(L, p)}
  <section style="margin-top:5rem;max-width:46rem">
    <h2 class="font-display" style="font-size:clamp(1.6rem,3.5vw,2.2rem);margin-bottom:1.5rem">${FAQ_H[L]}</h2>
    <div>${faqs.map(f => `<details class="acc"><summary><span style="font-weight:500;color:var(--ink)">${esc(f.q)}</span><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg></summary><p>${esc(f.a)}</p></details>`).join("\n")}</div>
  </section>
  ${guides.length ? `<section style="margin-top:5rem;max-width:46rem">
    <h2 class="font-display" style="font-size:clamp(1.6rem,3.5vw,2.2rem);margin-bottom:1.5rem">${JOURNAL_H[L]}</h2>
    <div style="display:flex;flex-direction:column">${guides.map(g => { const gc = postContent(L, g); const gurl = url("post", L, g); return `<a href="${gurl}" class="pdp-guide"><div style="min-width:0"><div class="font-display" style="font-size:1.15rem;line-height:1.25">${esc(gc.title.split(" | ")[0])}</div><p class="muted" style="font-size:.85rem;margin:.35rem 0 0;line-height:1.55">${esc(gc.excerpt)}</p></div><span class="pdp-guide__arrow" aria-hidden="true">→</span></a>`; }).join("")}</div>
  </section>` : ""}
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
  const imgStyle = `style="width:100%;height:100%;object-fit:cover"`;
  const body = `<main class="page-main">
  <section class="container" style="text-align:center;padding-bottom:3.5rem">
    <div class="kicker reveal in" style="margin-bottom:1rem">${T(L, "about.kicker")}</div>
    <h1 class="font-display reveal in" style="font-size:clamp(2.6rem,7vw,5rem);line-height:1;max-width:60rem;margin:0 auto">${T(L, "about.title")}</h1>
    <p class="muted reveal in" style="margin-top:1.5rem;font-size:1.125rem;max-width:36rem;margin-left:auto;margin-right:auto">${T(L, "about.lead")}</p>
  </section>

  <section class="container" style="padding:1rem 1.25rem 1.5rem">
    <div class="about-split">
      <div class="about-split__media reveal">${pic("/assets/img/lifestyle/calm.jpg", `alt="${escA(t(L, "about.storyTitle"))}" fetchpriority="high" decoding="async" ${imgStyle}`, "(min-width:880px) 40vw, 100vw")}</div>
      <div class="about-split__text">
        <div class="kicker reveal" style="margin-bottom:.75rem">${T(L, "about.storyKicker")}</div>
        <h2 class="font-display reveal" style="font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.12">${T(L, "about.storyTitle")}</h2>
        <p class="reveal" style="margin-top:1.5rem;line-height:1.7;color:var(--ink-soft)">${T(L, "about.body1")}</p>
        <p class="reveal reveal-d1" style="margin-top:1rem;line-height:1.7;color:var(--ink-soft)">${T(L, "about.story1")}</p>
      </div>
    </div>
  </section>

  <section style="max-width:46rem;margin:0 auto;padding:3rem 1.25rem 1rem">
    <p class="reveal" style="font-size:1.05rem;line-height:1.7;color:var(--ink-soft)">${T(L, "about.story2")}</p>
    <p class="reveal reveal-d1" style="margin-top:1.5rem;font-size:1.05rem;line-height:1.7;color:var(--ink-soft)">${T(L, "about.body2")}</p>
  </section>

  <section class="container" style="padding:3rem 1.25rem 4rem">
    <figure class="reveal" style="margin:0">
      <blockquote class="font-display" style="font-size:clamp(1.6rem,3.5vw,2.4rem);line-height:1.35;max-width:46rem;margin:0 auto;text-align:center">&ldquo;${T(L, "about.quote")}&rdquo;</blockquote>
      <figcaption class="muted" style="text-align:center;margin-top:1.25rem;font-size:.9rem;letter-spacing:.02em">${T(L, "about.quoteAuthor")}</figcaption>
    </figure>
  </section>

  <section style="background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
    <div class="container about-values" style="padding:5rem 1.25rem">
      ${[1, 2, 3].map(i => `<div class="reveal reveal-d${i - 1}"><div class="kicker" style="margin-bottom:.75rem">0${i}</div><h3 class="font-display" style="font-size:1.3rem;margin-bottom:.6rem">${T(L, "about.values" + i + "Title")}</h3><p class="muted" style="line-height:1.65;font-size:.95rem">${T(L, "about.values" + i + "Body")}</p></div>`).join("")}
    </div>
  </section>

  <section class="container" style="padding:5rem 1.25rem;display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;text-align:center">
    <div class="reveal"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">≤99%</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat1")}</div></div>
    <div class="reveal reveal-d1"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">100%</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat2")}</div></div>
    <div class="reveal reveal-d2"><div class="font-display" style="font-size:clamp(2.5rem,5vw,3.5rem)">0</div><div class="muted" style="font-size:.8rem;margin-top:.5rem">${T(L, "about.stat3")}</div></div>
  </section>

  <section class="container" style="padding:1rem 1.25rem 6rem;text-align:center">
    <h2 class="font-display reveal" style="font-size:clamp(2rem,5vw,3rem);margin-bottom:2rem">${T(L, "story.title")}</h2>
    <a href="${P}/shop.html" class="btn btn-primary reveal reveal-d1">${T(L, "about.cta")}</a>
  </section>
</main>`;
  return shell(L, { page: "about", bodyPage: "about", current: "about", title: m.title, description: m.description, keywords: m.keywords, ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: INGREDIENTS (AIEO) ----------------------------------------- */
// Ingredient → photo slug (language-neutral; arrays are parallel across locales).
const INGREDIENT_SLUGS = ["lavender", "cucumber", "salicylic-acid", "glycerin", "betaine", "plum", "linden", "coco-glucoside"];
function ingImgPath(slug) { return path.join(ROOT, "assets", "img", "ingredients", slug + ".jpg"); }
function renderIngredients(L) {
  const ip = INGREDIENTS_PAGE[L] || INGREDIENTS_PAGE.en;
  const list = INGREDIENTS[L] || INGREDIENTS.en;
  const whatH = L === "de" ? "Was es ist" : L === "nl" ? "Wat het is" : "What it is";
  const whyH = L === "de" ? "Warum wir es verwenden" : L === "nl" ? "Waarom wij het gebruiken" : "Why we use it";
  const items = list.map((ing, i) => {
    const slug = INGREDIENT_SLUGS[i];
    const hasImg = slug && fs.existsSync(ingImgPath(slug));
    const media = hasImg ? `<div class="ing-card__media reveal">${pic("/assets/img/ingredients/" + slug + ".jpg", `alt="${escA(ing.name)}" loading="lazy" decoding="async"`, "(min-width:760px) 15rem, 100vw")}</div>` : "";
    return `<article class="ing-card${hasImg ? "" : " ing-card--noimg"}">
      ${media}
      <div class="ing-card__body reveal">
        <h2 class="font-display" style="font-size:1.5rem">${esc(ing.name)}</h2>
        <div class="muted" style="font-size:.8rem;letter-spacing:.04em;margin:.25rem 0 .75rem">INCI: ${esc(ing.inci)}</div>
        <p style="margin:0 0 .5rem;color:var(--ink-soft)"><strong style="color:var(--ink)">${whatH}:</strong> ${esc(ing.what)}</p>
        <p style="margin:0;color:var(--ink-soft)"><strong style="color:var(--ink)">${whyH}:</strong> ${esc(ing.why)}</p>
      </div>
    </article>`;
  }).join("");
  const body = `<main class="page-main"><div class="container" style="max-width:60rem;padding-bottom:6rem">
  <div class="kicker" style="margin-bottom:.5rem">${T(L, "cat.kicker")}</div>
  <h1 class="font-display" style="font-size:clamp(2.4rem,6vw,3.6rem)">${esc(ip.title)}</h1>
  <p style="margin-top:1rem;font-size:1.1rem;color:var(--ink-soft);max-width:46rem">${esc(ip.lead)}</p>
  <p style="margin-top:1rem;color:var(--ink-soft);line-height:1.7;max-width:46rem">${esc(ip.intro)}</p>
  <div class="ing-list" style="margin-top:2.5rem">${items}</div>
  <div style="margin-top:3rem"><a href="${url("shop", L)}" class="btn btn-primary">${T(L, "best.viewall")}</a></div>
</div></main>`;
  const meta = { en: "Vegan, ECOCERT COSMOS-certified ingredients — what's in Elira Living skincare & haircare and why.",
    de: "Vegane, ECOCERT COSMOS-zertifizierte Inhaltsstoffe — was in der Elira Living Haut- & Haarpflege steckt und warum.",
    nl: "Veganistische, ECOCERT COSMOS-gecertificeerde ingrediënten — wat er in Elira Living huid- & haarverzorging zit en waarom." };
  return shell(L, { page: "ingredients", bodyPage: "legal", current: "ingredients", title: ip.title + " | Elira Living", description: meta[L], keywords: "ingredients, INCI, natural skincare ingredients, vegan, ECOCERT COSMOS, salicylic acid, lavender water, Elira Living", ld: [ldOrg(), ldWebsite(L)] }, body);
}

/* ---- PAGE: CERTIFICATIONS --------------------------------------------- */
const CERT_HERO = {
  en: { kicker: "Certified clean", h1: "Every claim, independently verified.", lead: "We don't ask you to take our word for it. Every Elira Living product is audited and certified by recognised third-party bodies — because real transparency means showing your work. Below is a full account of every certification we carry, who granted it, and exactly what it means for you.", certifiedBy: "Independently certified by", badgesSub: "COSMOS Organic & COSMOS Natural · audited by ECOCERT Greenlife" },
  de: { kicker: "Zertifiziert sauber", h1: "Jede Aussage, unabhängig geprüft.", lead: "Wir bitten Sie nicht, uns auf's Wort zu glauben. Jedes Elira-Living-Produkt wird von anerkannten unabhängigen Stellen geprüft und zertifiziert — weil echte Transparenz bedeutet, die eigene Arbeit offenzulegen. Hier finden Sie eine vollständige Übersicht aller unserer Zertifizierungen: wer sie vergeben hat und was das konkret für Sie bedeutet.", certifiedBy: "Unabhängig zertifiziert durch", badgesSub: "COSMOS Organic & COSMOS Natural · geprüft von ECOCERT Greenlife" },
  nl: { kicker: "Gecertificeerd schoon", h1: "Elke claim, onafhankelijk geverifieerd.", lead: "We vragen je niet ons op ons woord te geloven. Elk Elira Living-product wordt gecontroleerd en gecertificeerd door erkende onafhankelijke instanties — want echte transparantie betekent je werk laten zien. Hieronder vind je een volledig overzicht van elke certificering die wij dragen, wie deze heeft verleend en wat dat precies voor jou betekent.", certifiedBy: "Onafhankelijk gecertificeerd door", badgesSub: "COSMOS Organic & COSMOS Natural · gecontroleerd door ECOCERT Greenlife" },
  fi: { kicker: "Sertifioidusti puhdas", h1: "Jokainen väite, riippumattomasti vahvistettu.", lead: "Emme pyydä sinua uskomaan pelkkää sanaamme. Jokainen Elira Living -tuote on auditoitu ja sertifioitu tunnustettujen riippumattomien tahojen toimesta — sillä aito läpinäkyvyys tarkoittaa työn näyttämistä. Alla on täydellinen selvitys jokaisesta kantamastamme sertifikaatista: kuka sen myönsi ja mitä se tarkalleen tarkoittaa sinulle.", certifiedBy: "Riippumattomasti sertifioinut", badgesSub: "COSMOS Organic & COSMOS Natural · auditoinut ECOCERT Greenlife" },
};
const CERT_SEC = {
  en: { prod: "Product certifications", prodLead: "Verified on every product we make.", mfg: "Manufacturing certifications", mfgLead: "How and where your products are made.", by: "Issued by", prohibits: "Prohibited by this standard", applies: "Applies to", cta: "Shop certified →" },
  de: { prod: "Produktzertifizierungen", prodLead: "Auf jedem unserer Produkte geprüft.", mfg: "Herstellungszertifizierungen", mfgLead: "Wie und wo Ihre Produkte hergestellt werden.", by: "Ausgestellt von", prohibits: "Durch diesen Standard verboten", applies: "Gilt für", cta: "Zertifiziert einkaufen →" },
  nl: { prod: "Productcertificeringen", prodLead: "Geverifieerd op elk product dat we maken.", mfg: "Productiecertificeringen", mfgLead: "Hoe en waar jouw producten worden gemaakt.", by: "Uitgegeven door", prohibits: "Verboden door deze standaard", applies: "Van toepassing op", cta: "Gecertificeerd winkelen →" },
  fi: { prod: "Tuotesertifikaatit", prodLead: "Vahvistettu jokaisessa valmistamassamme tuotteessa.", mfg: "Valmistuksen sertifikaatit", mfgLead: "Miten ja missä tuotteesi valmistetaan.", by: "Myöntäjä", prohibits: "Tämän standardin kieltämät", applies: "Koskee", cta: "Osta sertifioituja →" },
};
const PROD_CERTS = [
  {
    num: "01", badge: "COSMOS ORGANIC",
    name: { en: "ECOCERT COSMOS Organic", de: "ECOCERT COSMOS Organic", nl: "ECOCERT COSMOS Organic" },
    body: "ECOCERT · COSMOS-standard AISBL",
    desc: {
      en: "The most rigorous tier of natural cosmetics certification. A minimum of 95% natural-origin ingredients is required across the formula. Additionally, at least 20% of the total product — and 95% of all plant-derived ingredients — must originate from certified organic farming. Every certified batch is independently audited on-site by ECOCERT inspectors.",
      de: "Die strengste Stufe der Naturkosmetik-Zertifizierung. Mindestens 95 % der Zutaten müssen natürlichen Ursprungs sein. Zusätzlich müssen mindestens 20 % des Gesamtprodukts — und 95 % aller pflanzlichen Zutaten — aus zertifiziertem ökologischem Anbau stammen. Jede zertifizierte Charge wird von ECOCERT-Inspektoren unabhängig vor Ort kontrolliert.",
      nl: "De meest rigoureuze categorie van certificering voor naturele cosmetica. Minimaal 95% van de ingrediënten moet van natuurlijke oorsprong zijn. Bovendien moet minimaal 20% van het totale product — en 95% van alle plantaardige ingrediënten — afkomstig zijn van gecertificeerde biologische landbouw. Elke gecertificeerde batch wordt ter plaatse onafhankelijk gecontroleerd door ECOCERT-inspecteurs.",
      fi: "Tiukin luonnonkosmetiikan sertifiointitaso. Vähintään 95 % ainesosista on oltava luonnollista alkuperää. Lisäksi vähintään 20 % koko tuotteesta — ja 95 % kaikista kasviperäisistä ainesosista — on oltava peräisin sertifioidusta luomuviljelystä. Jokainen sertifioitu erä tarkastetaan riippumattomasti paikan päällä ECOCERT-tarkastajien toimesta.",
    },
    prohibits: {
      en: ["Synthetic fragrances & colorants", "GMOs & nano-materials", "Mineral oils & silicones", "Parabens & phthalates"],
      de: ["Synthetische Duftstoffe & Farbstoffe", "GVO & Nanomaterialien", "Mineralöle & Silikone", "Parabene & Phthalate"],
      nl: ["Synthetische geurstoffen & kleurstoffen", "GGO's & nanomaterialen", "Minerale oliën & siliconen", "Parabenen & ftalaten"],
      fi: ["Synteettiset hajusteet & väriaineet", "GMO:t & nanomateriaalit", "Mineraaliöljyt & silikonit", "Parabeenit & ftalaatit"],
    },
    products: { en: "Sensitive Moisturizing Cream", de: "Sensitive Feuchtigkeitscreme", nl: "Sensitieve Hydraterende Crème", fi: "Herkän ihon kosteusvoide" },
  },
  {
    num: "02", badge: "COSMOS NATURAL",
    name: { en: "ECOCERT COSMOS Natural", de: "ECOCERT COSMOS Natural", nl: "ECOCERT COSMOS Natural" },
    body: "ECOCERT · COSMOS-standard AISBL",
    desc: {
      en: "Certified natural cosmetics standard requiring a minimum of 95% natural-origin ingredients. Synthetic fragrances, synthetic colorants, GMOs, mineral oils, and nano-materials are all explicitly prohibited. Full ingredient transparency is mandatory — every ingredient on the label has been audited and approved by ECOCERT.",
      de: "Zertifizierter Standard für Naturkosmetik mit mindestens 95 % Inhaltsstoffen natürlichen Ursprungs. Synthetische Duftstoffe, Farbstoffe, GVO, Mineralöle und Nanomaterialien sind ausdrücklich verboten. Vollständige Inhaltsstofftransparenz ist verpflichtend — jeder Inhaltsstoff auf dem Etikett wurde von ECOCERT geprüft und genehmigt.",
      nl: "Gecertificeerde standaard voor naturele cosmetica met minimaal 95% ingrediënten van natuurlijke oorsprong. Synthetische geurstoffen, kleurstoffen, GGO's, minerale oliën en nanomaterialen zijn allemaal uitdrukkelijk verboden. Volledige transparantie over ingrediënten is verplicht — elk ingrediënt op het etiket is gecontroleerd en goedgekeurd door ECOCERT.",
      fi: "Sertifioitu luonnonkosmetiikan standardi, joka edellyttää vähintään 95 % luonnollista alkuperää olevia ainesosia. Synteettiset hajusteet, väriaineet, GMO:t, mineraaliöljyt ja nanomateriaalit ovat nimenomaisesti kiellettyjä. Täysi ainesosien läpinäkyvyys on pakollista — jokainen etiketin ainesosa on ECOCERTin tarkastama ja hyväksymä.",
    },
    prohibits: {
      en: ["Synthetic fragrances & colorants", "GMOs & nano-materials", "Mineral oils & silicones", "Parabens & phthalates"],
      de: ["Synthetische Duftstoffe & Farbstoffe", "GVO & Nanomaterialien", "Mineralöle & Silikone", "Parabene & Phthalate"],
      nl: ["Synthetische geurstoffen & kleurstoffen", "GGO's & nanomaterialen", "Minerale oliën & siliconen", "Parabenen & ftalaten"],
      fi: ["Synteettiset hajusteet & väriaineet", "GMO:t & nanomateriaalit", "Mineraaliöljyt & silikonit", "Parabeenit & ftalaatit"],
    },
    products: { en: "Radiant Glow Facial Cleanser · Purifying Toner · Sensitive Scalp Shampoo · Retinol Alternative Serum · Peptide Anti-Aging Serum", de: "Radiant Glow Gesichtsreiniger · Klärendes Gesichtswasser · Sensitive Kopfhaut Shampoo · Retinol Alternative Serum · Peptid Anti-Aging Serum", nl: "Radiant Glow Gezichtsreiniger · Zuiverende Toner · Shampoo Gevoelige Hoofdhuid · Retinol Alternatief Serum · Peptide Anti-Aging Serum", fi: "Radiant Glow -kasvojenpuhdistusaine · Puhdistava kasvovesi · Herkän hiuspohjan shampoo · Retinolin vaihtoehto -seerumi · Peptidi anti-age -seerumi" },
  },
  {
    num: "03", badge: "100% VEGAN",
    name: { en: "100% Vegan", de: "100 % Vegan", nl: "100% Veganistisch", fi: "100 % vegaaninen" },
    body: { en: "Verified at formulation level", de: "Auf Formulierungsebene geprüft", nl: "Geverifieerd op formuleringssniveau", fi: "Vahvistettu formulaatiotasolla" },
    desc: {
      en: "Every Elira Living formula contains zero animal-derived ingredients — no beeswax, no lanolin, no collagen, no carmine, no honey, no keratin. Verified at the ingredient level by ECOCERT as part of the COSMOS certification process, with every raw material cross-checked against the COSMOS approved ingredient list.",
      de: "Jede Elira-Living-Formel enthält keinerlei tierische Zutaten — kein Bienenwachs, kein Lanolin, kein Kollagen, kein Karmin, keinen Honig, kein Keratin. Auf Rohstoffebene von ECOCERT im Rahmen der COSMOS-Zertifizierung geprüft, mit Überprüfung jedes Rohstoffs anhand der zugelassenen COSMOS-Inhaltsstoffliste.",
      nl: "Elke Elira Living-formule bevat nul ingrediënten van dierlijke oorsprong — geen bijenwas, geen lanoline, geen collageen, geen karmijn, geen honing, geen keratine. Geverifieerd op ingrediëntenniveau door ECOCERT als onderdeel van de COSMOS-certificering, met controle van elk grondstofelement aan de hand van de goedgekeurde COSMOS-ingrediëntenlijst.",
      fi: "Jokainen Elira Living -formulaatio ei sisällä lainkaan eläinperäisiä ainesosia — ei mehiläisvahaa, ei lanoliinia, ei kollageenia, ei karmiinia, ei hunajaa, ei keratiinia. ECOCERT on vahvistanut tämän ainesosatasolla osana COSMOS-sertifiointiprosessia, ja jokainen raaka-aine on ristiintarkastettu COSMOSin hyväksymää ainesosalistaa vasten.",
    },
    prohibits: null,
    products: { en: "All products", de: "Alle Produkte", nl: "Alle producten", fi: "Kaikki tuotteet" },
  },
  {
    num: "04", badge: "CRUELTY-FREE",
    name: { en: "Cruelty-free", de: "Tierversuchsfrei", nl: "Cruelty-free", fi: "Eläinkokeeton" },
    body: { en: "No animal testing, at any stage", de: "Keine Tierversuche — auf keiner Stufe", nl: "Geen dierproeven, in geen enkele fase", fi: "Ei eläinkokeita, missään vaiheessa" },
    desc: {
      en: "No animal testing is conducted at any stage of development or production — not on ingredients, not on finished products, and not by any third party acting on our behalf. This applies across the entire supply chain, from raw material sourcing through manufacturing to final packaging.",
      de: "Auf keiner Stufe der Entwicklung oder Herstellung werden Tierversuche durchgeführt — weder an Inhaltsstoffen noch am fertigen Produkt, noch durch Dritte in unserem Auftrag. Dies gilt für die gesamte Lieferkette, von der Rohstoffbeschaffung über die Herstellung bis zur finalen Verpackung.",
      nl: "Er worden geen dierproeven uitgevoerd in welke fase van ontwikkeling of productie dan ook — niet op ingrediënten, niet op eindproducten, en niet door derden die namens ons handelen. Dit geldt voor de gehele toeleveringsketen, van inkoop van grondstoffen via productie tot eindverpakking.",
      fi: "Eläinkokeita ei tehdä missään kehitys- tai tuotantovaiheessa — ei ainesosille, ei valmiille tuotteille eikä kenenkään puolestamme toimivan kolmannen osapuolen toimesta. Tämä koskee koko toimitusketjua raaka-aineiden hankinnasta valmistuksen kautta lopulliseen pakkaukseen.",
    },
    prohibits: null,
    products: { en: "All products", de: "Alle Produkte", nl: "Alle producten", fi: "Kaikki tuotteet" },
  },
  {
    num: "05", badge: "DERM. TESTED",
    name: { en: "Dermatologically tested", de: "Dermatologisch getestet", nl: "Dermatologisch getest", fi: "Dermatologisesti testattu" },
    body: { en: "Tested under dermatological supervision", de: "Unter dermatologischer Aufsicht getestet", nl: "Getest onder dermatologisch toezicht", fi: "Testattu dermatologisessa valvonnassa" },
    desc: {
      en: "The Sensitive Scalp Shampoo is dermatologically tested — assessed under dermatological supervision for suitability on sensitive, easily-irritated scalps. It is the one product in our range to carry this additional claim, reflecting its formulation for reactive, easily-bothered skin.",
      de: "Das Sensitive Kopfhaut Shampoo ist dermatologisch getestet — unter dermatologischer Aufsicht auf Verträglichkeit für empfindliche, leicht reizbare Kopfhaut geprüft. Es ist das einzige Produkt unseres Sortiments mit dieser zusätzlichen Auslobung, passend zu seiner Rezeptur für reaktive Haut.",
      nl: "De Shampoo Gevoelige Hoofdhuid is dermatologisch getest — beoordeeld onder dermatologisch toezicht op geschiktheid voor de gevoelige, snel geïrriteerde hoofdhuid. Het is het enige product in ons assortiment met deze aanvullende claim, passend bij de formule voor de reactieve huid.",
      fi: "Herkän hiuspohjan shampoo on dermatologisesti testattu — arvioitu dermatologisessa valvonnassa soveltuvuuden osalta herkälle, helposti ärsyyntyvälle hiuspohjalle. Se on valikoimamme ainoa tuote, joka kantaa tätä lisämerkintää, mikä heijastaa sen koostumusta reaktiiviselle, helposti ärtyvälle iholle.",
    },
    prohibits: null,
    products: { en: "Sensitive Scalp Shampoo", de: "Sensitive Kopfhaut Shampoo", nl: "Shampoo Gevoelige Hoofdhuid", fi: "Herkän hiuspohjan shampoo" },
  },
];
const MFG_CERTS = [
  {
    num: "06", badge: "GMP",
    name: { en: "GMP Certified Manufacturing", de: "GMP-zertifizierte Herstellung", nl: "GMP-gecertificeerde productie", fi: "GMP-sertifioitu valmistus" },
    body: "ISO 22716 · Good Manufacturing Practices for cosmetics",
    desc: {
      en: "Our EU manufacturing partner holds ISO 22716 Good Manufacturing Practice certification — the international standard governing facility hygiene, quality control systems, ingredient traceability, production documentation, and staff training. Every batch produced for Elira Living is made under audited conditions that meet or exceed this standard.",
      de: "Unser EU-Herstellungspartner hält die Zertifizierung nach ISO 22716 Good Manufacturing Practice — dem internationalen Standard für Anlagenhygiene, Qualitätskontrollsysteme, Rückverfolgbarkeit von Inhaltsstoffen, Produktionsdokumentation und Mitarbeiterschulung. Jede für Elira Living produzierte Charge wird unter geprüften Bedingungen hergestellt.",
      nl: "Onze EU-productiepartner beschikt over ISO 22716 Good Manufacturing Practice-certificering — de internationale standaard voor faciliteitshygiëne, kwaliteitscontrolesystemen, traceerbaarheid van ingrediënten, productiedocumentatie en personeelstraining. Elke voor Elira Living geproduceerde batch wordt geproduceerd onder gecontroleerde omstandigheden.",
      fi: "EU-valmistuskumppanillamme on ISO 22716 Good Manufacturing Practice -sertifiointi — kansainvälinen standardi, joka säätelee tilojen hygieniaa, laadunvalvontajärjestelmiä, ainesosien jäljitettävyyttä, tuotantodokumentaatiota ja henkilöstön koulutusta. Jokainen Elira Livingille valmistettu erä tehdään auditoiduissa olosuhteissa, jotka täyttävät tämän standardin tai ylittävät sen.",
    },
    prohibits: null,
    products: null,
  },
  {
    num: "07", badge: "B CORP",
    name: { en: "B Corp Certified Partner", de: "B-Corp-zertifizierter Partner", nl: "B Corp gecertificeerde partner", fi: "B Corp -sertifioitu kumppani" },
    body: "B Lab · B Corporation Certification",
    desc: {
      en: "Our EU manufacturing partner is certified by B Lab — the global non-profit that independently verifies companies against rigorous standards for social impact, environmental responsibility, and governance. B Corp certification requires companies to score across workers, community, environment, and customers, and undergo on-site verification every three years.",
      de: "Unser EU-Herstellungspartner ist von B Lab zertifiziert — der globalen Non-Profit-Organisation, die Unternehmen unabhängig nach strengen Standards für soziale Wirkung, ökologische Verantwortung und Governance prüft. Die B-Corp-Zertifizierung erfordert Nachweise in den Bereichen Mitarbeiter, Gemeinschaft, Umwelt und Kunden sowie alle drei Jahre eine Vor-Ort-Prüfung.",
      nl: "Onze EU-productiepartner is gecertificeerd door B Lab — de wereldwijde non-profitorganisatie die bedrijven onafhankelijk verifieert aan de hand van strenge normen voor sociale impact, milieubewustzijn en governance. B Corp-certificering vereist scores op het gebied van werknemers, gemeenschap, milieu en klanten, en een verificatie ter plaatse elke drie jaar.",
      fi: "EU-valmistuskumppanimme on B Labin sertifioima — maailmanlaajuisen voittoa tavoittelemattoman järjestön, joka arvioi yrityksiä riippumattomasti tiukoilla sosiaalisen vaikuttavuuden, ympäristövastuun ja hallinnon standardeilla. B Corp -sertifiointi edellyttää yrityksiltä pisteytystä työntekijöiden, yhteisön, ympäristön ja asiakkaiden osalta sekä paikan päällä tehtävää tarkastusta joka kolmas vuosi.",
    },
    prohibits: null,
    products: null,
  },
  {
    num: "08", badge: "BUREAU VERITAS",
    name: { en: "Bureau Veritas Verified", de: "Bureau Veritas geprüft", nl: "Bureau Veritas geverifieerd", fi: "Bureau Veritas -vahvistettu" },
    body: "Bureau Veritas · Independent Quality & Safety Assurance",
    desc: {
      en: "Independently verified by Bureau Veritas — one of the world's leading testing, inspection, and certification organisations, active in over 140 countries. Their verification of our manufacturing partner covers quality management systems, safety standards, and regulatory compliance across facilities and production processes.",
      de: "Unabhängig geprüft von Bureau Veritas — einer der führenden Prüf-, Inspektions- und Zertifizierungsorganisationen der Welt, tätig in über 140 Ländern. Ihre Überprüfung unseres Herstellungspartners umfasst Qualitätsmanagementsysteme, Sicherheitsstandards und regulatorische Konformität.",
      nl: "Onafhankelijk geverifieerd door Bureau Veritas — een van 's werelds toonaangevende test-, inspectie- en certificeringsorganisaties, actief in meer dan 140 landen. Hun verificatie van onze productiepartner omvat kwaliteitsmanagementsystemen, veiligheidsnormen en naleving van regelgeving.",
      fi: "Riippumattomasti vahvistanut Bureau Veritas — yksi maailman johtavista testaus-, tarkastus- ja sertifiointiorganisaatioista, joka toimii yli 140 maassa. Heidän valmistuskumppaniamme koskeva vahvistuksensa kattaa laadunhallintajärjestelmät, turvallisuusstandardit ja säädöstenmukaisuuden tiloissa ja tuotantoprosesseissa.",
    },
    prohibits: null,
    products: null,
  },
];

function certCard(L, c, isMfg) {
  const sec = CERT_SEC[L];
  const body = typeof c.body === "object" ? c.body[L] : c.body;
  const prohibitsList = c.prohibits
    ? `<div class="cert-card__prohibits"><div class="kicker" style="font-size:.6rem;margin-bottom:.5rem">${esc(sec.prohibits)}</div><ul>${c.prohibits[L].map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>`
    : "";
  const productsPill = c.products
    ? `<div class="cert-card__applies"><span class="kicker" style="font-size:.6rem">${esc(sec.applies)}:</span> <span>${esc(c.products[L])}</span></div>`
    : (isMfg ? `<div class="cert-card__applies"><span class="kicker" style="font-size:.6rem">${esc(sec.applies)}:</span> <span>${L === "de" ? "Alle Produkte" : L === "nl" ? "Alle producten" : "All products"}</span></div>` : "");
  return `<article class="cert-card reveal">
  <div class="cert-card__num">${c.num}</div>
  <div class="cert-card__badge">${esc(c.badge)}</div>
  <h3 class="cert-card__name font-display">${esc(c.name[L])}</h3>
  <div class="cert-card__body">${esc(body)}</div>
  <p class="cert-card__desc">${esc(c.desc[L])}</p>
  ${prohibitsList}
  ${productsPill}
</article>`;
}

// Big "certified by" lockup. Official artwork wins when present — drop files
// named ecocert.* / cosmos.* into assets/img/cert-logos/ to replace the SVGs.
function officialCertLogo(slug) {
  const dir = path.join(ROOT, "assets", "img", "cert-logos");
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find(n => n.toLowerCase().startsWith(slug));
  return f ? `/assets/img/cert-logos/${f}` : null;
}
function certLockupLogo(slug, alt, fallbackSvg) {
  const src = officialCertLogo(slug);
  return src
    ? `<img src="${src}" alt="${escA(alt)}" class="cert-lockup__img" loading="lazy" decoding="async">`
    : fallbackSvg;
}
const ECOCERT_SVG = `<svg class="cert-lockup__svg" viewBox="0 0 240 240" role="img" aria-label="ECOCERT Greenlife">
  <circle cx="120" cy="120" r="117" fill="#fbfaf5" stroke="#4c7a2c" stroke-width="2"/><circle cx="120" cy="120" r="105" fill="#4c7a2c"/>
  <path d="M120 58c-21 23-32 40-32 58a32 32 0 0 0 64 0c0-18-11-35-32-58Z" fill="#fbfaf5"/><path d="M120 92v54" stroke="#4c7a2c" stroke-width="3" stroke-linecap="round"/>
  <text x="120" y="188" text-anchor="middle" fill="#fbfaf5" font-family="'Helvetica Neue',Arial,sans-serif" font-size="30" font-weight="800" letter-spacing="2">ECOCERT</text></svg>`;
const COSMOS_SVG = `<svg class="cert-lockup__svg" viewBox="0 0 240 240" role="img" aria-label="COSMOS Organic and Natural certified">
  <circle cx="120" cy="120" r="117" fill="#fbfaf5" stroke="#2f6b3f" stroke-width="2"/><circle cx="120" cy="120" r="105" fill="#2f6b3f"/>
  <g fill="#fbfaf5"><circle cx="120" cy="66" r="4.5"/><circle cx="152" cy="80" r="3"/><circle cx="88" cy="80" r="3"/></g>
  <text x="120" y="130" text-anchor="middle" fill="#fbfaf5" font-family="'Helvetica Neue',Arial,sans-serif" font-size="33" font-weight="800" letter-spacing="2">COSMOS</text>
  <text x="120" y="159" text-anchor="middle" fill="#cfe3c4" font-family="Arial,sans-serif" font-size="15" font-weight="600" letter-spacing="5">ORGANIC</text>
  <text x="120" y="180" text-anchor="middle" fill="#cfe3c4" font-family="Arial,sans-serif" font-size="13" font-weight="500" letter-spacing="3">&amp; NATURAL</text></svg>`;

function renderCertifications(L) {
  const h = CERT_HERO[L];
  const sec = CERT_SEC[L];
  const prodCards = PROD_CERTS.map(c => certCard(L, c, false)).join("\n");
  const mfgCards = MFG_CERTS.map(c => certCard(L, c, true)).join("\n");
  const m = meta(L).certifications;
  const body = `<main class="page-main"><div class="container cert-page" style="padding-bottom:6rem">
  <div class="kicker" style="margin-bottom:.75rem">${esc(h.kicker)}</div>
  <h1 class="font-display reveal" style="font-size:clamp(2.4rem,6vw,3.6rem);max-width:22rem">${esc(h.h1)}</h1>
  <p class="reveal" style="margin-top:1.25rem;font-size:1.05rem;color:var(--ink-soft);max-width:48rem;line-height:1.75">${esc(h.lead)}</p>

  <div class="cert-lockup reveal">
    <span class="cert-lockup__cap">${esc(h.certifiedBy)}</span>
    <div class="cert-lockup__row">
      <div class="cert-lockup__item">${certLockupLogo("ecocert", "ECOCERT Greenlife", ECOCERT_SVG)}</div>
      <div class="cert-lockup__item">${certLockupLogo("cosmos", "COSMOS Organic and Natural", COSMOS_SVG)}</div>
    </div>
    <span class="cert-lockup__sub">${esc(h.badgesSub)}</span>
  </div>

  <div class="cert-section" style="margin-top:4.5rem">
    <h2 class="font-display cert-section__title">${esc(sec.prod)}</h2>
    <p class="cert-section__lead muted">${esc(sec.prodLead)}</p>
    <div class="cert-cards">${prodCards}</div>
  </div>

  <div class="cert-section" style="margin-top:5rem">
    <h2 class="font-display cert-section__title">${esc(sec.mfg)}</h2>
    <p class="cert-section__lead muted">${esc(sec.mfgLead)}</p>
    <div class="cert-cards cert-cards--mfg">${mfgCards}</div>
  </div>

  <div style="margin-top:4rem;text-align:center">
    <a href="${url("shop", L)}" class="btn btn-primary">${esc(sec.cta)}</a>
  </div>
</div></main>`;
  return shell(L, { page: "certifications", bodyPage: "legal", current: "certifications", title: m.title, description: m.description, keywords: m.keywords, ld: [ldOrg(), ldWebsite(L)] }, body);
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

// Safety net for the Finnish locale: ensure every language-keyed object carries
// an `fi` entry, falling back to English wherever a translation isn't filled in
// yet — so the build never half-renders while Finnish copy is added over time.
function backfillLang(node, seen) {
  seen = seen || new Set();
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (Object.prototype.hasOwnProperty.call(node, "en") && !Object.prototype.hasOwnProperty.call(node, "fi")) node.fi = node.en;
  for (const k of Object.keys(node)) backfillLang(node[k], seen);
}
[FAQ_H, USE_H, FREESHIP_H, TRUST, JOURNAL_H, PDP_REVIEWS_H, CERT_HERO, CERT_SEC, PROD_CERTS, MFG_CERTS,
 LEGAL, DISCLAIMER, USAGE, PRODUCT_FAQ, INGREDIENTS, INGREDIENTS_PAGE, BLOG_UI, REVIEWS, REVIEW_UI].forEach(o => backfillLang(o));
// Backfill any content keys missing from fi.js with the English value (keys, not
// whole sections — fi.js carries the real translations).
["ui", "features"].forEach(sec => { const en = CONTENT.en[sec] || {}, fi = CONTENT.fi[sec] || (CONTENT.fi[sec] = {}); for (const k in en) if (fi[k] == null) fi[k] = en[k]; });
for (const id in CONTENT.en.products) { if (!CONTENT.fi.products[id]) CONTENT.fi.products[id] = CONTENT.en.products[id]; }

function build() {
  let count = 0;
  LANGS.forEach(L => {
    clean(L);
    write(`${L}/index.html`, renderHome(L)); count++;
    write(`${L}/shop.html`, renderShop(L)); count++;
    write(`${L}/about.html`, renderAbout(L)); count++;
    write(`${L}/ingredients.html`, renderIngredients(L)); count++;
    write(`${L}/certifications.html`, renderCertifications(L)); count++;
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
      { page: "certifications", pr: "0.7" },
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
  // Standalone research / PR assets that live outside the generated /en/de/nl
  // tree (the clean() step never touches these). Single-language, no hreflang.
  const STATIC_EXTRAS = [
    { loc: "/research/sensitive-skin-statistics-2026.html", pr: "0.7", cf: "monthly" }
  ];
  STATIC_EXTRAS.forEach(it => {
    urls += `  <url>\n    <loc>${BASE + it.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n${it.cf ? `    <changefreq>${it.cf}</changefreq>\n` : ""}    <priority>${it.pr}</priority>\n  </url>\n`;
  });
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
