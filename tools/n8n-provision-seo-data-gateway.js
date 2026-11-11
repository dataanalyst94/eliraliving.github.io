/* Provision the isolated Google Search Console + GA4 data gateway used by
   GitHub Actions for weekly SEO article proposals.

   Required env:
     N8N_API_KEY
     SEO_DATA_TOKEN

   Required n8n credential:
     Google SEO Analytics (googleOAuth2Api)
     scopes: webmasters.readonly and analytics.readonly
*/
const crypto = require("crypto");

const E = process.env;
const BASE = (E.N8N_URL || "https://n8n.eliraliving.com").replace(/\/$/, "");
const CREDENTIAL_NAME = E.SEO_GOOGLE_CREDENTIAL_NAME || "Google SEO Analytics";
const WORKFLOW_NAME = "Elira - Weekly SEO data gateway";
const WEBHOOK_PATH = "elira-weekly-seo-data";
const PROPERTY_ID = E.GA4_PROPERTY_ID || "540675818";
const TOKEN = E.SEO_DATA_TOKEN || "";

if (!E.N8N_API_KEY) throw new Error("N8N_API_KEY is required.");
if (!TOKEN) throw new Error("SEO_DATA_TOKEN is required.");

const headers = {
  "X-N8N-API-KEY": E.N8N_API_KEY,
  "Content-Type": "application/json",
  accept: "application/json",
};

async function api(method, apiPath, body) {
  const response = await fetch(BASE + apiPath, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${apiPath} -> ${response.status}\n${text.slice(0, 1600)}`);
  return text ? JSON.parse(text) : {};
}

async function listAll(apiPath) {
  const out = [];
  let cursor = "";
  do {
    const separator = apiPath.includes("?") ? "&" : "?";
    const page = await api("GET", `${apiPath}${cursor ? `${separator}cursor=${cursor}` : ""}`);
    out.push(...(page.data || page));
    cursor = page.nextCursor || "";
  } while (cursor);
  return out;
}

async function upsertWorkflow(definition) {
  const workflows = await listAll("/api/v1/workflows?limit=250");
  const existing = workflows.find(workflow => workflow.name === definition.name);
  if (existing) {
    const current = await api("GET", `/api/v1/workflows/${existing.id}`);
    if (current.active) await api("POST", `/api/v1/workflows/${existing.id}/deactivate`);
    await api("PUT", `/api/v1/workflows/${existing.id}`, definition);
    await api("POST", `/api/v1/workflows/${existing.id}/activate`);
    return existing.id;
  }
  const created = await api("POST", "/api/v1/workflows", definition);
  await api("POST", `/api/v1/workflows/${created.id}/activate`);
  return created.id;
}

async function main() {
  const credentials = await listAll("/api/v1/credentials?limit=250");
  const credential = credentials.find(item => item.name === CREDENTIAL_NAME && item.type === "googleOAuth2Api");
  if (!credential) throw new Error(`Missing n8n credential: ${CREDENTIAL_NAME}`);

  const authorizeCode = [
    "const request = $input.first().json;",
    `const expected = ${JSON.stringify(TOKEN)};`,
    "const supplied = request.headers?.['x-elira-seo-token'] || '';",
    "if (!supplied || supplied !== expected) throw new Error('Unauthorized SEO data request.');",
    "const body = request.body || {};",
    "if (body.source === 'gsc') {",
    "  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(body.startDate || '') || !/^\\d{4}-\\d{2}-\\d{2}$/.test(body.endDate || '')) throw new Error('Invalid Search Console date range.');",
    "  return [{ json: { url: 'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Aeliraliving.com/searchAnalytics/query', requestBody: { startDate: body.startDate, endDate: body.endDate, dimensions: ['query','page','country'], type: 'web', dataState: 'final', rowLimit: 25000, startRow: 0 } } }];",
    "}",
    "if (body.source === 'ga4') {",
    `  return [{ json: { url: 'https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport', requestBody: { dateRanges: [{ startDate: '30daysAgo', endDate: '3daysAgo' }], dimensions: [{ name: 'landingPagePlusQueryString' }], metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }, { name: 'keyEvents' }], limit: '500' } } }];`,
    "}",
    "throw new Error('Unsupported SEO data source.');",
  ].join("\n");

  const nodes = [
    {
      id: crypto.randomUUID(), name: "SEO data webhook", type: "n8n-nodes-base.webhook", typeVersion: 2,
      position: [0, 0], parameters: { httpMethod: "POST", path: WEBHOOK_PATH, responseMode: "lastNode", options: {} },
    },
    {
      id: crypto.randomUUID(), name: "Authorize and build request", type: "n8n-nodes-base.code", typeVersion: 2,
      position: [260, 0], parameters: { jsCode: authorizeCode },
    },
    {
      id: crypto.randomUUID(), name: "Fetch read-only Google data", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
      position: [520, 0], credentials: { googleOAuth2Api: { id: credential.id, name: credential.name } },
      parameters: {
        method: "POST", url: "={{ $json.url }}", authentication: "predefinedCredentialType", nodeCredentialType: "googleOAuth2Api",
        sendHeaders: true, headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
        sendBody: true, specifyBody: "json", jsonBody: "={{ JSON.stringify($json.requestBody) }}", options: {},
      },
    },
  ];
  const connections = {
    "SEO data webhook": { main: [[{ node: "Authorize and build request", type: "main", index: 0 }]] },
    "Authorize and build request": { main: [[{ node: "Fetch read-only Google data", type: "main", index: 0 }]] },
  };
  const id = await upsertWorkflow({ name: WORKFLOW_NAME, nodes, connections, settings: { executionOrder: "v1" } });
  console.log(JSON.stringify({ id, name: WORKFLOW_NAME, webhook: `${BASE}/webhook/${WEBHOOK_PATH}` }));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
