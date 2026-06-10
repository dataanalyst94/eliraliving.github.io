# Elira Living — Klaviyo Email Automation (Phase 2)

What's wired in code vs. what you finish in the Klaviyo dashboard.

## What the site/worker already does (deployed in code)

| Piece | Where | Status |
|---|---|---|
| **Newsletter signup → "Email List"** | `assets/js/app.js` + `assets/data/analytics-config.js` (public Site ID `V2dqim`, List ID `WKcxya`) | ✅ Live after deploy. Submitting the footer newsletter form subscribes the email via Klaviyo's client API (double opt-in). |
| **Server-side "Placed Order" event** | `tracking-worker/worker.js` (Stripe webhook → Klaviyo Events API) | ✅ In code; **activates once you set the `KLAVIYO_API_KEY` Worker secret** (below). |
| **Klaviyo in privacy policy** | `assets/data/legal-content.js` §4 (EN/DE/NL) | ✅ Disclosed as an email processor (GDPR). |

> The private `pk_…` key is **never** in the site or repo. It lives only as a Worker secret.

## Step 1 — Add the Worker secret (enables post-purchase emails)

In the `tracking-worker/` directory:

```bash
npx wrangler secret put KLAVIYO_API_KEY
# paste your Klaviyo PRIVATE key (pk_…) when prompted
npx wrangler deploy
```

That's all the code needs. The webhook already fires `Placed Order` to Klaviyo on every confirmed Stripe order (email + value + currency + order id).

## Step 2 — Build the 3 flows in Klaviyo (dashboard → Flows)

Klaviyo flow logic is built in their UI. Triggers are already being sent by the code.

### A. Welcome series — *trigger: List "Email List"*
- **Trigger:** "When someone subscribes to a list" → **Email List** (`WKcxya`).
- **Emails (3 over 7 days):**
  1. Immediately — Welcome + brand story + the 10% code (matches the on-site "10% off your first order" promise). Link to `/en/shop.html`.
  2. +2 days — "What makes us different" (vegan, ECOCERT COSMOS, fragrance-free). Link to `/en/ingredients.html` + a blog guide.
  3. +5 days — Bestsellers / sensitive-skin routine. Link to the sensitive-skin blog post + shop.
- Set **smart sending** on; localise by language if you segment EN/DE/NL.

### B. Post-purchase / review request — *trigger: metric "Placed Order"*
- **Trigger:** "Placed Order" (the metric the Worker sends).
- **Emails:**
  1. Immediately — Order confirmation / thank-you + how to use the products (link product "How to use" sections).
  2. +7 days — Ask for a review (Trustpilot link) + a cross-sell. (This is the review email from the roadmap.)
- Lawful basis: existing customer relationship (soft opt-in) with an unsubscribe link.

### C. Abandoned cart — *trigger: metric "Started Checkout"* (needs Step 3)
- **Trigger:** "Started Checkout".
- **Email:** +1 hour — "You left something behind" + the cart items + a checkout link.
- ⚠️ See Step 3 — this trigger needs an email captured *before* the person leaves.

## Step 3 — Abandoned cart: capturing the email (the one missing piece)

Today checkout collects the email on Stripe's hosted page, so we don't know it until *after* someone leaves. Two clean ways to enable a real abandoned-cart flow — pick one:

1. **Onsite email capture (recommended).** Add a small "email to save your cart / get 10% off" field on the cart step. On submit, call Klaviyo identify + send a `Started Checkout` event with the cart contents. (I can build this on request — it's a small cart UI addition.)
2. **Klaviyo onsite forms + active-on-site.** Load Klaviyo's onsite script (`klaviyo.js?company_id=V2dqim`) behind marketing consent and use a Klaviyo popup form to capture emails; their built-in browse/abandon tracking then drives the flow. (I can wire the consent-gated loader on request.)

Until one of these is in place, **Welcome (A)** and **Post-purchase (B)** run fully; **Abandoned cart (C)** is staged but won't have emails to send to.

## Notes
- **Double opt-in** is enabled on the Email List (confirmed — the client API returned 202). This is the GDPR-correct setting; subscribers get a confirmation email before any marketing.
- **Test profiles to delete:** `klaviyo-wiring-test@eliraliving.com` and `klaviyo-order-test@eliraliving.com` were created while verifying the integration — remove them in Klaviyo (Profiles).
- **Rotate the key:** the `pk_…` key was shared in plaintext during setup — rotate it in Klaviyo (Settings → API Keys) and update the Worker secret.
- Config values live in `assets/data/analytics-config.js` → `KLAVIYO`. To use a different list, change `LIST_ID` and rebuild.
