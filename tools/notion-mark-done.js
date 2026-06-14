/* Mark completed Elira ops tasks as Done in Notion Operations Board.
   Run: NOTION_TOKEN=ntn_... node tools/notion-mark-done.js
*/
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const OPS_DB = "37ea4815-a826-81cb-9ee9-e60372973062";

const DONE_TASKS = [
  // Phase A — Infrastructure
  "Create Oracle Cloud account (Always-Free)",
  "Create free Oracle account",
  "Set up Oracle Cloud VM",
  "Install Docker + Caddy on VM",
  "Deploy n8n on Oracle VM",
  "Set up n8n (self-hosted)",
  "Create Telegram bot",
  "Create @elira_ops_alert_bot",
  "Orders workflow (Stripe → Notion + Telegram + Klaviyo)",
  "Daily KPI digest (08:00)",
  "Workflow failure alerts",
  "Error alert workflow",
  // Phase B — Revenue Automation
  "Abandoned checkout recovery workflow",
  "Checkout worker (3h expiry + recovery URL)",
  "Deploy checkout Cloudflare worker",
  "Shipped-notify workflow (15-min poller)",
  "Klaviyo Abandoned Cart email (EN/DE/NL)",
  "Klaviyo Welcome #1 email (EN/DE/NL)",
  "Klaviyo Welcome #2 email (EN/DE/NL)",
  "Klaviyo Welcome #3 email (EN/DE/NL)",
  "Klaviyo Post Purchase #1 email (EN/DE/NL)",
  "Klaviyo Post Purchase #2 & #3 email (EN/DE/NL)",
  "Klaviyo Browse Abandonment email (EN/DE/NL)",
  "Klaviyo Shipped email (EN/DE/NL)",
  "Newsletter draft workflow (parked)",
  "Signup Locale fix (app.js)",
  // Phase C — Growth
  "90 social captions (EN/DE/NL)",
  "Social captions JSON",
  "90 photoreal product images (Nano Banana)",
  "Product image library (30 EN + 30 DE + 30 NL)",
  // Phase D — Ops
  "Weekly review digest (Sun 18:00)",
  "VAT OSS (not needed <€10k)",
  "Notion Orders DB",
  "Notion Content Library DB",
  "Notion Operations Board",
];

async function notion(method, path, body) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}\n${t}`);
  return JSON.parse(t);
}

async function main() {
  if (!NOTION_TOKEN) { console.error("Set NOTION_TOKEN env var"); process.exit(1); }

  // Query all tasks in the Ops board
  let cursor;
  const pages = [];
  do {
    const res = await notion("POST", `/databases/${OPS_DB}/query`, {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  console.log(`Found ${pages.length} tasks in Ops board`);

  let updated = 0;
  for (const page of pages) {
    const titleProp = page.properties?.Name?.title?.[0]?.plain_text || "";
    const statusProp = page.properties?.Status?.status?.name || page.properties?.Phase?.select?.name || "";

    // Check if this task name matches any of our done list (fuzzy)
    const isDone = DONE_TASKS.some(t =>
      titleProp.toLowerCase().includes(t.toLowerCase().slice(0, 20)) ||
      t.toLowerCase().includes(titleProp.toLowerCase().slice(0, 20))
    );

    if (isDone && statusProp !== "Done" && statusProp !== "Complete" && statusProp !== "✅ Done") {
      console.log(`  → Marking done: "${titleProp}" (was: ${statusProp})`);
      try {
        // Try status property first, then select
        const props = page.properties;
        if (props.Status?.status) {
          await notion("PATCH", `/pages/${page.id}`, {
            properties: { Status: { status: { name: "Done" } } },
          });
        } else if (props.Phase?.select) {
          await notion("PATCH", `/pages/${page.id}`, {
            properties: { Phase: { select: { name: "Done" } } },
          });
        }
        updated++;
      } catch (e) {
        console.warn(`    ⚠ Could not update "${titleProp}": ${e.message}`);
      }
    }
  }
  console.log(`\n✅ Updated ${updated} tasks to Done.`);
}

main().catch(console.error);
