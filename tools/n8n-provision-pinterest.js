/* Provision the Pinterest poster (INACTIVE). Creates a header-auth credential with the
   Pinterest bearer token, borrows the Telegram credential id from the Orders workflow,
   fills both into the workflow, imports it (not activated).
   Env: N8N_API_KEY, PINTEREST_TOKEN
   Run: node tools/n8n-provision-pinterest.js
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const ORDERS_ID = "OlJrQ9gznLbuEY3R";
const WF = path.join(__dirname, "..", "infra", "n8n", "workflows", "pinterest-poster.json");

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  if (!E.N8N_API_KEY || !E.PINTEREST_TOKEN) throw new Error("need N8N_API_KEY + PINTEREST_TOKEN");
  // borrow Telegram credential id
  const orders = await api("GET", `/api/v1/workflows/${ORDERS_ID}`);
  let telegramId;
  for (const n of orders.nodes) if (n.credentials?.telegramApi?.id) telegramId = n.credentials.telegramApi.id;
  console.log("· borrowed telegram cred:", telegramId);

  // create Pinterest header-auth credential
  const cred = await api("POST", "/api/v1/credentials", {
    name: "Pinterest token", type: "httpHeaderAuth",
    data: { name: "Authorization", value: "Bearer " + E.PINTEREST_TOKEN, allowedHttpRequestDomains: "all" },
  });
  console.log("· credential Pinterest token →", cred.id);

  const wf = JSON.parse(fs.readFileSync(WF, "utf8"));
  for (const n of wf.nodes) {
    if (n.credentials?.httpHeaderAuth) n.credentials.httpHeaderAuth = { id: cred.id, name: "Pinterest token" };
    if (n.credentials?.telegramApi) n.credentials.telegramApi = { id: telegramId, name: "Telegram account" };
  }
  const created = await api("POST", "/api/v1/workflows", {
    name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" },
  });
  console.log("· workflow imported (INACTIVE) →", created.id);
  console.log("\n✅ Pinterest poster ready & INACTIVE. Activate on your go-live nod.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
