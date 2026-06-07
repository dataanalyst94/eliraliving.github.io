# Elira Living — Cosmetics for every face

A production-grade, editorial-minimal **e-commerce storefront** for a unisex
(men's + women's) cosmetics brand selling in **Germany & the Netherlands**.
Built as a fast, dependency-light static site so it hosts **free on GitHub Pages**,
with **real Stripe payments** wired in.

> Aesthetic: warm ivory paper · near-black ink · terracotta accent ·
> Bodoni Moda × Jost · trilingual **DE / NL / EN** · EUR.

---

## ✨ What's included

- **Homepage** — animated hero, brand marquee, category grid, bestsellers,
  editorial story, value pillars, newsletter.
- **Shop** (`shop.html`) — live filtering by person (women/men/unisex) and
  category, plus sorting. Deep-linkable: `shop.html?gender=men&category=skin`.
- **Product page** (`product.html?id=…`) — gallery, shade/size selector with
  live price, quantity, add-to-cart, buy-now, ingredients & shipping accordions,
  related products.
- **Cart** — slide-out drawer on every page **and** a full `cart.html`, with a
  free-shipping progress bar (€39 threshold), quantities, and totals.
- **Stripe checkout** — two modes (see below). `success.html` / `cancel.html`
  return pages included.
- **Trilingual i18n** — DE/NL/EN with auto-detection, persisted choice, and
  locale-aware € formatting (`Intl.NumberFormat`).
- **Accessible & responsive** — keyboard nav, focus rings, `prefers-reduced-motion`,
  44px touch targets, alt text, semantic landmarks. Tested at 375 / 768 / 1024 / 1440.
- **No broken images** — every product falls back to an on-brand generated SVG
  tile if a photo fails to load (so it looks intentional even offline).

## 🗂 Structure

```
elira-living/
├── index.html  shop.html  product.html  cart.html  about.html
├── success.html  cancel.html
├── assets/
│   ├── css/styles.css        ← design tokens + animations
│   └── js/
│       ├── i18n.js           ← DE/NL/EN dictionary + € formatting
│       ├── products.js       ← product catalogue (edit me)
│       ├── cart.js           ← cart engine (localStorage)
│       ├── stripe.js         ← checkout config (edit me)
│       └── main.js           ← app shell, animations, page logic
├── checkout-worker/          ← optional free Stripe serverless endpoint
│   ├── worker.js  wrangler.toml
├── .nojekyll  robots.txt  README.md
```

---

## 🚀 Run locally

It's static — just serve the folder:

```bash
# Python (already installed on this machine)
python -m http.server 8080
# → open http://localhost:8080
```

(Opening `index.html` via `file://` mostly works, but a local server is
recommended so query-string routing and fetch behave normally.)

---

## 🌍 Deploy free on GitHub Pages

1. Create a GitHub repo and push the contents of `elira-living/` to it.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick `main` / root.
3. Your site goes live at `https://<user>.github.io/<repo>/`.
   The included `.nojekyll` ensures all assets are served correctly.

> Custom domain (e.g. `neroli.eu`)? Add it under Settings → Pages and point a
> CNAME at GitHub. Recommended for a real brand + cleaner Stripe URLs.

---

## 💳 Going live with Stripe

GitHub Pages is **static** — it can't safely hold your Stripe *secret* key.
Two supported paths, both keep the site free on Pages:

### Mode 1 — Payment Links (zero backend, fastest)
Best to launch *today*; single-product checkout.
1. In the Stripe Dashboard create a **Payment Link** for each product.
2. Paste each link into `assets/js/products.js` → `paymentLink: "https://buy.stripe.com/…"`.
3. In `assets/js/stripe.js` set `mode: "payment_links"`.
4. "Buy now" on a product redirects straight to Stripe's hosted, PCI-compliant page.

### Mode 2 — Combined cart checkout (recommended) ⭐
One Stripe Checkout Session for the whole cart, via a **free Cloudflare Worker**.
Prices are re-validated server-side (no tampering). Site stays on Pages.

```bash
cd checkout-worker
npm i -g wrangler          # one-time
wrangler login
wrangler deploy
wrangler secret put STRIPE_SECRET_KEY     # paste your sk_live_… (or sk_test_…)
wrangler secret put ALLOW_ORIGIN          # optional: https://<user>.github.io
```

Then in `assets/js/stripe.js`:
```js
mode: "checkout_session",
checkoutEndpoint: "https://elira-checkout.<you>.workers.dev"
```

> Prefer Vercel/Netlify Functions or Supabase Edge Functions? The same request
> contract works — POST `{ items, locale, successUrl, cancelUrl }`, return
> `{ url }`. Port `worker.js` accordingly.

**Test cards:** use `4242 4242 4242 4242`, any future expiry/CVC, in Stripe
*test mode* before switching to live keys. Enable iDEAL, Klarna, SEPA and cards
in **Dashboard → Settings → Payment methods** (great for DE & NL).

> ⚠️ Until you configure Stripe, checkout runs in a friendly **demo mode** and
> shows a toast instead of charging.

---

## 🛠 Customising

| Want to… | Edit |
|---|---|
| Add/replace products, prices, shades | `assets/js/products.js` (+ mirror prices in `checkout-worker/worker.js`) |
| Use your own photos | Drop files in `assets/img/` and set each product's `img` |
| Change colours / type | CSS variables at the top of `assets/css/styles.css` |
| Edit translations | `assets/js/i18n.js` |
| Free-shipping threshold | `FREE_SHIPPING_THRESHOLD` in `cart.js` **and** `worker.js` |

### Product images
The build ships with Unsplash placeholders + an automatic on-brand SVG fallback.
For a real store, replace them with your own product photography (ideally 4:5,
WebP, ~900px) in `assets/img/` for best quality and licensing.

### Note on Tailwind
This uses the Tailwind **Play CDN** for a zero-build workflow (ideal for quick
Pages hosting). For a fully optimised production bundle, compile Tailwind with
the CLI and drop the CDN `<script>` — see https://tailwindcss.com/docs/installation.

---

## ♿ Compliance reminders for DE/NL

A real EU shop needs: **Impressum**, **Datenschutz/Privacy (GDPR)**, **AGB/Terms**,
**Widerruf/right-of-withdrawal**, a **cookie/consent** banner if you add analytics,
and clear VAT-inclusive pricing. Footer links are stubbed (`#`) — wire them to
your legal pages before launch.

---

*Built with the ui-ux-pro-max design system. Vegan-friendly pixels only. 🌱*
