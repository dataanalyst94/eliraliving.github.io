/* Replace the male-model images (Scene = "Model · M") in the existing Notion
   photoreal library with the freshly regenerated ones. Updates in place.
   Run: node tools/notion-patch-male.js <NOTION_TOKEN> <DATABASE_ID> */
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..");
const TOK = process.argv[2]; const DB = process.argv[3];
const H = { Authorization: `Bearer ${TOK}`, "Notion-Version": "2022-06-28" };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LANG = { English: "en", Deutsch: "de", Nederlands: "nl" };
const PROD = { "Peptide Serum": "pep", "Retinol Alt. Serum": "p4", "Sensitive Cream": "cream", "Radiant Cleanser": "p1", "Purifying Toner": "p2_x", "Scalp Shampoo": "p2" };
// note: Purifying Toner = p3, Scalp Shampoo = p2  — fix map:
PROD["Purifying Toner"] = "p3";

async function j(url, opts) { const r = await fetch(url, opts); const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${url}\n${t}`); return t ? JSON.parse(t) : {}; }

async function upload(file) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  const fu = await j("https://api.notion.com/v1/file_uploads", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/jpeg" }), path.basename(file));
  await j(fu.upload_url, { method: "POST", headers: H, body: form });
  return fu.id;
}

(async () => {
  // query all pages where Scene == "Model · M"
  let pages = [], cursor;
  do {
    const res = await j(`https://api.notion.com/v1/databases/${DB}/query`, {
      method: "POST", headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: "Scene", select: { equals: "Model · M" } }, start_cursor: cursor }),
    });
    pages = pages.concat(res.results); cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  console.log("male rows found:", pages.length);

  let n = 0;
  for (const pg of pages) {
    const prodName = pg.properties.Product.select?.name;
    const langName = pg.properties.Language.select?.name;
    const slug = PROD[prodName], lang = LANG[langName];
    if (!slug || !lang) { console.error("✗ unmapped", prodName, langName); continue; }
    const file = `marketing/social/nano/post/${lang}/${slug}-modelm.jpg`;
    if (!fs.existsSync(path.join(ROOT, file))) { console.error("✗ missing", file); continue; }
    const id = await upload(file);
    await j(`https://api.notion.com/v1/pages/${pg.id}`, {
      method: "PATCH", headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ cover: { type: "file_upload", file_upload: { id } }, properties: { Image: { files: [{ name: path.basename(file), type: "file_upload", file_upload: { id } }] } } }),
    });
    console.log("✓", ++n, slug, lang); await sleep(320);
  }
  console.log(`\n✓ ${n} male images replaced in place.`);
})().catch(e => { console.error(e); process.exit(1); });
