/* Two standalone ROUTINE carousels (DE + NL), reusing the Elira card compositor.
   - routine-w : women's evening anti-aging routine, hero = Retinol Alternative (p4), 6 cards
   - routine-m : men's simple daily routine, hero = Sensitive Moisturizing Cream (cream), 5 cards
   Copy is hand-written native DE/NL (0 API tokens). Step cards reuse cardLine; the product's
   own clean hero shot is the background for each step so the real product is always shown.

   Run: node tools/routine-carousels.js
*/
const fs = require("fs"); const path = require("path");
const { OUT, ROOT, writeCards, cleanBuf, setCardTotal, cardHook, cardLine, cardCTA } = require("./carousels.js");

// step = { slug (bg product), eyebrow, headline, body }
const ROUTINES = [
  {
    id: "routine-w", hookBg: "p4-modelf", ctaBg: "p4-vanity",
    name: { de: "Abend-Routine (Anti-Aging)", nl: "Avondroutine (Anti-Aging)" },
    de: {
      hook: { eyebrow: "Abend-Routine", headline: "In 4 Schritten zu glatterer Haut" },
      steps: [
        { slug: "p1", eyebrow: "Schritt 1 · Reinigen", headline: "Sanft reinigen", body: "Entfernt Make-up und Unreinheiten, ohne die Haut auszutrocknen." },
        { slug: "p3", eyebrow: "Schritt 2 · Tonisieren", headline: "Poren klären", body: "Klärt die Poren und bereitet die Haut auf die Pflege vor." },
        { slug: "p4", eyebrow: "Schritt 3 · Retinol-Alternative", headline: "Verfeinern mit Bidens Pilosa", body: "Pflanzliche Retinol-Alternative für eine sichtbar feinere Textur." },
        { slug: "cream", eyebrow: "Schritt 4 · Pflegen", headline: "Feuchtigkeit einschließen", body: "Beruhigt und stärkt die Hautbarriere über Nacht." },
      ],
      cta: { eyebrow: "Deine Routine", headline: "Sichtbar glattere Haut über Nacht", button: "Routine shoppen", save: "Für später speichern" },
    },
    nl: {
      hook: { eyebrow: "Avondroutine", headline: "In 4 stappen naar een gladdere huid" },
      steps: [
        { slug: "p1", eyebrow: "Stap 1 · Reinigen", headline: "Mild reinigen", body: "Verwijdert make-up en onzuiverheden zonder uit te drogen." },
        { slug: "p3", eyebrow: "Stap 2 · Toner", headline: "Poriën zuiveren", body: "Zuivert de poriën en bereidt de huid voor op verzorging." },
        { slug: "p4", eyebrow: "Stap 3 · Retinol-alternatief", headline: "Verfijnen met Bidens Pilosa", body: "Plantaardig retinol-alternatief voor een zichtbaar fijnere textuur." },
        { slug: "cream", eyebrow: "Stap 4 · Verzorgen", headline: "Hydratatie vergrendelen", body: "Kalmeert en versterkt de huidbarrière 's nachts." },
      ],
      cta: { eyebrow: "Jouw routine", headline: "Zichtbaar gladdere huid 's ochtends", button: "Routine shoppen", save: "Bewaar voor later" },
    },
  },
  {
    id: "routine-m", hookBg: "cream-modelm", ctaBg: "cream-vanity",
    name: { de: "Männer-Routine (3 Schritte)", nl: "Mannenroutine (3 stappen)" },
    de: {
      hook: { eyebrow: "Deine Routine", headline: "Gepflegte Haut in 3 Schritten" },
      steps: [
        { slug: "p1", eyebrow: "Schritt 1 · Reinigen", headline: "Klären", body: "Entfernt Schweiß, Talg und Unreinheiten des Tages." },
        { slug: "pep", eyebrow: "Schritt 2 · Stärken", headline: "Leichtes Peptid-Serum", body: "Für sichtbar straffere, frischere Haut — zieht sofort ein." },
        { slug: "cream", eyebrow: "Schritt 3 · Pflegen", headline: "Feuchtigkeit & Schutz", body: "Spendet Feuchtigkeit, beruhigt und stärkt die Haut." },
      ],
      cta: { eyebrow: "Unkompliziert", headline: "Einfache Pflege, sichtbare Wirkung", button: "Jetzt starten", save: "Für später speichern" },
    },
    nl: {
      hook: { eyebrow: "Jouw routine", headline: "Verzorgde huid in 3 stappen" },
      steps: [
        { slug: "p1", eyebrow: "Stap 1 · Reinigen", headline: "Reinigen", body: "Verwijdert zweet, talg en onzuiverheden van de dag." },
        { slug: "pep", eyebrow: "Stap 2 · Versterken", headline: "Licht peptideserum", body: "Voor zichtbaar stevigere, frissere huid — trekt direct in." },
        { slug: "cream", eyebrow: "Stap 3 · Verzorgen", headline: "Hydratatie & bescherming", body: "Hydrateert, kalmeert en versterkt de huid." },
      ],
      cta: { eyebrow: "Simpel", headline: "Eenvoudige verzorging, zichtbaar effect", button: "Nu starten", save: "Bewaar voor later" },
    },
  },
];

async function buildRoutine(def, lang, manifest) {
  const c = def[lang];
  const total = 2 + c.steps.length; // hook + steps + cta
  setCardTotal(total);
  const cards = [];
  cards.push(await cardHook(cleanBuf(def.hookBg), { hook: c.hook }, lang));
  let idx = 2;
  for (const s of c.steps) {
    cards.push(await cardLine(cleanBuf(`${s.slug}-hero`), idx, s.eyebrow, s.headline, s.body, lang));
    idx++;
  }
  cards.push(await cardCTA(cleanBuf(def.ctaBg), { cta: c.cta }, lang));
  const p = { slug: def.id, name: def.name[lang] };
  writeCards(p, lang, cards, manifest, { hook: c.hook, steps: c.steps, cta: c.cta });
  console.log(`✓ ${def.id} / ${lang.toUpperCase()} — ${total} cards`);
}

async function main() {
  const manifest = [];
  for (const def of ROUTINES) for (const lang of ["de", "nl"]) await buildRoutine(def, lang, manifest);
  const mf = path.join(OUT, "carousels.json");
  const prev = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : [];
  // drop any prior routine entries, append fresh
  const merged = prev.filter(x => !manifest.some(m => m.product === x.product && m.lang === x.lang)).concat(manifest);
  fs.writeFileSync(mf, JSON.stringify(merged, null, 0));
  console.log(`\n✓ Done. ${manifest.length} routine carousels · ${merged.length} total entries.`);
}
main().catch(e => { console.error(e); process.exit(1); });
