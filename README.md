# Elira Living — natural skincare & haircare storefront

A trilingual (**EN / DE / NL**), dark "nature-luxe" e-commerce site for **Elira Living**,
a Finnish small business (toiminimi) selling vegan, ECOCERT COSMOS–certified skincare
& haircare into **Germany & the Netherlands**. Static, generated, and SEO-first —
hosts free on GitHub Pages with real Stripe payments via a Cloudflare Worker.

---

## 🏗 Architecture (important)

The site is built by a **static site generator** so every page exists as real,
pre-rendered, localized HTML (best for SEO) while data stays DRY.

```
elira-living/
├── build.js                      ← generator: templates × languages → /en /de /nl
├── assets/
│   ├── data/catalog.js           ← ⭐ CENTRAL DATA: SKUs, prices, images, sizes, badges
│   │                                (language-agnostic — edit once, applies everywhere)
│   ├── content/
│   │   ├── en.js  de.js  nl.js    ← ⭐ LANGUAGE FILES: UI strings, product names,
│   │   │                            descriptions, ingredient notes, page copy & meta
│   ├── css/  app.css (dark system) · home.css (immersive homepage)
│   ├── js/   app.js (cart, filters, language switch, checkout, animations)
│   └── img/  optimized product photos + og-image
├── en/  de/  nl/                  ← GENERATED static pages (do not edit by hand)
│   ├── index.html  shop.html  about.html  cart.html
│   ├── products/<sku>.html
│   └── impressum/privacy/terms/withdrawal/success/cancel .html
├── index.html                    ← root: redirects to /en, /de or /nl (browser language)
├── sitemap.xml                   ← GENERATED (all langs, hreflang alternates)
├── robots.txt  .nojekyll
└── checkout-worker/              ← Stripe Cloudflare Worker (worker.js, wrangler.toml)
```

### The golden rule
- **Prices, images, SKUs** → edit **`assets/data/catalog.js`** only. One change updates
  EN, DE and NL automatically. (Mirror price changes in `checkout-worker/worker.js` —
  the server re-prices for security.)
- **Any text / translation** → edit **`assets/content/<lang>.js`**.
- Then **rebuild**:

```bash
node build.js
```

This regenerates `/en /de /nl` and `sitemap.xml`. Never hand-edit files inside
`en/`, `de/`, `nl/` — they're overwritten on every build.

---

## 🌍 SEO

Every generated page has, per language:
- localized `<title>`, `<meta description>`, `<meta keywords>`, `<html lang>`
- `rel="canonical"` + **hreflang** alternates (en/de/nl/x-default)
- Open Graph + Twitter Card (with a 1200×630 share image)
- **JSON-LD**: `Organization`, `WebSite`, and on product pages `Product`
  (name, SKU, price, availability, brand) + `BreadcrumbList`
- `sitemap.xml` lists all language URLs with hreflang; `robots.txt` points to it

Because content is pre-rendered (not JS-injected), search engines and social
scrapers see fully-localized HTML — the proper way to do multilingual SEO.

---

## 🚀 Run locally

Static — serve the folder root:

```bash
python -m http.server 8137
# open http://localhost:8137  → redirects to /en/ (or your browser language)
```

## ☁️ Deploy (GitHub Pages → eliraliving.com)

1. Push the repo. Enable **Settings → Pages → Deploy from branch (main / root)**.
2. The root `index.html` redirects visitors to their language folder.
3. Absolute `/assets/...` paths assume the site is served at the **domain root**
   (custom domain `eliraliving.com` or a user/org `*.github.io` site). For a
   project page served under a subpath, paths would need a prefix.

---

## 💳 Payments (Stripe via Cloudflare Worker)

Unchanged and live. The cart `Checkout` button POSTs to the Worker
(`elira-checkout.elira-living.workers.dev`), which creates a Stripe Checkout Session
using its own server-side price map. After any price change:

```bash
cd checkout-worker
# update the PRICES map to match catalog.js, then:
npx wrangler deploy
```

Lock the Worker to your domain once live: `npx wrangler secret put ALLOW_ORIGIN`
→ `https://eliraliving.com`.

---

## ✅ Status & remaining content tasks

- ✅ Trilingual SSG, dark nature-luxe theme, immersive scroll homepage (GSAP + Lenis)
- ✅ 4 products with central catalog + per-language content, real photos
- ✅ Full SEO (meta, hreflang, JSON-LD, sitemap), legal pages with real business data
- ✅ Cart, drawer, live Stripe checkout, language switching across /en /de /nl

**To finish before launch:**
- **Legal pages** are currently English (with localized titles). German & Dutch
  legally-binding translations should be added to `content/<lang>.js` / the legal
  templates in `build.js` and reviewed by a professional.
- **Product galleries** — only a primary photo per product is wired; add more angles
  to `catalog.js → images[]` (and extend the product template) when ready.
- Confirm **EU distance-selling VAT** thresholds with a Finnish tax adviser as sales grow.

*Vegan-friendly pixels only. 🌱*
