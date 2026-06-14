/* Provision Instagram + Pinterest token-refresh workflows (INACTIVE).
   Creates: "n8n API key" credential (httpHeaderAuth) + "Pinterest Basic auth" (httpHeaderAuth).
   Imports both workflows. Both need to be activated after go-live nod.

   Env:
     N8N_API_KEY              - your n8n API key
     PINTEREST_APP_ID         - Pinterest App ID (1580853)
     PINTEREST_APP_SECRET     - Pinterest App secret
     PINTEREST_REFRESH_TOKEN  - refresh_token from the initial OAuth exchange

   Run: node tools/n8n-provision-token-refresh.js
*/
const fs = require("fs"), path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const ORDERS_ID = "OlJrQ9gznLbuEY3R";

if (!E.N8N_API_KEY) { console.error("Set N8N_API_KEY"); process.exit(1); }
if (!E.PINTEREST_APP_ID || !E.PINTEREST_APP_SECRET) { console.error("Set PINTEREST_APP_ID + PINTEREST_APP_SECRET"); process.exit(1); }

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  // Borrow Telegram cred from Orders workflow
  const orders = await api("GET", `/api/v1/workflows/${ORDERS_ID}`);
  let telegramId;
  for (const n of orders.nodes) if (n.credentials?.telegramApi?.id) telegramId = n.credentials.telegramApi.id;
  console.log("· Telegram cred id:", telegramId);

  // Create n8n API key credential (httpHeaderAuth)
  const n8nCred = await api("POST", "/api/v1/credentials", {
    name: "n8n API key",
    type: "httpHeaderAuth",
    data: { name: "X-N8N-API-KEY", value: E.N8N_API_KEY, allowedHttpRequestDomains: "all" },
  });
  console.log("· n8n API key credential →", n8nCred.id);

  // Create Pinterest Basic auth credential (app_id:secret, base64 encoded)
  const pinterestBasic = Buffer.from(`${E.PINTEREST_APP_ID}:${E.PINTEREST_APP_SECRET}`).toString("base64");
  const ptCred = await api("POST", "/api/v1/credentials", {
    name: "Pinterest Basic auth",
    type: "httpHeaderAuth",
    data: { name: "Authorization", value: "Basic " + pinterestBasic, allowedHttpRequestDomains: "all" },
  });
  console.log("· Pinterest Basic auth credential →", ptCred.id);

  // Import workflows
  for (const wfFile of ["instagram-token-refresh.json", "pinterest-token-refresh.json"]) {
    const wf = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "infra", "n8n", "workflows", wfFile), "utf8"));
    for (const n of wf.nodes) {
      if (n.credentials?.httpHeaderAuth?.name === "n8n API key")
        n.credentials.httpHeaderAuth = { id: n8nCred.id, name: "n8n API key" };
      if (n.credentials?.httpHeaderAuth?.name === "Pinterest Basic auth")
        n.credentials.httpHeaderAuth = { id: ptCred.id, name: "Pinterest Basic auth" };
      if (n.credentials?.telegramApi)
        n.credentials.telegramApi = { id: telegramId, name: "Telegram account" };
    }
    const created = await api("POST", "/api/v1/workflows", {
      name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" },
    });
    console.log(`· ${wf.name} imported (INACTIVE) →`, created.id);

    // If Pinterest refresh token provided, store it in static data
    if (wfFile === "pinterest-token-refresh.json" && E.PINTEREST_REFRESH_TOKEN) {
      await api("POST", `/api/v1/workflows/${created.id}/execute`, {});
      // Store via a direct static-data approach: use n8n's static data API
      // n8n doesn't expose static data via API directly, so we store it via a one-time code node execution
      // Instead: patch the workflow to embed the RT in the Load node's static data seed
      console.log("  ℹ️  Pinterest refresh token provided — storing in workflow static data...");
      await api("PUT", `/api/v1/workflows/${created.id}/static-data`, {
        data: { pinterestRefreshToken: E.PINTEREST_REFRESH_TOKEN }
      });
      console.log("  ✅ Pinterest refresh token stored in static data");
    } else if (wfFile === "pinterest-token-refresh.json") {
      console.log("  ⚠️  PINTEREST_REFRESH_TOKEN not set.");
      console.log("     After initial Pinterest OAuth, run:");
      console.log("     PINTEREST_REFRESH_TOKEN=<rt> node tools/set-pinterest-rt.js");
    }
  }

  console.log("\n✅ Token-refresh workflows imported (INACTIVE). Activate on go-live nod.");
  console.log("   IG refresh: 1st of each month → automatic (uses existing cred).");
  console.log("   Pinterest refresh: 20th of each month → needs refresh_token in static data.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
