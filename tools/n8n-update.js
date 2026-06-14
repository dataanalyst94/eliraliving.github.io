/* Update an existing n8n workflow in place from its local JSON, then re-activate.
   Borrows Stripe + Notion credential ids from the live Orders workflow.
   Run: node tools/n8n-update.js <file.json> <workflowId>
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const ORDERS_ID = "OlJrQ9gznLbuEY3R";
const FILE = process.argv[2], WID = process.argv[3];

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  if (!E.N8N_API_KEY || !FILE || !WID) throw new Error("need N8N_API_KEY + <file> <workflowId>");
  const orders = await api("GET", `/api/v1/workflows/${ORDERS_ID}`);
  let stripeId, notionId;
  for (const n of orders.nodes) {
    if (n.credentials?.stripeApi?.id) stripeId = n.credentials.stripeApi.id;
    if (n.credentials?.notionApi?.id) notionId = n.credentials.notionApi.id;
  }
  const wf = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "infra", "n8n", "workflows", FILE), "utf8"));
  for (const n of wf.nodes) {
    if (n.credentials?.stripeApi) n.credentials.stripeApi.id = stripeId;
    if (n.credentials?.notionApi) n.credentials.notionApi.id = notionId;
  }
  await api("PUT", `/api/v1/workflows/${WID}`, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" },
  });
  await api("POST", `/api/v1/workflows/${WID}/activate`);
  console.log(`✅ updated + reactivated ${wf.name} (${WID})`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
