/* Upload the 90-image trilingual photoreal library into a fresh Notion gallery
   database under the parent page. Reads marketing/social/nano/library.json.
   Run: node tools/notion-nano.js <NOTION_TOKEN> <PARENT_PAGE_ID> */
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..");
const TOK = process.argv[2]; const PARENT = process.argv[3];
const V = "2022-06-28";
const H = { Authorization: `Bearer ${TOK}`, "Notion-Version": V };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROD = { pep: "Peptide Serum", p4: "Retinol Alt. Serum", cream: "Sensitive Cream", p1: "Radiant Cleanser", p3: "Purifying Toner", p2: "Scalp Shampoo" };
const SCENE = { hero: "Hero", vanity: "Vanity", modelf: "Model · F", modelm: "Model · M", flatlay: "Flatlay" };
const LANG = { en: "English", de: "Deutsch", nl: "Nederlands" };
const LCOLOR = { en: "blue", de: "yellow", nl: "orange" };

async function j(url, opts) { const r = await fetch(url, opts); const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${url}\n${t}`); return t ? JSON.parse(t) : {}; }

async function createDB() {
  const sel = (m, colors) => ({ select: { options: Object.entries(m).map(([k, name]) => ({ name, color: colors ? colors[k] : "default" })) } });
  const db = await j("https://api.notion.com/v1/databases", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      parent: { type: "page_id", page_id: PARENT }, icon: { type: "emoji", emoji: "🖼️" },
      title: [{ type: "text", text: { content: "Content Library — Photoreal (EN/DE/NL)" } }],
      properties: {
        Name: { title: {} },
        Language: sel(LANG, LCOLOR),
        Product: sel(PROD),
        Scene: sel(SCENE),
        Caption: { rich_text: {} },
        Image: { files: {} },
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

async function row(db, e) {
  const id = await upload(e.file);
  const name = `${PROD[e.product]} · ${SCENE[e.scene]} · ${e.lang.toUpperCase()}`;
  await j("https://api.notion.com/v1/pages", {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      parent: { database_id: db }, cover: { type: "file_upload", file_upload: { id } },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Language: { select: { name: LANG[e.lang] } },
        Product: { select: { name: PROD[e.product] } },
        Scene: { select: { name: SCENE[e.scene] } },
        Caption: { rich_text: [{ text: { content: e.caption || "" } }] },
        Image: { files: [{ name: path.basename(e.file), type: "file_upload", file_upload: { id } }] },
      },
    }),
  });
}

(async () => {
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, "marketing/social/nano/library.json")));
  const db = await createDB();
  console.log("DB:", db);
  let n = 0;
  for (const e of man) { try { await row(db, e); console.log("✓", ++n, e.product, e.scene, e.lang); } catch (err) { console.error("✗", e.file, err.message); } await sleep(320); }
  console.log(`\n✓ ${n}/${man.length} uploaded.\nDATABASE_ID=${db}`);
})().catch(e => { console.error(e); process.exit(1); });
