# Elira Living — Klaviyo Email Templates

Six ready-to-paste, mobile-responsive, Outlook-safe HTML emails for the three flows.

| File | Flow | Timing | Purpose |
|---|---|---|---|
| `welcome-1-offer.html` | Welcome | Immediately | Welcome + 10% code (`WELCOME10`) → Shop |
| `welcome-2-difference.html` | Welcome | +2 days | Why we're different (vegan/COSMOS/fragrance-free) → Ingredients |
| `welcome-3-routine.html` | Welcome | +5 days | Simple 3-step routine + product picks → Shop |
| `post-purchase-1-thankyou.html` | Post-purchase | Immediately | Thank-you + how to use → product guidance |
| `post-purchase-2-review.html` | Post-purchase | +7 days | Review request + `THANKYOU10` + cross-sell |
| `abandoned-cart.html` | Abandoned cart | +1 hour | "You left something behind" → Cart |

## How to add one to a Klaviyo flow email

1. **Flows → (your flow) → add/open an Email** → **Edit Content**.
2. In the template editor, choose to **edit the HTML / "</> Code"** view (or create a **new template → "Start from code/blank"**), then **paste the entire file contents**, replacing everything.
3. Set the email's **Subject** and **Preview text** (suggestions below). Save.
4. Send yourself a **preview/test** (Klaviyo: "Preview → Send a test") and check on mobile + Gmail + Outlook.

## Subject lines + preview text (A/B test the subjects)

| Email | Subject (A / B) | Preview text |
|---|---|---|
| welcome-1 | `Welcome — here's 10% off 🌿` / `{{ first_name|default:'Hello' }}, your 10% code is inside` | Your welcome code + what makes Elira different |
| welcome-2 | `What "clean beauty" actually means` / `Certified, not just claimed` | Vegan, fragrance-free, ECOCERT COSMOS — no greenwashing |
| welcome-3 | `Not sure where to start?` / `Your 3-step sensitive-skin routine` | Three gentle steps — that's all you need |
| post-purchase-1 | `Thank you, {{ first_name|default:'lovely' }} 🌿` / `Your Elira order is confirmed` | How to get the very best from your ritual |
| post-purchase-2 | `How's your skin feeling?` / `Got 2 minutes? (thank-you inside)` | Share a review — and here's 10% off your next order |
| abandoned-cart | `You left something behind` / `Your basket is still here, {{ first_name|default:'lovely' }}` | We saved your Elira picks — finish in a tap |

## Before you send — fill these in

1. **Coupon codes** — create matching codes in your store/Stripe (or swap for a Klaviyo dynamic coupon tag `{% coupon_code 'POOL' %}`):
   - `WELCOME10` — 10% off, first order, 7-day expiry.
   - `THANKYOU10` — 10% off next order (post-purchase review email).
2. **Trustpilot link** — in `post-purchase-2-review.html`, replace **`REPLACE_WITH_YOUR_TRUSTPILOT_REVIEW_LINK`** (appears twice — the MSO button + the normal button) with your Trustpilot review URL.
3. **Abandoned cart dynamic items** *(optional, later)* — `abandoned-cart.html` has a commented `{% for item in event.items %}` block. Uncomment it once the "Started Checkout" event carries line items (see `../klaviyo-setup.md` Step 3); until then the static 3-product showcase shows.

## Klaviyo variables already wired in
- `{{ first_name|default:'lovely' }}` — personalised greeting (safe fallback).
- `{{ event.OrderId|default:'—' }}` — order reference (post-purchase 1; from the Worker's "Placed Order" event).
- `{% unsubscribe %}` / `{% manage_preferences %}` — required compliance links.
- `{{ organization.full_address }}` — your address from Klaviyo account settings (required by law in the footer — set it in Klaviyo → Settings → Account).

## Best practices already applied
Bulletproof VML buttons (render in Outlook) · hidden preheader text · single 600px column · `@media` mobile rules · dark-mode meta · first-name personalisation · one primary CTA each · trust/cert strip · live product imagery from eliraliving.com · honest social proof (no fabricated review counts) · clear unsubscribe + address.

## Languages
These are the **English** versions for `/en/` links. For the DE and NL markets, ask and I'll generate localised versions (same design, native copy, `/de/` and `/nl/` links) — ideally as separate flows or language-conditional blocks in Klaviyo.
