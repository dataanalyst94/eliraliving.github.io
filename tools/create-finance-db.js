/* One-shot: create the "Finance Ledger" database in Notion under the Elira parent page.
   One row per transaction. Sales carry Gross/Fees/COGS; cost-only rows use Other cost.
   Net profit + Month are formulas. Dashboard = views/charts on top of this DB.
   Env:  NOTION_TOKEN=ntn_...   node tools/create-finance-db.js
*/
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PARENT_PAGE = "243a4815-a826-8060-93b6-f2e9a3d90a68"; // Elira parent page

async function notion(method, path, body) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}\n${t}`);
  return JSON.parse(t);
}

async function main() {
  if (!NOTION_TOKEN) throw new Error("Set NOTION_TOKEN");
  const db = await notion("POST", "/databases", {
    parent: { type: "page_id", page_id: PARENT_PAGE },
    icon: { type: "emoji", emoji: "💶" },
    title: [{ type: "text", text: { content: "Finance Ledger" } }],
    properties: {
      Name: { title: {} },
      Date: { date: {} },
      Channel: { select: { options: [
        { name: "Website", color: "blue" },
        { name: "Social", color: "purple" },
        { name: "eBay", color: "yellow" },
        { name: "—", color: "gray" },
      ] } },
      Type: { select: { options: [
        { name: "Sale", color: "green" },
        { name: "Refund", color: "red" },
        { name: "Subscription", color: "orange" },
        { name: "Ad spend", color: "pink" },
        { name: "Other cost", color: "brown" },
      ] } },
      Product: { rich_text: {} },
      Qty: { number: { format: "number" } },
      Gross: { number: { format: "euro" } },
      Fees: { number: { format: "euro" } },
      COGS: { number: { format: "euro" } },
      "Other cost": { number: { format: "euro" } },
      "Net profit": { formula: { expression:
        'toNumber(format(prop("Gross"))) - toNumber(format(prop("Fees"))) - toNumber(format(prop("COGS"))) - toNumber(format(prop("Other cost")))' } },
      Month: { formula: { expression: 'formatDate(prop("Date"), "YYYY-MM")' } },
      "Order ID": { rich_text: {} },
      Notes: { rich_text: {} },
    },
  });
  console.log("✅ Finance Ledger DB created");
  console.log("DB id:", db.id);
  console.log("URL  :", db.url);
}
main().catch(e => { console.error(e.message); process.exit(1); });
