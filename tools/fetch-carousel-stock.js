/* Intelligent Pexels fetch for the 10 new carousels.
   Per concept: runs several curated queries, keeps portrait results, downloads the
   top N candidates into marketing/social/carousels/_stock/<id>/ and records credits.

   Run: node tools/fetch-carousel-stock.js <PEXELS_KEY> [id1,id2 | all]
   e.g. node tools/fetch-carousel-stock.js 5634xxxx all
        node tools/fetch-carousel-stock.js 5634xxxx c3,c9
*/
const fs = require("fs"); const path = require("path");
const KEY = process.argv[2];
const ONLY = (process.argv[3] || "all").split(",").filter(Boolean);
if (!KEY) { console.error("\n✗ Pass your Pexels API key: node tools/fetch-carousel-stock.js <PEXELS_KEY>\n"); process.exit(1); }
const OUT = path.join(__dirname, "..", "marketing", "social", "carousels", "_stock");

// id -> { keep, queries[] }. Only photo-using concepts are here.
// (c4 €65-value and c5 "natural means nothing" are pure text/product -> AI background, no Pexels.)
const CONCEPTS = {
  c1: { keep: 3, queries: ["red irritated cheek closeup", "sensitive skin redness face", "irritated skin face closeup"] },
  c2: { keep: 4, queries: ["woman overwhelmed skincare", "too many skincare products woman", "woman holding cosmetic bottles", "messy bathroom shelf cosmetics"] },
  c3: { keep: 4, queries: ["calm woman touching cheek", "natural skin closeup no makeup", "smooth healthy skin face soft light", "woman frowning at skin in mirror"] },
  c6: { keep: 3, queries: ["woman washing face water", "splashing water on face", "cleansing foam face closeup"] },
  c7: { keep: 3, queries: ["scalp hair closeup", "woman scratching head scalp", "healthy hair roots closeup"] },
  c8: { keep: 3, queries: ["reading cosmetic product label", "ingredient list closeup", "hand holding cosmetic jar back"] },
  c9: { keep: 4, queries: ["bare skin portrait no makeup", "woman sensitive skin closeup", "gently touching face natural", "natural beauty soft light portrait"] },
  c10: { keep: 3, queries: ["woman holding skincare product explaining", "friendly woman bathroom skincare", "hand pointing at product"] },
};

async function pexels(query, n) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=${n}&size=large`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status}: ${await r.text()}`);
  return (await r.json()).photos || [];
}

async function run() {
  const ids = ONLY[0] === "all" ? Object.keys(CONCEPTS) : ONLY;
  let total = 0;
  for (const id of ids) {
    const c = CONCEPTS[id];
    if (!c) { console.warn("· skip unknown concept", id); continue; }
    const dir = path.join(OUT, id);
    fs.mkdirSync(dir, { recursive: true });
    const credits = [];
    const seen = new Set();
    let saved = 0;
    for (const q of c.queries) {
      if (saved >= c.keep) break;
      let photos = [];
      try { photos = await pexels(q, 3); } catch (e) { console.error("  !", q, e.message); continue; }
      for (const p of photos) {
        if (saved >= c.keep || seen.has(p.id)) continue;
        seen.add(p.id);
        const src = p.src.portrait || p.src.large2x || p.src.large;
        const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
        const f = path.join(dir, `${id}-${String(saved + 1).padStart(2, "0")}-${p.id}.jpg`);
        fs.writeFileSync(f, buf); saved++; total++;
        credits.push({ file: path.basename(f), query: q, photographer: p.photographer, source: p.url });
        console.log(`✓ ${id}: ${path.basename(f)}  (by ${p.photographer} | "${q}")`);
      }
    }
    fs.writeFileSync(path.join(dir, "credits.json"), JSON.stringify(credits, null, 2));
  }
  console.log(`\n${total} candidate images saved under ${path.relative(process.cwd(), OUT)}/<id>/`);
  console.log("Review, keep the best per concept, then we render.");
}
run().catch(e => { console.error(e); process.exit(1); });
