/* Provision the Finance ledger workflow. Reads the existing live Orders workflow to
   borrow its Stripe + Notion credential ids (the public API can't list credentials),
   fills them in, imports the finance workflow and activates it.
   Env: N8N_URL (default n8n.eliraliving.com), N8N_API_KEY
   Run: node tools/n8n-provision-finance.js
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const ORDERS_ID = "OlJrQ9gznLbuEY3R";
const WF = path.join(__dirname, "..", "infra", "n8n", "workflows", "finance-ledger.json");

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  if (!E.N8N_API_KEY) throw new Error("Set N8N_API_KEY");
  // 1) borrow credential ids from the Orders workflow
  const orders = await api("GET", `/api/v1/workflows/${ORDERS_ID}`);
  let stripeId, notionId;
  for (const n of orders.nodes) {
    if (n.credentials?.stripeApi?.id) stripeId = n.credentials.stripeApi.id;
    if (n.credentials?.notionApi?.id) notionId = n.credentials.notionApi.id;
  }
  if (!stripeId || !notionId) throw new Error(`could not find creds (stripe=${stripeId} notion=${notionId})`);
  console.log("· borrowed creds  stripe:", stripeId, " notion:", notionId);

  // 2) fill into finance workflow
  const wf = JSON.parse(fs.readFileSync(WF, "utf8"));
  for (const n of wf.nodes) {
    if (n.credentials?.stripeApi) n.credentials.stripeApi.id = stripeId;
    if (n.credentials?.notionApi) n.credentials.notionApi.id = notionId;
  }

  // 3) import + activate
  const created = await api("POST", "/api/v1/workflows", {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" },
  });
  console.log("· workflow imported →", created.id);
  await api("POST", `/api/v1/workflows/${created.id}/activate`);
  console.log("✅ Finance ledger ACTIVE — every website sale now logs gross/fees/COGS/profit to Notion.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
