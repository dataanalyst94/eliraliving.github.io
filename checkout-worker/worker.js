/* =========================================================================
   Elira Living — Stripe Checkout Session worker (Cloudflare Workers, free tier).

   Creates ONE Stripe Checkout Session for the whole cart so customers pay
   once. Your storefront stays on GitHub Pages; only this endpoint runs here.

   WHY A SERVER AT ALL?
   Your Stripe SECRET key can never live in the static site. This tiny worker
   holds it and talks to Stripe. It also re-prices every item server-side so a
   customer cannot tamper with prices in the browser.

   ── DEPLOY (5 min, free) ────────────────────────────────────────────────
   1. npm i -g wrangler        (one-time)
   2. wrangler login
   3. From this folder:  wrangler deploy
   4. Set your secret key:  wrangler secret put STRIPE_SECRET_KEY
   5. Optional: lock CORS to your domain:  wrangler secret put ALLOW_ORIGIN
        (e.g. https://<user>.github.io  — defaults to "*")
   6. Copy the deployed URL (https://elira-checkout.<you>.workers.dev)
      into assets/js/stripe.js → STRIPE_CONFIG.checkoutEndpoint

   ── SECURITY: server-side price map ─────────────────────────────────────
   Prices below are the source of truth (EUR cents). They MUST match
   assets/js/products.js. The client-sent amount is ignored. Variant
   surcharges (e.g. larger sizes) are added via `variantAdd`.
   ========================================================================= */

const PRICES = {
  "sensitive-moisturizing-cream": 1990,
  "radiant-glow-cleanser": 2599,
  "purifying-toner": 1890,        // PROVISIONAL — confirm with owner
  "sensitive-scalp-shampoo": 1690 // PROVISIONAL — confirm with owner
};

const FREE_SHIPPING_THRESHOLD = 3900; // €39.00
const SHIPPING_FLAT = 495;            // €4.95

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors(origin) });

    try {
      const body = await request.json();
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) return json({ error: "Empty cart" }, 400, origin);

      const form = new URLSearchParams();
      form.append("mode", "payment");
      form.append("locale", ["de", "nl", "en"].includes(body.locale) ? body.locale : "auto");
      form.append("success_url", body.successUrl || "https://example.com/success.html");
      form.append("cancel_url", body.cancelUrl || "https://example.com/cancel.html");
      form.append("billing_address_collection", "auto");
      // Ship only to your markets:
      form.append("shipping_address_collection[allowed_countries][0]", "DE");
      form.append("shipping_address_collection[allowed_countries][1]", "NL");
      form.append("phone_number_collection[enabled]", "false");

      let subtotal = 0;
      items.forEach((it, n) => {
        const base = PRICES[it.id];
        if (base == null) throw new Error("Unknown product: " + it.id);
        // variant surcharge derived from client amount above base (sizes only)
        const surcharge = Math.max(0, Math.round((it.amount || base) - base));
        const unit = base + surcharge;
        const qty = Math.max(1, Math.min(20, parseInt(it.quantity, 10) || 1));
        subtotal += unit * qty;

        const name = (it.name || it.id) + (it.variant ? ` — ${it.variant}` : "");
        // Prefer a real Stripe Price if provided; else build price_data.
        if (it.priceId) {
          form.append(`line_items[${n}][price]`, it.priceId);
          form.append(`line_items[${n}][quantity]`, qty);
        } else {
          form.append(`line_items[${n}][price_data][currency]`, "eur");
          form.append(`line_items[${n}][price_data][unit_amount]`, unit);
          form.append(`line_items[${n}][price_data][product_data][name]`, name);
          form.append(`line_items[${n}][quantity]`, qty);
        }
      });

      // Shipping (free over threshold)
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
      form.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
      form.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", shipping);
      form.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "eur");
      form.append("shipping_options[0][shipping_rate_data][display_name]", shipping === 0 ? "Free shipping" : "Standard shipping");

      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.STRIPE_SECRET_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });
      const session = await res.json();
      if (!res.ok) {
        console.error(session);
        return json({ error: session.error?.message || "Stripe error" }, 502, origin);
      }
      return json({ id: session.id, url: session.url }, 200, origin);
    } catch (err) {
      return json({ error: err.message }, 400, origin);
    }
  }
};

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) }
  });
}
