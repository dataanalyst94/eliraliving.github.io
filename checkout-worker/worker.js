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

   ── SINGLE SOURCE OF TRUTH: prices come from the site's catalog ─────────
   The worker fetches https://www.eliraliving.com/assets/data/prices.json,
   which build.js auto-generates from assets/data/catalog.js. So you only ever
   edit ONE file (catalog.js) — the displayed price and the charged price stay
   in sync automatically, and you don't need to redeploy this worker for a
   price change (it re-reads prices.json every ~5 minutes).

   Security is unchanged: prices are fetched from OUR OWN site (server-side),
   never trusted from the customer's browser. The FALLBACK_PRICES below are
   only used if that fetch ever fails, so checkout can never break.
   ========================================================================= */

const PRICES_URL = "https://www.eliraliving.com/assets/data/prices.json";

// Used only if prices.json can't be fetched (network/404). Keep roughly current.
const FALLBACK_PRICES = {
  "sensitive-moisturizing-cream": 1990,
  "radiant-glow-cleanser": 2599,
  "purifying-toner": 2400,
  "sensitive-scalp-shampoo": 2300,
  "retinol-alternative-serum": 2999
};
const FALLBACK_FREE_SHIPPING_THRESHOLD = 3900; // €39.00
const FALLBACK_SHIPPING_FLAT = 495;            // €4.95
const FALLBACK_FREE_SHIPPING = ["retinol-alternative-serum"]; // products that always ship free

// Fetch current pricing from the site (cached ~5 min at Cloudflare's edge).
async function loadPricing() {
  try {
    const res = await fetch(PRICES_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.prices && typeof d.prices === "object") {
        return {
          prices: d.prices,
          freeThreshold: Number.isFinite(d.freeShippingThreshold) ? d.freeShippingThreshold : FALLBACK_FREE_SHIPPING_THRESHOLD,
          shippingFlat: Number.isFinite(d.shippingFlat) ? d.shippingFlat : FALLBACK_SHIPPING_FLAT,
          freeShipping: Array.isArray(d.freeShipping) ? d.freeShipping : FALLBACK_FREE_SHIPPING
        };
      }
    }
  } catch (e) { /* fall through to fallback */ }
  return { prices: FALLBACK_PRICES, freeThreshold: FALLBACK_FREE_SHIPPING_THRESHOLD, shippingFlat: FALLBACK_SHIPPING_FLAT, freeShipping: FALLBACK_FREE_SHIPPING };
}

// Only our own storefront may use this endpoint from a browser.
const ALLOWED_ORIGINS = ["https://www.eliraliving.com", "https://eliraliving.com"];
const PRIMARY_ORIGIN = "https://www.eliraliving.com";
function pickOrigin(request, env) {
  const o = request.headers.get("Origin");
  if (o && ALLOWED_ORIGINS.includes(o)) return o;
  if (env && env.ALLOW_ORIGIN) return env.ALLOW_ORIGIN;
  return PRIMARY_ORIGIN;
}
function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = pickOrigin(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors(origin) });

    try {
      const body = await request.json();
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) return json({ error: "Empty cart" }, 400, origin);
      if (items.length > 50) return json({ error: "Too many items" }, 400, origin);

      const pricing = await loadPricing(); // current prices from the site catalog
      const loc = ["de", "nl", "en"].includes(body.locale) ? body.locale : "en";

      const form = new URLSearchParams();
      form.append("mode", "payment");
      form.append("locale", loc);
      // Redirect targets are built server-side from a fixed origin — never trust
      // client-supplied URLs (prevents using this endpoint as an open redirect).
      form.append("success_url", `${PRIMARY_ORIGIN}/${loc}/success.html?session_id={CHECKOUT_SESSION_ID}`);
      form.append("cancel_url", `${PRIMARY_ORIGIN}/${loc}/cancel.html`);
      form.append("billing_address_collection", "auto");
      // Ship only to your markets:
      form.append("shipping_address_collection[allowed_countries][0]", "DE");
      form.append("shipping_address_collection[allowed_countries][1]", "NL");
      form.append("phone_number_collection[enabled]", "false");

      let subtotal = 0;
      items.forEach((it, n) => {
        // Prefer the live catalog price; fall back to the baked-in price so a
        // freshly-added product still works during the ~5-min prices.json cache window.
        const base = pricing.prices[it.id] != null ? pricing.prices[it.id] : FALLBACK_PRICES[it.id];
        if (base == null) throw new Error("Unknown product: " + it.id);
        // Price is fully server-authoritative — the client-supplied amount is
        // never trusted, so a tampered cart cannot change what is charged.
        const unit = base;
        const qty = Math.max(1, Math.min(20, parseInt(it.quantity, 10) || 1));
        subtotal += unit * qty;

        const name = (String(it.name || it.id) + (it.variant ? ` — ${it.variant}` : "")).slice(0, 120);
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

      // Shipping (free over threshold, or if the cart has a free-shipping product)
      const hasFreeShipItem = items.some(it => (pricing.freeShipping || []).includes(it.id));
      const shipping = (hasFreeShipItem || subtotal >= pricing.freeThreshold) ? 0 : pricing.shippingFlat;
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
