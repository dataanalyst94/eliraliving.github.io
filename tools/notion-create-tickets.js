/* Create Operations-board tickets for the SEO / analytics / content work.
   Idempotent: skips a ticket if a card with the same title already exists.
   Reads the live DB schema so it adapts to the board's Status/Phase options.

   Run:  NOTION_TOKEN=secret_xxx node tools/notion-create-tickets.js
   (PowerShell:  $env:NOTION_TOKEN="secret_xxx"; node tools\notion-create-tickets.js )
*/
const T = process.env.NOTION_TOKEN;
const DB = "37ea4815-a826-81cb-9ee9-e60372973062"; // Operations / Kanban board
const h = { Authorization: `Bearer ${T}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };

// status: "done" | "todo" | "doing"  — mapped to the board's real option names at runtime
const TICKETS = [
  { title: "SEO: 12 insight-led v2 carousels live (DE+NL), queued ahead of originals", status: "done" },
  { title: "Social: 90 solo-post captions rebuilt — 5 distinct angles/product + Emma review", status: "done" },
  { title: "Analytics: complete GA4 ecommerce funnel (view_item_list, select_item, view_cart, remove_from_cart, sign_up)", status: "done" },
  { title: "SEO: 3 ingredient guide pages live — Hexapeptide-11, Bidens Pilosa, Ginkgo Biloba (FAQ schema, 3 langs)", status: "done" },
  { title: "Repo: .gitattributes line-ending normalization (stops rebuild push-conflicts)", status: "done" },
  { title: "GSC: verify URL-prefix property via GA4/GTM + request indexing of new pages", status: "doing" },
  { title: "Analytics: mark key GA4 events as conversions + build funnel/ecommerce dashboards", status: "todo" },
  { title: "Backlinks: execute Week-1 directory submissions (see marketing/backlink-tracker.md)", status: "todo" },
  { title: "Backlinks: ongoing HARO / journalist outreach (haro-sources.md + outreach-templates.md)", status: "todo" },
  { title: "Content: expand ingredient guides to more actives + add product→guide internal links", status: "todo" },
  { title: "Notion: authorize Notion MCP (or store NOTION_TOKEN) so Claude can auto-file tickets", status: "todo" },
];

async function notion(method, path, body) {
  const r = await fetch(`https://api.notion.com/v1${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}\n${t}`);
  return JSON.parse(t);
}
const pick = (opts, res) => { for (const re of res) { const o = opts.find(o => re.test(o.name)); if (o) return o.name; } return opts[0] && opts[0].name; };

(async () => {
  if (!T) throw new Error("Set NOTION_TOKEN (see header).");
  const db = await notion("GET", `/databases/${DB}`);
  const props = db.properties;
  const titleKey = Object.keys(props).find(k => props[k].type === "title");
  const statusKey = ["Status"].find(k => props[k] && props[k].type === "select") || Object.keys(props).find(k => props[k].type === "select" && /status/i.test(k));
  const phaseKey = Object.keys(props).find(k => k === "Phase" && props[k].type === "select");
  const sOpts = statusKey ? props[statusKey].select.options : [];
  const pOpts = phaseKey ? props[phaseKey].select.options : [];
  const ST = {
    done: pick(sOpts, [/done|shipped|complete/i]),
    doing: pick(sOpts, [/progress|doing|active/i]),
    todo: pick(sOpts, [/to.?do|backlog|next|new/i]),
  };
  const PHASE_SHIPPED = pick(pOpts, [/shipped|done|live/i]);

  // existing titles (idempotency)
  let cur, existing = new Set();
  do {
    const q = await notion("POST", `/databases/${DB}/query`, cur ? { start_cursor: cur, page_size: 100 } : { page_size: 100 });
    for (const r of q.results) { const tx = (r.properties[titleKey].title[0] || {}).plain_text || ""; if (tx) existing.add(tx.trim()); }
    cur = q.has_more ? q.next_cursor : null;
  } while (cur);

  let created = 0, skipped = 0;
  for (const t of TICKETS) {
    if (existing.has(t.title.trim())) { console.log("• exists:", t.title); skipped++; continue; }
    const properties = { [titleKey]: { title: [{ text: { content: t.title } }] } };
    if (statusKey && ST[t.status]) properties[statusKey] = { select: { name: ST[t.status] } };
    if (phaseKey && t.status === "done" && PHASE_SHIPPED) properties[phaseKey] = { select: { name: PHASE_SHIPPED } };
    await notion("POST", "/pages", { parent: { database_id: DB }, properties });
    console.log("✓ created:", t.title, `[${t.status}]`);
    created++;
  }
  console.log(`\n✓ Done. ${created} created · ${skipped} already existed.`);
  console.log(`Status map → done:"${ST.done}" doing:"${ST.doing}" todo:"${ST.todo}"`);
})().catch(e => { console.error(e.message); process.exit(1); });
