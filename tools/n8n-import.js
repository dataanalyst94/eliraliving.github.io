/* Import a workflow JSON as-is (credentials already filled in the file). No activation.
   Run: node tools/n8n-import.js <file.json>
*/
const fs = require("fs"); const path = require("path");
const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const H = { "X-N8N-API-KEY": E.N8N_API_KEY, "Content-Type": "application/json", accept: "application/json" };
const wf = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "infra", "n8n", "workflows", process.argv[2]), "utf8"));
(async () => {
  const r = await fetch(BASE + "/api/v1/workflows", { method: "POST", headers: H, body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || { executionOrder: "v1" } }) });
  const t = await r.text();
  if (!r.ok) throw new Error(r.status + " " + t);
  console.log("✅ imported →", JSON.parse(t).id);
})().catch(e => { console.error(e.message); process.exit(1); });
