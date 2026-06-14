/* Inspect the Operations/Kanban board and move completed tasks to Done.
   node tools/board-sync.js            -> dry run (list only)
   node tools/board-sync.js apply      -> move matched tasks to Done
   Env: NOTION_TOKEN
*/
const T = process.env.NOTION_TOKEN;
const DB = "37ea4815-a826-81cb-9ee9-e60372973062";
const APPLY = process.argv[2] === "apply";
const h = { Authorization: `Bearer ${T}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };

// Tasks known to be COMPLETE (substrings, case-insensitive). Add as work finishes.
const DONE = [
  "oracle", "telegram bot", "n8n", "docker", "caddy", "vm",
  "orders workflow", "kpi", "digest", "error alert", "failure alert",
  "abandoned", "checkout worker", "shipped", "klaviyo", "welcome email", "post purchase",
  "browse abandon", "signup locale", "locale fix",
  "social caption", "captions", "photoreal", "product image", "nano",
  "carousel", "instagram", "media host",
  "weekly review", "weekly business review", "vat", "finance", "ledger", "dashboard", "monthly cost",
  "orders db", "create notion orders database", "content library", "operations board", "kanban",
  "web analytics", "trilingual en/de/nl flow emails", "geo/aieo",
  "newsletter signup: pass locale", "workflow-failure telegram alerts",
  "browse-abandonment tracking", "newsletter draft engine",
  "meta business app",
];

// Never auto-mark these done even if a keyword matches (genuinely open / founder actions).
const EXCLUDE = ["rotate", "search console", "stripe_webhook_secret", "selfnamed", "low-stock", " roas", "meta ads", "customer-service", "control bot"];

async function notion(method, path, body) {
  const r = await fetch(`https://api.notion.com/v1${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}\n${t}`);
  return JSON.parse(t);
}

(async () => {
  if (!T) throw new Error("Set NOTION_TOKEN");
  const db = await notion("GET", `/databases/${DB}`);
  const titleKey = Object.keys(db.properties).find(k => db.properties[k].type === "title");
  const PHASE = "Phase", STATUS = "Status", SHIPPED = "✓ Shipped", DONE_COL = "Done";
  console.log(`Sync: completed task -> Phase="${SHIPPED}" AND Status="${DONE_COL}" (kanban groups by Status)\n`);

  let cur, rows = [];
  do {
    const q = await notion("POST", `/databases/${DB}/query`, cur ? { start_cursor: cur, page_size: 100 } : { page_size: 100 });
    rows.push(...q.results); cur = q.has_more ? q.next_cursor : null;
  } while (cur);

  let moved = 0, alreadyDone = 0, skipped = [];
  for (const r of rows) {
    const title = (r.properties[titleKey].title[0] || {}).plain_text || "";
    const phase = (r.properties[PHASE]?.select || {}).name;
    const status = (r.properties[STATUS]?.select || {}).name;
    const tl = title.toLowerCase();
    // A task is "done" if it already sits in Phase=Shipped, or it matches the DONE list (and isn't excluded).
    const isDone = (phase === SHIPPED) || (DONE.some(d => tl.includes(d)) && !EXCLUDE.some(x => tl.includes(x)));
    if (phase === SHIPPED && status === DONE_COL) { alreadyDone++; continue; }
    if (isDone) {
      console.log(`${APPLY ? "→ DONE" : "would mark"}: "${title}"  [Phase:${phase || "—"} / Status:${status || "—"}]`);
      if (APPLY) {
        await notion("PATCH", `/pages/${r.id}`, { properties: {
          [PHASE]: { select: { name: SHIPPED } },
          [STATUS]: { select: { name: DONE_COL } },
        } });
      }
      moved++;
    } else {
      skipped.push(`${title} [${status || "—"}]`);
    }
  }
  console.log(`\n${APPLY ? "Marked done" : "Would mark"}: ${moved} · already Done: ${alreadyDone}`);
  console.log(`\nLeft as-is (not matched / genuinely open):`);
  skipped.forEach(s => console.log("  -", s));
})().catch(e => { console.error(e.message); process.exit(1); });
