/* =========================================================================
   ELIRA LIVING — eBay.de orders → Notion Finance Ledger sync.

   Runs on a cron (every 6h). Each run:
     1) Exchange the long-lived OAuth refresh token for a short-lived access token.
     2) Pull orders created in the last LOOKBACK_DAYS from the Sell Fulfillment API.
     3) For each order line, upsert a row into the Notion Finance Ledger
        (Type=Sale, Channel=eBay), skipping any Order ID already present.

   Idempotent: re-scanning the same window is safe — existing Order IDs are skipped.
   No KV/state needed.

   Secrets (wrangler secret put …): EBAY_CLIENT_ID, EBAY_CLIENT_SECRET,
   EBAY_REFRESH_TOKEN, NOTION_TOKEN.
   Vars (wrangler.toml): NOTION_FINANCE_DB, EBAY_MARKETPLACE, LOOKBACK_DAYS.

   GET /  → health check + manual trigger (handy for testing without waiting for cron).
   ========================================================================= */

const EBAY_OAUTH = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_ORDERS = "https://api.ebay.com/sell/fulfillment/v1/order";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
// Scope needed to read orders. (Granted when you generated the user token.)
const SCOPE = "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(run(env));
  },

  async fetch(request, env) {
    if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
    try {
      const summary = await run(env);
      return json({ ok: true, ...summary });
    } catch (e) {
      return json({ ok: false, error: String(e && e.message || e) }, 500);
    }
  },
};

async function run(env) {
  const token = await ebayAccessToken(env);
  const orders = await fetchOrders(env, token);
  let created = 0, skipped = 0;
  for (const order of orders) {
    const orderId = order.orderId;
    if (await ledgerHasOrder(env, orderId)) { skipped++; continue; }
    await writeLedgerRow(env, order);
    created++;
  }
  const summary = { scanned: orders.length, created, skipped };
  console.log("eBay→Ledger sync:", JSON.stringify(summary));
  return summary;
}

/* ---- eBay: refresh-token → access-token ---- */
async function ebayAccessToken(env) {
  const basic = btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
  // No `scope` param: eBay then issues an access token covering exactly the
  // scopes the refresh token was granted. This avoids "invalid_scope" when the
  // granted set (broad selling scopes) differs from any single requested scope.
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: env.EBAY_REFRESH_TOKEN,
  });
  const r = await fetch(EBAY_OAUTH, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`eBay token ${r.status}: ${t}`);
  return JSON.parse(t).access_token;
}

/* ---- eBay: fetch recent orders ---- */
async function fetchOrders(env, accessToken) {
  const days = parseInt(env.LOOKBACK_DAYS || "7", 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const filter = `creationdate:[${since}..]`;
  const url = `${EBAY_ORDERS}?filter=${encodeURIComponent(filter)}&limit=200`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-EBAY-C-MARKETPLACE-ID": env.EBAY_MARKETPLACE || "EBAY_DE",
      "Content-Type": "application/json",
    },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`eBay orders ${r.status}: ${t}`);
  return JSON.parse(t).orders || [];
}

/* ---- Notion: has this Order ID already? ---- */
async function ledgerHasOrder(env, orderId) {
  const r = await notion(env, "POST", `/databases/${env.NOTION_FINANCE_DB}/query`, {
    filter: { property: "Order ID", rich_text: { equals: orderId } },
    page_size: 1,
  });
  return (r.results || []).length > 0;
}

/* ---- Notion: write one ledger row from an eBay order ---- */
async function writeLedgerRow(env, order) {
  const total = num(order?.pricingSummary?.total?.value);
  // eBay marketplace/payment fees, when present on the order's payment summary.
  const fees = sumFees(order);
  const qty = (order.lineItems || []).reduce((n, li) => n + (li.quantity || 0), 0);
  const products = (order.lineItems || []).map(li => li.title).filter(Boolean).join(", ");
  const date = (order.creationDate || new Date().toISOString()).slice(0, 10);
  const name = `eBay · ${products || order.orderId}`;

  await notion(env, "POST", "/pages", {
    parent: { database_id: env.NOTION_FINANCE_DB },
    properties: {
      Name: { title: [{ text: { content: name.slice(0, 1900) } }] },
      Date: { date: { start: date } },
      Channel: { select: { name: "eBay" } },
      Type: { select: { name: "Sale" } },
      Product: { rich_text: [{ text: { content: (products || "").slice(0, 1900) } }] },
      Qty: { number: qty || null },
      Gross: { number: total },
      Fees: { number: fees },
      "Order ID": { rich_text: [{ text: { content: order.orderId } }] },
      Notes: { rich_text: [{ text: { content: `Auto-synced from eBay.de · ${order.orderFulfillmentStatus || ""}`.trim() } }] },
    },
  });
}

function sumFees(order) {
  // eBay exposes fee detail on the order's paymentSummary.totalDueSeller vs total,
  // but the reliable per-order fee field is in `totalMarketplaceFee` when present.
  const mf = num(order?.totalMarketplaceFee?.value);
  if (mf) return mf;
  // Fallback: try summing any payment "marketplaceFees".
  const fees = order?.paymentSummary?.totalDueSeller?.value;
  const total = order?.pricingSummary?.total?.value;
  if (fees != null && total != null) {
    const diff = num(total) - num(fees);
    return diff > 0 ? round2(diff) : null;
  }
  return null;
}

/* ---- Notion HTTP helper ---- */
async function notion(env, method, path, body) {
  const r = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Notion ${method} ${path} ${r.status}: ${t}`);
  return t ? JSON.parse(t) : {};
}

/* ---- utils ---- */
function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }
function round2(n) { return Math.round(n * 100) / 100; }
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status, headers: { "content-type": "application/json" },
  });
}
