/* Provision the Instagram carousel poster (INACTIVE).
   Uses the existing "Instagram token" credential (id 7MAxzdkUXpkRXCpo) already in n8n,
   borrows the Telegram credential id from the Orders workflow, imports the workflow (not activated).
   Env: N8N_API_KEY    Run: node tools/n8n-provision-ig-carousel.js
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const ORDERS_ID = "OlJrQ9gznLbuEY3R";
const WF = path.join(__dirname, "..", "infra", "n8n", "workflows", "instagram-carousel-poster.json");

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  if (!E.N8N_API_KEY) throw new Error("Set N8N_API_KEY");
  const orders = await api("GET", `/api/v1/workflows/${ORDERS_ID}`);
  let telegramId;
  for (const n of orders.nodes) if (n.credentials?.telegramApi?.id) telegramId = n.credentials.telegramApi.id;
  console.log("· Telegram cred id:", telegramId);

  const wf = JSON.parse(fs.readFileSync(WF, "utf8"));
  for (const n of wf.nodes) {
    if (n.credentials?.telegramApi) n.credentials.telegramApi = { id: telegramId, name: "Telegram account" };
  }
  const created = await api("POST", "/api/v1/workflows", {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" },
  });
  console.log("· workflow imported (INACTIVE) →", created.id);
  console.log("\n✅ Instagram carousel poster ready & INACTIVE. Activate on go-live nod.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
