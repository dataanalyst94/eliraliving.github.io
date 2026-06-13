/* Upload the generated social images into a Notion "Content Library" gallery
   database under the parent page. Run:
     node tools/notion-upload.js <NOTION_TOKEN> <PARENT_PAGE_ID>
   Reads marketing/social/manifest.json. */
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..");
const TOK = process.argv[2]; const PARENT = process.argv[3];
const V = "2022-06-28";
const H = { Authorization: `Bearer ${TOK}`, "Notion-Version": V };
const STYLE_LABEL = { "s1-hero": "Hero", "s2-quote": "Quote", "s3-ingredient": "Ingredient", "s4-review": "Review", "s5-compare": "Comparison", "s6-lifestyle": "Lifestyle" };
const COLOR = { Hero: "green", Quote: "gray", Ingredient: "blue", Review: "yellow", Comparison: "brown", Lifestyle: "pink" };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function j(url, opts) { const r = await fetch(url, opts); const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${url}\n${t}`); return JSON.parse(t); }

async function createDB() {
  const opts = Object.entries(STYLE_LABEL).map(([, l]) => ({ name: l, color: COLOR[l] }));
  const db = await j("https://api.notion.com/v1/databases", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      parent: { type: "page_id", page_id: PARENT }, icon: { type: "emoji", emoji: "🖼️" },
      title: [{ type: "text", text: { content: "Content Library" } }],
      properties: {
        Name: { title: {} }, Style: { select: { options: opts } },
        Caption: { rich_text: {} }, Image: { files: {} },
      },
    }),
  });
  return db.id;
}

async function upload(file) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  const fu = await j("https://api.notion.com/v1/file_uploads", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/jpeg" }), path.basename(file));
  await j(fu.upload_url, { method: "POST", headers: H, body: form });
  return fu.id;
}

async function row(db, entry, idx) {
  const id = await upload(entry.file);
  const name = `${STYLE_LABEL[entry.style]} ${String(idx).padStart(2, "0")}`;
  const fileRef = { name: path.basename(entry.file), type: "file_upload", file_upload: { id } };
  await j("https://api.notion.com/v1/pages", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      parent: { database_id: db }, cover: { type: "file_upload", file_upload: { id } },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Style: { select: { name: STYLE_LABEL[entry.style] } },
        Caption: { rich_text: [{ text: { content: entry.caption || "" } }] },
        Image: { files: [fileRef] },
      },
    }),
  });
}

(async () => {
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, "marketing/social/manifest.json")));
  const db = await createDB();
  console.log("DB:", db);
  let n = 0;
  for (const e of man) { await row(db, e, ++n); console.log("✓", n, e.style, e.caption.slice(0, 32)); await sleep(350); }
  console.log(`\n✓ ${n} images uploaded to Notion Content Library.`);
  console.log("DATABASE_ID=" + db);
})().catch(e => { console.error(e); process.exit(1); });
