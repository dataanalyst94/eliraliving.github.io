/* Provision the Instagram poster workflow into n8n (kept INACTIVE).
   Creates an httpQueryAuth credential holding the IG token, fills its id into
   the two graph.instagram.com nodes, then imports the workflow (not activated).
   Env:
     N8N_URL        e.g. https://n8n.eliraliving.com
     N8N_API_KEY    n8n public API key
     IG_TOKEN       Instagram long-lived access token
   Run: node tools/n8n-provision-ig.js
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const WF = path.join(__dirname, "..", "infra", "n8n", "workflows", "instagram-poster.json");

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  if (!E.N8N_API_KEY) throw new Error("Set N8N_API_KEY");
  if (!E.IG_TOKEN) throw new Error("Set IG_TOKEN");

  // 1) Instagram token credential (query auth: access_token=<token>)
  const cred = await api("POST", "/api/v1/credentials", {
    name: "Instagram token",
    type: "httpQueryAuth",
    data: { name: "access_token", value: E.IG_TOKEN, allowedHttpRequestDomains: "all" },
  });
  console.log("· credential Instagram token →", cred.id);

  // 2) Load workflow, fill IG credential id into the two httpQueryAuth nodes
  const wf = JSON.parse(fs.readFileSync(WF, "utf8"));
  for (const node of wf.nodes) {
    if (node.credentials && node.credentials.httpQueryAuth) {
      node.credentials.httpQueryAuth = { id: cred.id, name: "Instagram token" };
    }
  }

  // 3) Import workflow (public API creates it INACTIVE — we never call /activate)
  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" } };
  const created = await api("POST", "/api/v1/workflows", payload);
  console.log("· workflow imported (INACTIVE) →", created.id);
  console.log("\n✅ Instagram poster imported and left INACTIVE.");
  console.log("   Telegram confirm node: open it in n8n once and pick the existing 'Telegram account' credential (1 click).");
  console.log("   Activate only when you give the nod.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
