# Elira Living — Tracking & Analytics

**Status: built, wired with your real IDs, and verified firing end-to-end.**

> ⚖️ **GDPR / EU — READ THIS.** You sell into DE & NL, so marketing pixels legally need
> **consent before they fire**. The site ships with **Google Consent Mode v2** (default
> *denied*) and only loads Meta/TikTok **after** ad consent. You MUST add a cookie-consent
> banner (a CMP: Cookiebot, Usercentrics, CookieYes, Iubenda…) and call
> `EliraConsent.update({analytics:true, ads:true})` when the visitor accepts (and
> `{analytics:false, ads:false}` if they decline). On `localhost` consent is auto-granted
> so you can test. **Do not run ads to EU traffic until the banner is live.**

---

## Your IDs (already installed)

All of these are in **`assets/data/analytics-config.js`** and baked into every page (`node build.js`):

| Platform | ID | Status |
|---|---|---|
| Google Tag Manager | `GTM-NGL5C9TL` | ✅ loads on every page |
| GA4 | `G-TCKTDT6E7T` | ✅ fires (direct) |
| Meta Pixel | `2382778145481273` | ✅ fires (direct, after consent) |
| TikTok Pixel | `D8JB7MJC77U2SBB696UG` | ✅ fires (direct, after consent) |
| Google Ads | `AW-18223383471` / label `RwObCOePgrscEK-Hy_FD` | ✅ purchase conversion fires |

### How it's wired (important)
Configuring tags *inside* the GTM web UI can only be done in your GTM account, so to make
tracking **work immediately** each platform fires **directly from the site** (`fire: "direct"`
in the config). **GTM still loads** on every page for future management.

If you later build a platform's tags inside GTM, flip that platform to `"gtm"` in
`analytics-config.js` → `fire` and run `node build.js`. That stops the site firing it
directly so you don't double-count. The dataLayer pushes happen either way, so your GTM
tags will have everything they need.

---

## The events (verified)

| Funnel step | dataLayer `event` | GA4 | Meta | TikTok | Google Ads |
|---|---|---|---|---|---|
| Product view | `view_item` | view_item | ViewContent | ViewContent | — |
| Add to cart | `add_to_cart` | add_to_cart | AddToCart | AddToCart | — |
| Begin checkout | `begin_checkout` | begin_checkout | InitiateCheckout | InitiateCheckout | — |
| Purchase | `purchase` | purchase | Purchase | CompletePayment | ✅ conversion |

Every event carries **value + currency (EUR) + items** (SKU, name, category, price, qty) and a
shared **`event_id`**. For Purchase the `event_id` = the **Stripe session id**, so the browser
pixel and the server (CAPI / Stripe webhook) **de-duplicate** automatically.

---

## Server-side backup (still to deploy — needs your keys)

The `tracking-worker/` mirrors events to **Meta Conversions API** + **GA4 Measurement Protocol**
(resilient to ad blockers / iOS). Deploy it, then paste its URL into
`analytics-config.js` → `TRACKING_ENDPOINT` and rebuild.

```bash
cd tracking-worker
npx wrangler deploy
npx wrangler secret put META_PIXEL_ID          # 2382778145481273
npx wrangler secret put META_CAPI_TOKEN        # from Meta Events Manager → Conversions API
npx wrangler secret put GA4_MEASUREMENT_ID     # G-TCKTDT6E7T
npx wrangler secret put GA4_API_SECRET         # GA4 Admin → Data Streams → Measurement Protocol API secrets
npx wrangler secret put ALLOW_ORIGIN           # https://eliraliving.com
```

**Bullet-proof purchase (recommended):** Stripe Dashboard → Developers → Webhooks → Add endpoint
→ `https://elira-tracking.<you>.workers.dev/stripe-webhook`, event `checkout.session.completed`,
then `npx wrangler secret put STRIPE_WEBHOOK_SECRET`. Now a Purchase is sent to Meta CAPI the
moment Stripe confirms payment (with hashed email), deduped via the session id.

---

## Verify

- **Dev console** (localhost): every event logs `[Elira Analytics] view_item …` etc.
- **GA4 → Admin → DebugView**: watch view_item → add_to_cart → begin_checkout → purchase.
- **Meta Events Manager → Test Events** (+ confirm browser/server dedupe by `event_id`).
- **TikTok Events Manager → Test Event**.
- **Google Ads → Conversions**: "Recording" after the first test purchase.
- **GTM Preview** (Tag Assistant): see the dataLayer events; build tags here when ready.

Test card (Stripe test mode): `4242 4242 4242 4242`.

---

## What's left (your tasks)

1. **Add a consent banner (CMP)** and wire it to `EliraConsent.update(...)` — *required for EU ads.*
2. **Deploy `tracking-worker`** + paste `TRACKING_ENDPOINT` for server-side resilience.
3. (Optional) **Move pixels into GTM** and flip `fire.<platform>` to `"gtm"`.

### Files
- `assets/data/analytics-config.js` — your IDs + per-platform fire mode
- `assets/js/analytics.js` — dataLayer + direct pixels + consent + server mirror + dev logging
- `build.js` — bakes GTM + Consent Mode into every page (`node build.js` to apply)
- `tracking-worker/` — Meta CAPI + GA4 MP + Stripe webhook
