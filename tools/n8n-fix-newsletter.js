/* Fix the weekly Newsletter-draft workflow so the Telegram "Send draft" node
   can never exceed Telegram's 4096-char limit (the cause of the recurring
   "Bad request - please check your parameters" / Workflow FAILED alert).

   It caps the AI draft to 3600 chars with a note pointing to the full draft in
   the n8n execution log. Idempotent — safe to run twice.

   Run (PowerShell), key stays on your machine, never in chat:
     $env:N8N_API_KEY="<your n8n api key>"; node tools/n8n-fix-newsletter.js
   Get the key in n8n → Settings → n8n API → Create an API key (delete it after). */
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };

const OLD = "{{ $json.choices[0].message.content }}";
const NEW = "{{ $json.choices[0].message.content.slice(0, 3600) }}"
  + "{{ $json.choices[0].message.content.length > 3600 ? "
  + "'\\n\\n...(preview trimmed to fit Telegram; full draft is in the n8n execution log)' : '' }}";

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}\n${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
}

(async () => {
  if (!E.N8N_API_KEY) throw new Error("Set N8N_API_KEY first (PowerShell: $env:N8N_API_KEY=\"...\").");

  // Find the newsletter workflow (name contains an en dash → match on substring).
  const list = await api("GET", "/api/v1/workflows?limit=250");
  const items = list.data || list;
  const wfMeta = items.find((w) => /newsletter draft/i.test(w.name));
  if (!wfMeta) throw new Error("Newsletter-draft workflow not found. Names: " + items.map((w) => w.name).join(" | "));

  const wf = await api("GET", "/api/v1/workflows/" + wfMeta.id);
  const node = wf.nodes.find((n) => n.name === "Send draft to Telegram")
    || wf.nodes.find((n) => n.type === "n8n-nodes-base.telegram");
  if (!node) throw new Error("Telegram node not found in workflow " + wf.name);

  const text = node.parameters.text || "";
  if (text.includes("message.content.slice(0, 3600)")) {
    console.log("✓ Already fixed — nothing to do. (" + wf.name + ")");
    return;
  }
  if (!text.includes(OLD)) {
    throw new Error("The Telegram text isn't the expected expression, not patching blindly.\nCurrent:\n" + text);
  }
  node.parameters.text = text.replace(OLD, NEW);

  await api("PUT", "/api/v1/workflows/" + wf.id, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: wf.settings || { executionOrder: "v1" },
  });
  await api("POST", `/api/v1/workflows/${wf.id}/activate`).catch(() => {});

  console.log("✓ Patched + re-activated:", wf.name);
  console.log("  The weekly draft will no longer fail on long content.");
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
