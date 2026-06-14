/* Sync local carousels → media-worker public assets.
   - copies every card JPG referenced in marketing/social/carousels/carousels.json
     into media-worker/public/carousel/<lang>/<slug>/
   - rebuilds media-worker/public/carousels.json (public URLs + caption = CTA headline),
     preserving the local manifest ORDER (new-first queue carries through to the poster).

   Run: node tools/sync-carousels-media.js
*/
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "marketing", "social", "carousels", "carousels.json");
const PUB = path.join(ROOT, "media-worker", "public");
const PUBCAR = path.join(PUB, "carousel");
const BASE = "https://elira-media.elira-living.workers.dev";

const captionOf = e => (e.copy && e.copy.cta && e.copy.cta.headline) || e.name || "";

function main() {
  const entries = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const out = [];
  let copied = 0;
  for (const e of entries) {
    const dstDir = path.join(PUBCAR, e.lang, e.product);
    fs.mkdirSync(dstDir, { recursive: true });
    const urls = [];
    e.cards.forEach((rel, i) => {
      const from = path.join(ROOT, rel);
      const to = path.join(dstDir, `card-${i + 1}.jpg`);
      fs.copyFileSync(from, to);
      copied++;
      urls.push(`${BASE}/carousel/${e.lang}/${e.product}/card-${i + 1}.jpg`);
    });
    out.push({ product: e.product, name: e.name, lang: e.lang, caption: captionOf(e), cards: urls });
  }
  fs.writeFileSync(path.join(PUB, "carousels.json"), JSON.stringify(out, null, 0));
  console.log(`✓ Synced ${out.length} carousels · ${copied} card files → media-worker/public/`);
  console.log(`  queue order (first 6): ${out.slice(0, 6).map(e => e.product + "/" + e.lang).join(", ")}`);
}
main();
