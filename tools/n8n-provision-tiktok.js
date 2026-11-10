/* Import the Instagram-Reels-to-TikTok workflow into n8n and leave it inactive.
   The TikTok OAuth credential is intentionally connected only after TikTok
   approves Content Posting API access and the owner authorizes @eliralivingeu.

   Required env:
     N8N_URL       defaults to https://n8n.eliraliving.com
     N8N_API_KEY   existing n8n public API key
*/
const fs = require("fs");
const path = require("path");

const BASE = (process.env.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const API_KEY = process.env.N8N_API_KEY;
const WORKFLOW = path.join(__dirname, "..", "infra", "n8n", "workflows", "instagram-reels-to-tiktok.json");

async function api(method, route, body) {
  const response = await fetch(BASE + route, {
    method,
    headers: {
      "X-N8N-API-KEY": API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route} -> ${response.status}\n${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  if (!API_KEY) throw new Error("Set N8N_API_KEY");
  const source = JSON.parse(fs.readFileSync(WORKFLOW, "utf8"));
  const payload = {
    name: source.name,
    nodes: source.nodes,
    connections: source.connections,
    settings: source.settings,
  };
  const created = await api("POST", "/api/v1/workflows", payload);
  console.log(`Imported inactive workflow ${created.id}: ${created.name}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
