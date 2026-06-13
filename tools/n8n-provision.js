/* One-shot: create credentials + import + activate the Phase A workflows via the
   n8n public REST API. Reads everything from env so no secret is hardcoded.
   Required env:
     N8N_URL           e.g. https://n8n.eliraliving.com
     N8N_API_KEY       from n8n → Settings → n8n API → Create API key
     STRIPE_KEY        Stripe secret/restricted key (rk_live_… or sk_…)
     TELEGRAM_TOKEN    BotFather bot token
     TELEGRAM_CHAT     your numeric chat id
     NOTION_TOKEN      ntn_… integration token
   Run: node tools/n8n-provision.js
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const WF = path.join(__dirname, "..", "infra", "n8n", "workflows");

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}

async function makeCred(name, type, data) {
  const res = await api("POST", "/api/v1/credentials", { name, type, data });
  console.log("· credential:", name, "→", res.id);
  return res.id;
}

function load(file) { return JSON.parse(fs.readFileSync(path.join(WF, file), "utf8")); }

async function importWF(file, credIds, chat) {
  const wf = load(file);
  for (const n of wf.nodes) {
    if (n.credentials) for (const k of Object.keys(n.credentials)) {
      if (credIds[k]) n.credentials[k] = { id: credIds[k], name: n.credentials[k].name };
    }
    if (n.type === "n8n-nodes-base.telegram" && n.parameters?.chatId === "REPLACE_CHAT_ID")
      n.parameters.chatId = chat;
  }
  const created = await api("POST", "/api/v1/workflows", {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: wf.settings || { executionOrder: "v1" },
  });
  console.log("· workflow:", wf.name, "→", created.id);
  await api("POST", `/api/v1/workflows/${created.id}/activate`);
  console.log("  ✓ activated");
  return created.id;
}

(async () => {
  for (const k of ["N8N_URL", "N8N_API_KEY", "STRIPE_KEY", "TELEGRAM_TOKEN", "TELEGRAM_CHAT", "NOTION_TOKEN"])
    if (!E[k]) throw new Error("missing env " + k);

  // include all schema props (the public-API validator wants them present)
  const credIds = {
    stripeApi: await makeCred("Stripe account", "stripeApi", { secretKey: E.STRIPE_KEY, notice: "", allowedHttpRequestDomains: "all" }),
    notionApi: await makeCred("Notion account", "notionApi", { apiKey: E.NOTION_TOKEN, allowedHttpRequestDomains: "all" }),
    telegramApi: await makeCred("Telegram account", "telegramApi", { accessToken: E.TELEGRAM_TOKEN, baseUrl: "https://api.telegram.org" }),
  };

  await importWF("orders.json", credIds, E.TELEGRAM_CHAT);
  await importWF("kpi-digest.json", credIds, E.TELEGRAM_CHAT);
  console.log("\n✓ Phase A workflows live. Send a Stripe test event to confirm the Telegram ping.");
})().catch(e => { console.error("✗", e.message); process.exit(1); });
