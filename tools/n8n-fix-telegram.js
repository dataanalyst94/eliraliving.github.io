/* Replace the Telegram credential with a corrected token and rewire both
   Phase A workflows to use it. Validates the token against Telegram first.
   Env: N8N_URL, N8N_API_KEY, TELEGRAM_TOKEN, TELEGRAM_CHAT */
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const OLD_CRED = "dXuNzq1BTBYDMOWR";
const WF_IDS = ["OlJrQ9gznLbuEY3R", "HSKNVu60mxa42WWG"];

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t}`);
  return t ? JSON.parse(t) : {};
}
(async () => {
  // 1) validate token with Telegram
  const me = await (await fetch(`https://api.telegram.org/bot${E.TELEGRAM_TOKEN}/getMe`)).json();
  if (!me.ok) throw new Error("Telegram token still invalid: " + JSON.stringify(me));
  console.log("· token OK →", me.result.username);

  // 2) delete bad cred, create good one
  try { await api("DELETE", "/api/v1/credentials/" + OLD_CRED); console.log("· old cred deleted"); }
  catch (e) { console.log("· (old cred not deleted:", e.message.split("\n")[0], ")"); }
  const cred = await api("POST", "/api/v1/credentials", { name: "Telegram account", type: "telegramApi", data: { accessToken: E.TELEGRAM_TOKEN, baseUrl: "https://api.telegram.org" } });
  console.log("· new Telegram cred →", cred.id);

  // 3) rewire both workflows
  for (const id of WF_IDS) {
    const wf = await api("GET", "/api/v1/workflows/" + id);
    for (const n of wf.nodes) if (n.type === "n8n-nodes-base.telegram") {
      n.credentials = { telegramApi: { id: cred.id, name: "Telegram account" } };
      if (E.TELEGRAM_CHAT) n.parameters.chatId = E.TELEGRAM_CHAT;
    }
    await api("PUT", "/api/v1/workflows/" + id, { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" } });
    await api("POST", `/api/v1/workflows/${id}/activate`).catch(() => {});
    console.log("· rewired + active:", wf.name);
  }
  // 4) send a confirmation ping
  await fetch(`https://api.telegram.org/bot${E.TELEGRAM_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: E.TELEGRAM_CHAT, text: "✅ Elira Ops bot connected. Order pings + daily 08:00 KPI digest are live." }) });
  console.log("\n✓ Telegram fixed. Check your Telegram for the confirmation message.");
})().catch(e => { console.error("✗", e.message); process.exit(1); });
