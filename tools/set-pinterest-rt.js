/* Store a Pinterest refresh_token into the Pinterest token-refresh workflow's static data.
   Run ONCE after initial OAuth, or whenever you re-auth Pinterest.
   Env: N8N_API_KEY
   Arg: refresh_token string (first CLI arg)
   Usage: node tools/set-pinterest-rt.js <refresh_token>
*/
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };

const rt = process.argv[2];
if (!rt) { console.error("Usage: node tools/set-pinterest-rt.js <refresh_token>"); process.exit(1); }
if (!E.N8N_API_KEY) { console.error("Set N8N_API_KEY"); process.exit(1); }

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function main() {
  // Find the Pinterest token-refresh workflow by name
  const list = await api("GET", "/api/v1/workflows?limit=100");
  const wf = (list.data || list).find(w => w.name === "Elira — Pinterest token refresh");
  if (!wf) throw new Error("Workflow 'Elira — Pinterest token refresh' not found. Did you run n8n-provision-token-refresh.js?");
  console.log("· Found workflow id:", wf.id);

  await api("PUT", `/api/v1/workflows/${wf.id}/static-data`, {
    data: { pinterestRefreshToken: rt }
  });
  console.log("✅ Pinterest refresh_token stored in workflow static data.");
  console.log("   The refresh workflow will use it automatically on the 20th of each month.");
}
main().catch(e => { console.error(e.message); process.exit(1); });
