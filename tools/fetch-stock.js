/* Fetch commercial-use lifestyle stock from Pexels into assets/img/_src/stock/.
   Run: node tools/fetch-stock.js <PEXELS_KEY> */
const fs = require("fs"); const path = require("path");
const KEY = process.argv[2];
const OUT = path.join(__dirname, "..", "assets", "img", "_src", "stock");
fs.mkdirSync(OUT, { recursive: true });
// query -> how many to keep
const QUERIES = [
  ["morning skincare routine woman", 2],
  ["woman applying face serum", 2],
  ["skincare products flatlay", 2],
  ["hands holding cosmetic bottle", 2],
  ["calm woman relaxing spa", 2],
  ["serum dropper skincare", 2],
  ["natural beauty woman portrait soft", 2],
  ["self care morning light", 2],
];
async function run() {
  let n = 0;
  for (const [q, take] of QUERIES) {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=${take + 2}&size=large`, { headers: { Authorization: KEY } });
    if (!r.ok) { console.error("API", r.status, await r.text()); process.exit(1); }
    const j = await r.json();
    const photos = (j.photos || []).slice(0, take);
    for (const p of photos) {
      const url = p.src.portrait || p.src.large;
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      const slug = q.split(" ").slice(0, 2).join("-");
      const f = path.join(OUT, `${slug}-${p.id}.jpg`);
      fs.writeFileSync(f, buf); n++;
      console.log("✓", path.relative(path.join(__dirname, ".."), f), `(by ${p.photographer})`);
    }
  }
  console.log(`\n${n} stock images saved.`);
}
run().catch(e => { console.error(e); process.exit(1); });
