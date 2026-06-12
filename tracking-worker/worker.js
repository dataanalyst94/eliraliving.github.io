/* =========================================================================
   ELIRA LIVING — Server-side tracking Worker (Cloudflare Workers, free tier).

   Two jobs:
   1) POST /collect       — receives browser events (AddToCart, InitiateCheckout,
                            Purchase, ViewContent, PageView) and forwards them to
                            Meta Conversions API + GA4 Measurement Protocol.
                            Resilient to ad blockers / iOS tracking prevention.
   2) POST /stripe-webhook — verifies Stripe's signature and, on a CONFIRMED paid
                            order (checkout.session.completed), sends a Purchase to
                            Meta CAPI server-side (best match quality + reliability).

   De-duplication: the browser pixel and the server send the SAME event_id
   (for Purchase = the Stripe session id), so Meta/GA4 collapse the duplicate.

   ── SECRETS (wrangler secret put …) ──────────────────────────────────────
     META_PIXEL_ID          Meta Pixel ID (numeric)
     META_CAPI_TOKEN        Meta Conversions API access token
     GA4_MEASUREMENT_ID     "G-XXXXXXXXXX"
     GA4_API_SECRET         GA4 Measurement Protocol API secret
     STRIPE_WEBHOOK_SECRET  "whsec_…" (only for /stripe-webhook)
     ALLOW_ORIGIN           e.g. https://eliraliving.com  (defaults to *)
     KLAVIYO_API_KEY        "pk_…" Klaviyo PRIVATE key (optional; enables the
                            server-side "Placed Order" event → post-purchase flow)
   ========================================================================= */

const KLAVIYO_REVISION = "2025-01-15";

const META_VER = "v19.0";

/* ---- helpers ----------------------------------------------------------- */
const ALLOWED_ORIGINS = ["https://www.eliraliving.com", "https://eliraliving.com"];
const PRIMARY_ORIGIN = "https://www.eliraliving.com";
function pickOrigin(request, env) {
  const o = request.headers.get("Origin");
  if (o && ALLOWED_ORIGINS.includes(o)) return o;
  if (env && env.ALLOW_ORIGIN) return env.ALLOW_ORIGIN;
  return PRIMARY_ORIGIN;
}
function cors(origin) {
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
// constant-time comparison of two hex strings (avoids signature timing leaks)
function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const ALLOWED_EVENTS = new Set(["Purchase", "AddToCart", "InitiateCheckout", "ViewContent", "PageView"]);
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}
const enc = new TextEncoder();
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/* Meta event name → GA4 event name */
const GA4_NAME = { Purchase: "purchase", AddToCart: "add_to_cart", InitiateCheckout: "begin_checkout", ViewContent: "view_item", PageView: "page_view" };

/* ---- Meta Conversions API --------------------------------------------- */
async function sendMeta(env, e) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return { skipped: "meta" };
  const user_data = {};
  if (e.ip) user_data.client_ip_address = e.ip;
  if (e.ua) user_data.client_user_agent = e.ua;
  if (e.fbp) user_data.fbp = e.fbp;
  if (e.fbc) user_data.fbc = e.fbc;
  if (e.email) user_data.em = [await sha256Hex(String(e.email).trim().toLowerCase())];

  const data = [{
    event_name: e.event_name, event_time: e.event_time || Math.floor(Date.now() / 1000),
    event_id: e.event_id, action_source: "website", event_source_url: e.url,
    user_data,
    custom_data: {
      currency: e.currency || "EUR", value: e.value,
      content_type: "product",
      content_ids: e.content_ids || [],
      contents: (e.contents || []).map(c => ({ id: c.id, quantity: c.quantity, item_price: c.item_price })),
      content_name: e.content_name
    }
  }];
  const res = await fetch(`https://graph.facebook.com/${META_VER}/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data })
  });
  return { meta: res.status, body: res.ok ? "ok" : await res.text() };
}

/* ---- GA4 Measurement Protocol ----------------------------------------- */
async function sendGA4(env, e) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) return { skipped: "ga4" };
  if (!e.client_id) return { skipped: "ga4 (no client_id)" };
  const name = GA4_NAME[e.event_name] || "custom_event";
  const params = { currency: e.currency || "EUR", value: e.value, items: (e.contents || []).map(c => ({ item_id: c.id, quantity: c.quantity, price: c.item_price })) };
  if (e.transaction_id) params.transaction_id = e.transaction_id;
  const res = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`, {
    method: "POST", body: JSON.stringify({ client_id: e.client_id, events: [{ name, params }] })
  });
  return { ga4: res.status };
}

/* ---- Klaviyo (server-side "Placed Order" event) ----------------------- */
async function sendKlaviyoOrder(env, s) {
  if (!env.KLAVIYO_API_KEY) return { skipped: "klaviyo" };
  const email = s.customer_details && s.customer_details.email;
  if (!email) return { skipped: "klaviyo (no email)" };
  const value = (s.amount_total || 0) / 100;
  const body = {
    data: {
      type: "event",
      attributes: {
        properties: { OrderId: s.id, Source: "Stripe", "$value": value },
        metric: { data: { type: "metric", attributes: { name: "Placed Order" } } },
        profile: { data: { type: "profile", attributes: { email } } },
        value,
        value_currency: (s.currency || "eur").toUpperCase(),
        unique_id: s.id,
        time: new Date().toISOString()
      }
    }
  };
  const res = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${env.KLAVIYO_API_KEY}`,
      revision: KLAVIYO_REVISION,
      "Content-Type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(body)
  });
  return { klaviyo: res.status, body: res.ok ? "ok" : await res.text() };
}

/* ---- routes ------------------------------------------------------------ */
async function handleCollect(request, env, origin) {
  const b = await request.json();
  if (!ALLOWED_EVENTS.has(b.event_name)) return json({ error: "invalid event" }, 400, origin);
  if (Array.isArray(b.contents) && b.contents.length > 50) b.contents = b.contents.slice(0, 50);
  if (Array.isArray(b.content_ids) && b.content_ids.length > 50) b.content_ids = b.content_ids.slice(0, 50);
  const e = {
    event_name: b.event_name, event_id: b.event_id, event_time: b.event_time,
    url: b.event_source_url || b.page_location, value: b.value, currency: b.currency || "EUR",
    content_ids: b.content_ids, contents: b.contents, content_name: b.content_name,
    transaction_id: b.transaction_id,
    client_id: b.client_id, fbp: b.fbp, fbc: b.fbc,
    ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for"),
    ua: request.headers.get("user-agent")
  };
  const [meta, ga4] = await Promise.all([sendMeta(env, e), sendGA4(env, e)]);
  return json({ ok: true, meta, ga4 }, 200, origin);
}

async function handleStripeWebhook(request, env, origin) {
  // Fail CLOSED: without a configured signing secret we cannot trust the payload,
  // so we refuse it. This prevents anyone forging a "paid order" to trigger fake
  // Klaviyo "Placed Order" emails / Meta Purchases.
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "webhook not configured" }, 503, origin);
  const sig = request.headers.get("stripe-signature") || "";
  const payload = await request.text();
  const parts = Object.fromEntries(sig.split(",").map(p => p.split("=")));
  if (!parts.t || !parts.v1) return json({ error: "bad signature" }, 400, origin);
  // replay protection: reject events whose timestamp is more than 5 min off
  const skew = Math.floor(Date.now() / 1000) - parseInt(parts.t, 10);
  if (!Number.isFinite(skew) || Math.abs(skew) > 300) return json({ error: "stale event" }, 400, origin);
  const expected = await hmacSha256Hex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${payload}`);
  if (!timingSafeEqualHex(parts.v1, expected)) return json({ error: "bad signature" }, 400, origin);
  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    await Promise.all([
      sendMeta(env, {
        event_name: "Purchase", event_id: s.id, event_time: Math.floor(Date.now() / 1000),
        url: s.success_url || "https://eliraliving.com/", value: (s.amount_total || 0) / 100,
        currency: (s.currency || "eur").toUpperCase(),
        email: s.customer_details && s.customer_details.email
      }),
      sendKlaviyoOrder(env, s)   // → triggers Klaviyo post-purchase / review flow
    ]);
  }
  return json({ received: true }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = pickOrigin(request, env);
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    try {
      if (request.method === "POST" && pathname.endsWith("/collect")) return await handleCollect(request, env, origin);
      if (request.method === "POST" && pathname.endsWith("/stripe-webhook")) return await handleStripeWebhook(request, env, origin);
      return json({ error: "not found" }, 404, origin);
    } catch (err) {
      return json({ error: err.message }, 400, origin);
    }
  }
};
