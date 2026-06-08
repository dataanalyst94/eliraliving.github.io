# Elira Living — Tracking & Analytics

Everything is built. This doc tells you **which IDs to collect** and **exactly where each one goes**, then how to configure the tags inside GTM.

> ⚖️ **GDPR / EU first:** you sell into DE & NL, so marketing pixels legally need
> **consent before firing**. The site ships with **Google Consent Mode v2** defaulting
> to *denied*. You must add a cookie-consent banner (a CMP like Cookiebot, Usercentrics,
> CookieYes, or Iubenda) and call `EliraConsent.update({analytics:true, ads:true})` when
> the user accepts. On `localhost` consent is auto-granted so you can test. **Do not run
> ads to EU traffic until the banner is live.**

---

## 1. The IDs you need to collect — and where each goes

| # | ID / value | Looks like | Paste it here |
|---|---|---|---|
| 1 | **GTM Container ID** | `GTM-XXXXXXX` | `assets/data/analytics-config.js` → `GTM_ID`, then run `node build.js` |
| 2 | **Tracking Worker URL** | `https://elira-tracking.<you>.workers.dev` | `assets/data/analytics-config.js` → `TRACKING_ENDPOINT`, then `node build.js` |
| 3 | **GA4 Measurement ID** | `G-XXXXXXXXXX` | GTM UI (GA4 tags) **and** Worker secret `GA4_MEASUREMENT_ID` |
| 4 | **GA4 API Secret** | random string | Worker secret `GA4_API_SECRET` |
| 5 | **Meta Pixel ID** | `1234567890` | GTM UI (Meta tags) **and** Worker secret `META_PIXEL_ID` |
| 6 | **Meta CAPI Token** | long token | Worker secret `META_CAPI_TOKEN` |
| 7 | **TikTok Pixel ID** | `C9XXXXXXXXXX` | GTM UI (TikTok tags) |
| 8 | **Google Ads Conversion ID** | `AW-XXXXXXXXX` | GTM UI (Ads conversion tag) |
| 9 | **Google Ads Conversion Label** | `abcdEFGhIJ` | GTM UI (Ads conversion tag) |
| 10 | **Stripe Webhook Secret** | `whsec_…` | Worker secret `STRIPE_WEBHOOK_SECRET` (optional, see §5) |

> **The ONLY two values that go in the website code are #1 and #2** (one config file).
> Everything else is entered in the GTM UI or as Cloudflare Worker secrets.

---

## 2. Where the code already pushes events (the dataLayer "contract")

The site pushes GA4-standard e-commerce events to `window.dataLayer`. GTM reads these.
Verified firing across the funnel:

| Funnel step | dataLayer `event` | When it fires | Key data (`ecommerce.*`) |
|---|---|---|---|
| Product view | `view_item` | product page load | `currency`, `value`, `items[]` |
| Add to cart | `add_to_cart` | any add-to-cart / quick-add | `currency`, `value`, `items[]` |
| Begin checkout | `begin_checkout` | "Checkout" click (before Stripe) | `currency`, `value`, `items[]` |
| Purchase | `purchase` | success page after payment | `transaction_id`, `currency`, `value`, `items[]` |

Each push also carries a top-level **`event_id`** (used for pixel ↔ server de-duplication).
`page_view` is handled automatically by the GA4 config tag and the pixel base tags (All Pages).

`items[]` shape: `{ item_id (SKU), item_name, item_category, price, quantity }`.

---

## 3. Configure GTM (one-time, ~30 min)

Create the container at **tagmanager.google.com**, put its ID in step 1 above, rebuild.
Then inside GTM:

### A. Variables → New → Data Layer Variable
- `DLV - value` → `ecommerce.value`
- `DLV - currency` → `ecommerce.currency`
- `DLV - transaction_id` → `ecommerce.transaction_id`
- `DLV - event_id` → `event_id`
- `DLV - items` → `ecommerce.items`
- **Custom JavaScript** `JS - content_ids`:
  ```js
  function(){ var i=({{DLV - items}}||[]); return i.map(function(x){return x.item_id;}); }
  ```
- **Custom JavaScript** `JS - meta_contents`:
  ```js
  function(){ return ({{DLV - items}}||[]).map(function(x){return {id:x.item_id,quantity:x.quantity,item_price:x.price};}); }
  ```
- Also enable the built-in **Ecommerce** variables.

### B. Triggers → New → Custom Event
Create one per event name (exact match): `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
(Use the built-in **All Pages** trigger for base/page-view tags.)

### C. Tags

**GA4 (full e-commerce)**
1. **GA4 Configuration** — Measurement ID `G-XXXXXXXXXX` (#3). Trigger: All Pages.
2. **GA4 Event** ×4 — Event Name = `view_item` / `add_to_cart` / `begin_checkout` / `purchase`.
   In each: *More Settings → Ecommerce → Send Ecommerce data → Data source: Data Layer.*
   For purchase, also set Transaction ID = `{{DLV - transaction_id}}`. Trigger = matching Custom Event.

**Meta Pixel (#5)** — Custom HTML tags
1. **Meta Base** (All Pages): standard `fbq('init','PIXEL_ID'); fbq('track','PageView');`
2. **Meta ViewContent / AddToCart / InitiateCheckout / Purchase** (one per trigger):
   ```html
   <script>fbq('track','Purchase',
     {value:{{DLV - value}},currency:{{DLV - currency}},content_type:'product',
      content_ids:{{JS - content_ids}},contents:{{JS - meta_contents}}},
     {eventID:'{{DLV - event_id}}'});</script>
   ```
   (Swap `Purchase` for `ViewContent`/`AddToCart`/`InitiateCheckout` on the other triggers.
   The `eventID` is what de-duplicates against the server CAPI events.)

**TikTok Pixel (#7)** — Custom HTML tags
1. **TikTok Base** (All Pages): standard TikTok loader + `ttq.load('PIXEL_ID'); ttq.page();`
2. **TikTok events**: `ttq.track('ViewContent'|'AddToCart'|'InitiateCheckout'|'CompletePayment',
   {value:{{DLV - value}}, currency:{{DLV - currency}}, content_id:{{JS - content_ids}}});`

**Google Ads (#8/#9)**
1. **Conversion Linker** — trigger All Pages.
2. **Google Ads Conversion Tracking** — Conversion ID `AW-XXXXXXXXX`, Label, Value =
   `{{DLV - value}}`, Currency = `{{DLV - currency}}`, Transaction ID = `{{DLV - transaction_id}}`.
   Trigger: `purchase`.

### D. Consent
In GTM, open each marketing tag → **Consent Settings** → require `ad_storage` (Meta/TikTok/Ads)
or `analytics_storage` (GA4). The site already sets Consent Mode defaults to denied; your CMP
calls `EliraConsent.update(...)` to grant.

Then **Submit / Publish** the container.

---

## 4. Deploy the server-side tracking Worker

```bash
cd tracking-worker
npx wrangler deploy
npx wrangler secret put META_PIXEL_ID
npx wrangler secret put META_CAPI_TOKEN
npx wrangler secret put GA4_MEASUREMENT_ID
npx wrangler secret put GA4_API_SECRET
npx wrangler secret put ALLOW_ORIGIN           # https://eliraliving.com
```
Copy the deployed URL into `analytics-config.js` → `TRACKING_ENDPOINT`, then `node build.js`.
Now `add_to_cart`, `begin_checkout` and `purchase` are mirrored to **Meta CAPI + GA4 MP**
server-side (resilient to ad blockers / iOS), de-duplicated by `event_id`.

## 5. (Recommended) Stripe webhook = bullet-proof Purchase

In the **Stripe Dashboard → Developers → Webhooks → Add endpoint**:
- URL: `https://elira-tracking.<you>.workers.dev/stripe-webhook`
- Event: `checkout.session.completed`
- Copy the signing secret → `npx wrangler secret put STRIPE_WEBHOOK_SECRET`

Now a Purchase is sent to Meta CAPI the moment Stripe **confirms payment** (not just when the
buyer lands on the success page), with the hashed customer email for high match quality —
de-duplicated against the browser pixel via the Stripe session id.

---

## 6. Verify everything

- **Console (dev):** on `localhost` every event logs as `[Elira Analytics] view_item …` etc.
- **GTM Preview** (Tag Assistant): click through product → add to cart → checkout → success and
  watch each tag fire on the matching event.
- **GA4 → Admin → DebugView**: see `view_item`/`add_to_cart`/`begin_checkout`/`purchase` live.
- **Meta Events Manager → Test Events**: see browser + server events and confirm they
  **de-duplicate** (same `event_id`).
- **TikTok Events Manager → Test Event**.
- **Google Ads → Conversions**: status turns to "Recording" after the first test purchase.

---

### Files involved
- `assets/data/analytics-config.js` — your IDs (GTM + Worker URL)
- `assets/js/analytics.js` — dataLayer events, consent, server mirror, dev logging
- `build.js` — bakes GTM + Consent Mode into every page (`node build.js` to apply)
- `tracking-worker/` — Meta CAPI + GA4 MP + Stripe webhook
