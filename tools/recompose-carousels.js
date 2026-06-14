/* Re-composite all carousel cards from the EXISTING approved copy in carousels.json.
   ZERO API calls — no Haiku, no Gemini. Pure sharp re-render with the current card→image
   mapping in carousels.js (card 3 = real product flatlay, card 5 = modelm).
   Use after changing card backgrounds/layout so existing copy is preserved.

   Run: node tools/recompose-carousels.js
*/
const fs = require("fs"); const path = require("path");
const { PRODUCTS, OUT, ROOT, composeCards, writeCards } = require("./carousels.js");

async function main() {
  const mf = path.join(OUT, "carousels.json");
  const existing = JSON.parse(fs.readFileSync(mf, "utf8"));
  const out = [];
  for (const entry of existing) {
    const p = PRODUCTS.find(x => x.slug === entry.product);
    if (!p) { console.error(`✗ unknown product ${entry.product} — keeping as-is`); out.push(entry); continue; }
    if (!entry.copy) { console.error(`✗ no copy for ${entry.product}/${entry.lang} — skipping`); out.push(entry); continue; }
    const cards = await composeCards(p, entry.copy, entry.lang);
    writeCards(p, entry.lang, cards, out, entry.copy);
    console.log(`✓ recomposed ${entry.product} / ${entry.lang.toUpperCase()} — 6 cards`);
  }
  fs.writeFileSync(mf, JSON.stringify(out, null, 0));
  console.log(`\n✓ Done. ${out.length} carousels re-rendered from existing copy (0 API tokens).`);
}
main().catch(e => { console.error(e); process.exit(1); });
