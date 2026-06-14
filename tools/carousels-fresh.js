/* FROM-SCRATCH product carousels (DE + NL) — insight-led architecture.
   Structure derived from /ad-creative + /marketing-psychology + /marketing-ideas:
     1 HOOK     curiosity gap / "the mistake"     (open loop — Zeigarnik)
     2 MISTAKE  agitate the relatable behaviour   (loss aversion)
     3 REFRAME  the useful truth, given freely     (reciprocity — value first)
     4 PRODUCT  now it earns its intro             (JTBD — the answer, not a feature)
     5 PROOF    review where we have one, else certs (social proof / authority)
     6 CTA      outcome-named + save nudge

   Hand-written native DE/NL, EU Reg. 655/2013-compliant (soft, appearance-based claims,
   du/je form, no invented numbers or timeframes). ZERO API tokens.

   Renders to new slugs ("<slug>-v2") so the existing carousels are kept untouched.
   Rebuilds carousels.json with the NEW carousels FIRST (best first impression),
   existing product carousels pushed to the end of the queue.

   Run: node tools/carousels-fresh.js
*/
const fs = require("fs"); const path = require("path");
const { OUT, ROOT, writeCards, cleanBuf, setCardTotal, cardHook, cardLine, cardProof, cardCTA } = require("./carousels.js");
const CARDIMG = path.join(OUT, "_cardimg");
const tex = slug => fs.readFileSync(path.join(CARDIMG, `${slug}-texture.jpg`));

const CERT = {
  de: ["ECOCERT COSMOS Natural", "Vegan & tierversuchsfrei", "Hergestellt in der EU"],
  nl: ["ECOCERT COSMOS Natural", "Vegan & dierproefvrij", "Gemaakt in de EU"],
};
const CERT_HAIR = {
  de: ["ECOCERT COSMOS Natural", "Dermatologisch getestet", "Vegan & tierversuchsfrei"],
  nl: ["ECOCERT COSMOS Natural", "Dermatologisch getest", "Vegan & dierproefvrij"],
};

// order = posting order (new queue). p3 first — it carries Emma's real review.
const PRODUCTS = [
  { slug: "p3", name: "Purifying Toner",
    de: {
      hook:    { eyebrow: "Fettige & Mischhaut", headline: "Der häufigste Fehler bei Glanz" },
      mistake: { eyebrow: "Der Fehler", headline: "Du wäschst, sobald es glänzt", body: "Zu häufiges, scharfes Reinigen kann die Haut austrocknen — der Glanz kommt nur schneller zurück." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Klären statt austrocknen", body: "Eine sanfte, duftfreie Klärung hält die Poren frei, ohne die Haut zu strapazieren." },
      product: { eyebrow: "Dafür gemacht", headline: "Der Purifying Toner", body: "Duftfrei, klärt die Poren und bringt fettige sowie Mischhaut in Balance." },
      proof:   { eyebrow: "Echte Bewertung", headline: "Fünf Sterne aus Berlin", review: { stars: 5, quote: "Fühlt sich leicht an — und meine T-Zone wirkt den ganzen Tag ruhiger.", by: "Emma, Berlin" } },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Bring deine T-Zone in Balance", button: "Zum Toner", save: "Speichern für deine Routine" },
    },
    nl: {
      hook:    { eyebrow: "Vette & gemengde huid", headline: "De meestgemaakte fout bij glans" },
      mistake: { eyebrow: "De fout", headline: "Je wast zodra het glimt", body: "Te vaak en te streng reinigen kan de huid uitdrogen — de glans komt sneller terug." },
      reframe: { eyebrow: "De betere manier", headline: "Zuiveren in plaats van uitdrogen", body: "Een milde, geurvrije zuivering houdt de poriën vrij zonder de huid te belasten." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "De Purifying Toner", body: "Geurvrij, zuivert de poriën en brengt vette en gemengde huid in balans." },
      proof:   { eyebrow: "Echte review", headline: "Vijf sterren uit Berlijn", review: { stars: 5, quote: "Voelt licht aan — en mijn T-zone oogt de hele dag rustiger.", by: "Emma, Berlijn" } },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Breng je T-zone in balans", button: "Naar de toner", save: "Bewaar voor je routine" },
    },
  },
  { slug: "pep", name: "Peptide Anti-Aging Serum",
    de: {
      hook:    { eyebrow: "Feine Linien", headline: "Anti-Aging muss nicht brennen" },
      mistake: { eyebrow: "Der Fehler", headline: "Stärker heißt nicht besser", body: "Zu aggressive Wirkstoffe können trockene Haut reizen, statt sie zu glätten." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Sanft glätten mit Peptiden", body: "Peptide unterstützen die Haut behutsam — für ein praller wirkendes Hautbild." },
      product: { eyebrow: "Dafür gemacht", headline: "Peptide Anti-Aging Serum", body: "Mit 2% Hexapeptide-11 und Ginkgo Biloba für sichtbar geglättete Linien." },
      proof:   { eyebrow: "Unser Standard", headline: "Zertifiziert sauber, konsequent vegan", points: CERT.de },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Für ein sichtbar geglättetes Hautbild", button: "Zum Serum", save: "Speichern für deine Routine" },
    },
    nl: {
      hook:    { eyebrow: "Fijne lijntjes", headline: "Anti-aging hoeft niet te prikken" },
      mistake: { eyebrow: "De fout", headline: "Sterker is niet beter", body: "Te agressieve actieve stoffen kunnen een droge huid irriteren in plaats van gladder maken." },
      reframe: { eyebrow: "De betere manier", headline: "Zacht gladmaken met peptiden", body: "Peptiden ondersteunen de huid mild — voor een voller ogende huid." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "Peptide Anti-Aging Serum", body: "Met 2% Hexapeptide-11 en Ginkgo Biloba voor zichtbaar gladdere lijntjes." },
      proof:   { eyebrow: "Onze standaard", headline: "Gecertificeerd schoon, altijd vegan", points: CERT.nl },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Voor een zichtbaar gladdere huid", button: "Naar het serum", save: "Bewaar voor je routine" },
    },
  },
  { slug: "p4", name: "Retinol Alternative Serum",
    de: {
      hook:    { eyebrow: "Retinol", headline: "Retinol gereizt? Es geht auch sanft" },
      mistake: { eyebrow: "Der Fehler", headline: "Sich durch die Reizung kämpfen", body: "Rötung und Schuppung gehören nicht dazu — gereizte Haut wirkt nicht feiner." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Verfeinern ohne Reizung", body: "Eine pflanzliche Retinol-Alternative glättet die Textur sanft." },
      product: { eyebrow: "Dafür gemacht", headline: "Retinol Alternative Serum", body: "Mit 2% Bidens Pilosa für ein sichtbar feineres Hautbild — für jeden Hauttyp." },
      proof:   { eyebrow: "Unser Standard", headline: "Zertifiziert sauber, konsequent vegan", points: CERT.de },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Glattere Textur, ganz ohne Reizung", button: "Zum Serum", save: "Speichern für deine Routine" },
    },
    nl: {
      hook:    { eyebrow: "Retinol", headline: "Geïrriteerd van retinol? Het kan zacht" },
      mistake: { eyebrow: "De fout", headline: "Je door de irritatie heen worstelen", body: "Roodheid en vervelling horen er niet bij — een geïrriteerde huid oogt niet fijner." },
      reframe: { eyebrow: "De betere manier", headline: "Verfijnen zonder irritatie", body: "Een plantaardig retinol-alternatief maakt de textuur zacht gladder." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "Retinol Alternative Serum", body: "Met 2% Bidens Pilosa voor een zichtbaar fijnere huid — voor elk huidtype." },
      proof:   { eyebrow: "Onze standaard", headline: "Gecertificeerd schoon, altijd vegan", points: CERT.nl },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Gladdere textuur, zonder irritatie", button: "Naar het serum", save: "Bewaar voor je routine" },
    },
  },
  { slug: "cream", name: "Sensitive Moisturizing Cream",
    de: {
      hook:    { eyebrow: "Empfindliche Haut", headline: "Reagiert deine Haut auf fast alles?" },
      mistake: { eyebrow: "Der Fehler", headline: "Mehr Produkte, mehr Reaktion", body: "Duftstoffe und zu viele Schritte können empfindliche Haut zusätzlich reizen." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Weniger, dafür duftfrei", body: "Eine duftfreie Pflege beruhigt und stärkt die Hautbarriere." },
      product: { eyebrow: "Dafür gemacht", headline: "Sensitive Moisturizing Cream", body: "Duftfrei, beruhigt und stärkt empfindliche Haut spürbar." },
      proof:   { eyebrow: "Unser Standard", headline: "Zertifiziert sauber, konsequent vegan", points: CERT.de },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Beruhigte, gestärkte Haut", button: "Zur Creme", save: "Speichern für deine Routine" },
    },
    nl: {
      hook:    { eyebrow: "Gevoelige huid", headline: "Reageert je huid op bijna alles?" },
      mistake: { eyebrow: "De fout", headline: "Meer producten, meer reactie", body: "Geurstoffen en te veel stappen kunnen een gevoelige huid extra prikkelen." },
      reframe: { eyebrow: "De betere manier", headline: "Minder, en geurvrij", body: "Een geurvrije verzorging kalmeert en versterkt de huidbarrière." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "Sensitive Moisturizing Cream", body: "Geurvrij, kalmeert en versterkt de gevoelige huid voelbaar." },
      proof:   { eyebrow: "Onze standaard", headline: "Gecertificeerd schoon, altijd vegan", points: CERT.nl },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Een gekalmeerde, sterkere huid", button: "Naar de crème", save: "Bewaar voor je routine" },
    },
  },
  { slug: "p1", name: "Radiant Glow Cleanser",
    de: {
      hook:    { eyebrow: "Reinigung", headline: "Der Fehler, der deinen Glow kostet" },
      mistake: { eyebrow: "Der Fehler", headline: "Es quietscht, also ist es sauber?", body: "Dieses spannende „quietschsaubere“ Gefühl heißt oft: zu viel abgetragen." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Sauber, ohne zu strapazieren", body: "Eine sanfte Reinigung löst Unreinheiten und lässt die Haut frisch wirken." },
      product: { eyebrow: "Dafür gemacht", headline: "Radiant Glow Cleanser", body: "Mildes tägliches Reinigen für einen sichtbar frischen, strahlenden Teint." },
      proof:   { eyebrow: "Unser Standard", headline: "Zertifiziert sauber, konsequent vegan", points: CERT.de },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Reinigen, das deinen Glow bewahrt", button: "Zum Cleanser", save: "Speichern für deine Routine" },
    },
    nl: {
      hook:    { eyebrow: "Reiniging", headline: "De fout die je glow kost" },
      mistake: { eyebrow: "De fout", headline: "Piept, dus schoon?", body: "Dat strakke „piepschone“ gevoel betekent vaak: te veel weggehaald." },
      reframe: { eyebrow: "De betere manier", headline: "Schoon, zonder uit te putten", body: "Een milde reiniging lost onzuiverheden op en laat de huid fris ogen." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "Radiant Glow Cleanser", body: "Milde dagelijkse reiniging voor een zichtbaar frisse, stralende huid." },
      proof:   { eyebrow: "Onze standaard", headline: "Gecertificeerd schoon, altijd vegan", points: CERT.nl },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Reinigen dat je glow bewaart", button: "Naar de cleanser", save: "Bewaar voor je routine" },
    },
  },
  { slug: "p2", name: "Sensitive Scalp Shampoo", hair: true,
    de: {
      hook:    { eyebrow: "Empfindliche Kopfhaut", headline: "Juckt die Kopfhaut? Schau aufs Shampoo" },
      mistake: { eyebrow: "Der Fehler", headline: "Zu scharf für empfindliche Kopfhaut", body: "Aggressive Tenside und Duftstoffe können eine sensible Kopfhaut reizen." },
      reframe: { eyebrow: "Der bessere Weg", headline: "Sanft reinigen, Kopfhaut beruhigen", body: "Eine milde, dermatologisch getestete Formel reinigt, ohne zu reizen." },
      product: { eyebrow: "Dafür gemacht", headline: "Sensitive Scalp Shampoo", body: "Beruhigend, dermatologisch getestet und für jedes Haar geeignet." },
      proof:   { eyebrow: "Unser Standard", headline: "Zertifiziert sauber, konsequent vegan", points: CERT_HAIR.de },
      cta:     { eyebrow: "Dein nächster Schritt", headline: "Schluss mit gereizter Kopfhaut", button: "Zum Shampoo", save: "Speichern für später" },
    },
    nl: {
      hook:    { eyebrow: "Gevoelige hoofdhuid", headline: "Jeukt je hoofdhuid? Kijk naar je shampoo" },
      mistake: { eyebrow: "De fout", headline: "Te agressief voor een gevoelige hoofdhuid", body: "Scherpe reinigingsstoffen en geurstoffen kunnen een gevoelige hoofdhuid prikkelen." },
      reframe: { eyebrow: "De betere manier", headline: "Mild reinigen, hoofdhuid kalmeren", body: "Een milde, dermatologisch geteste formule reinigt zonder te irriteren." },
      product: { eyebrow: "Daarvoor gemaakt", headline: "Sensitive Scalp Shampoo", body: "Kalmerend, dermatologisch getest en geschikt voor elk haartype." },
      proof:   { eyebrow: "Onze standaard", headline: "Gecertificeerd schoon, altijd vegan", points: CERT_HAIR.nl },
      cta:     { eyebrow: "Jouw volgende stap", headline: "Gedaan met een geïrriteerde hoofdhuid", button: "Naar de shampoo", save: "Bewaar voor later" },
    },
  },
];

async function buildOne(def, lang) {
  const s = def.slug, c = def[lang];
  setCardTotal(6);
  const cards = await Promise.all([
    cardHook(cleanBuf(`${s}-modelf`), c, lang),                                              // 1 hook — face
    cardLine(tex(s), 2, c.mistake.eyebrow, c.mistake.headline, c.mistake.body, lang),         // 2 mistake — texture
    cardLine(cleanBuf(`${s}-flatlay`), 3, c.reframe.eyebrow, c.reframe.headline, c.reframe.body, lang), // 3 reframe — flatlay
    cardLine(cleanBuf(`${s}-hero`), 4, c.product.eyebrow, c.product.headline, c.product.body, lang),    // 4 product — hero
    cardProof(cleanBuf(`${s}-vanity`), c, lang),                                             // 5 proof — vanity
    cardCTA(cleanBuf(`${s}-modelm`), c, lang),                                               // 6 cta — model
  ]);
  return cards;
}

async function main() {
  const fresh = [];
  for (const def of PRODUCTS) {
    for (const lang of ["de", "nl"]) {
      const cards = await buildOne(def, lang);
      const p = { slug: `${def.slug}-v2`, name: def.name };
      writeCards(p, lang, cards, fresh, def[lang]);
      console.log(`✓ ${def.slug}-v2 / ${lang.toUpperCase()} — 6 cards`);
    }
  }
  // rebuild manifest: NEW first (best first impression), then everything existing
  const mf = path.join(OUT, "carousels.json");
  const prev = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : [];
  // drop any prior -v2 entries so re-runs are idempotent
  const keep = prev.filter(x => !fresh.some(f => f.product === x.product && f.lang === x.lang));
  const merged = fresh.concat(keep);
  fs.writeFileSync(mf, JSON.stringify(merged, null, 0));
  console.log(`\n✓ Done. ${fresh.length} fresh carousels (queued first) · ${merged.length} total entries.`);
}
main().catch(e => { console.error(e); process.exit(1); });
