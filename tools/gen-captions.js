/* Generate trilingual (EN/DE/NL) social captions for the photoreal solo-post library
   (6 products × 5 scenes = 30 concepts × 3 languages = 90 posts).

   Rebuilt with /ad-creative + /marketing-psychology + /marketing-ideas:
   each SCENE carries a distinct angle so the 5 posts per product aren't repetitive —
     hero    → outcome promise        (the benefit as aspiration)
     modelf  → problem / open loop     (relatable pain — Zeigarnik)
     modelm  → social proof / unity    (review where we have one, else inclusivity)
     vanity  → ritual / identity       (slow-living, the feeling)
     flatlay → authority / mechanism   (ingredient + certification proof)

   EU Reg. 655/2013-compliant: soft, appearance-based claims; no invented numbers or
   timeframes (only the substantiated % actives). Hand-written native copy, 0 API tokens.

   Outputs: marketing/social/captions.json  +  media-worker/public/posts.json (public manifest)
   Run: node tools/gen-captions.js
*/
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "marketing", "social", "captions.json");
const PUBPOSTS = path.join(ROOT, "media-worker", "public", "posts.json");

const HASH = {
  en: "#veganskincare #sensitiveskin #cleanbeauty #crueltyfree #cosmosnatural #skincareroutine #madeintheeu #eliraliving",
  de: "#vegankosmetik #empfindlichehaut #naturkosmetik #tierversuchsfrei #cosmosnatural #hautpflege #madeineu #eliraliving",
  nl: "#veganskincare #gevoeligehuid #natuurlijkehuidverzorging #dierproefvrij #cosmosnatural #huidverzorging #eliraliving",
};
const BAR = { en: "Vegan · cruelty-free · COSMOS Natural · made in the EU", de: "Vegan · tierversuchsfrei · COSMOS Natural · in der EU hergestellt", nl: "Veganistisch · dierproefvrij · COSMOS Natural · gemaakt in de EU" };
const CTA = { en: "Shop the range → eliraliving.com", de: "Zur Kollektion → eliraliving.com", nl: "Bekijk de collectie → eliraliving.com" };

const PRODUCTS = [
  { slug: "pep", name: "Peptide Anti-Aging Serum",
    benefit: { en: "2% Hexapeptide-11 + Ginkgo Biloba visibly soften fine lines for plumper, firmer-looking skin — for normal to dry skin.", de: "2% Hexapeptid-11 + Ginkgo Biloba glätten sichtbar Fältchen für prallere, festere Haut – für normale bis trockene Haut.", nl: "2% Hexapeptide-11 + Ginkgo Biloba verzachten zichtbaar lijntjes voor een voller, steviger ogende huid — voor de normale tot droge huid." },
    angles: {
      hero:    { en: "Visibly softer fine lines — none of the sting.", de: "Sichtbar glattere Fältchen – ganz ohne Brennen.", nl: "Zichtbaar gladdere lijntjes – zonder branderig gevoel." },
      modelf:  { en: "The anti-aging mistake that makes lines look worse.", de: "Der Anti-Aging-Fehler, der Linien betont.", nl: "De anti-agingfout die lijntjes juist benadrukt." },
      modelm:  { en: "Gentle enough for every skin, strong enough to show.", de: "Sanft genug für jede Haut, stark genug, um zu wirken.", nl: "Zacht genoeg voor elke huid, sterk genoeg om te zien." },
      vanity:  { en: "Two drops. The quietest part of your evening.", de: "Zwei Tropfen. Der ruhigste Moment deines Abends.", nl: "Twee druppels. Het rustigste moment van je avond." },
      flatlay: { en: "2% Hexapeptide-11 + Ginkgo Biloba — the proof is on the label.", de: "2% Hexapeptid-11 + Ginkgo Biloba – der Beweis steht drauf.", nl: "2% Hexapeptide-11 + Ginkgo Biloba — het bewijs staat erop." },
    } },
  { slug: "p4", name: "Retinol Alternative Serum",
    benefit: { en: "2% Bidens Pilosa refines skin texture and softens fine lines — without the irritation. Suitable for all skin types.", de: "2% Bidens Pilosa verfeinert die Hautstruktur und glättet Fältchen – ohne Reizungen. Für jeden Hauttyp.", nl: "2% Bidens Pilosa verfijnt de huidstructuur en verzacht lijntjes – zonder irritatie. Geschikt voor elk huidtype." },
    angles: {
      hero:    { en: "Retinol results, plant-based.", de: "Retinol-Effekt, pflanzlich.", nl: "Retinol-effect, plantaardig." },
      modelf:  { en: "Retinol left your skin red? It doesn't have to.", de: "Retinol gereizt? Das muss nicht sein.", nl: "Geïrriteerd van retinol? Dat hoeft niet." },
      modelm:  { en: "Smoother-looking texture, for every skin type.", de: "Sichtbar feinere Textur, für jeden Hauttyp.", nl: "Zichtbaar fijnere textuur, voor elk huidtype." },
      vanity:  { en: "The night step that does the quiet work.", de: "Der Abendschritt, der leise arbeitet.", nl: "De avondstap die rustig zijn werk doet." },
      flatlay: { en: "2% Bidens Pilosa — a plant-based retinol alternative.", de: "2% Bidens Pilosa – die pflanzliche Retinol-Alternative.", nl: "2% Bidens Pilosa — het plantaardige retinol-alternatief." },
    } },
  { slug: "cream", name: "Sensitive Moisturizing Cream",
    benefit: { en: "Fragrance-free care that soothes and strengthens sensitive skin, every day.", de: "Parfümfreie Pflege, die empfindliche Haut beruhigt und stärkt – jeden Tag.", nl: "Parfumvrije verzorging die de gevoelige huid kalmeert en versterkt, elke dag." },
    angles: {
      hero:    { en: "Calm, comforted, fragrance-free.", de: "Beruhigt, gepflegt, parfümfrei.", nl: "Gekalmeerd, verzorgd, parfumvrij." },
      modelf:  { en: "Does your skin react to almost everything?", de: "Reagiert deine Haut auf fast alles?", nl: "Reageert je huid op bijna alles?" },
      modelm:  { en: "The simplest step for skin that's had enough.", de: "Der einfachste Schritt für gereizte Haut.", nl: "De simpelste stap voor een huid die genoeg heeft." },
      vanity:  { en: "Fewer products. Calmer skin.", de: "Weniger Produkte. Ruhigere Haut.", nl: "Minder producten. Een rustigere huid." },
      flatlay: { en: "Fragrance-free and COSMOS Natural certified.", de: "Parfümfrei und COSMOS Natural zertifiziert.", nl: "Parfumvrij en COSMOS Natural gecertificeerd." },
    } },
  { slug: "p1", name: "Radiant Glow Cleanser",
    benefit: { en: "A gentle daily cleanser that lifts away impurities for fresh, radiant-looking skin.", de: "Ein mildes tägliches Reinigungsgel, das Unreinheiten entfernt – für frische, strahlende Haut.", nl: "Een milde dagelijkse reiniger die onzuiverheden verwijdert voor een frisse, stralende huid." },
    angles: {
      hero:    { en: "A clean that never strips.", de: "Sauber, ohne auszutrocknen.", nl: "Schoon, zonder uit te drogen." },
      modelf:  { en: "That squeaky-clean feeling? It's stripped skin.", de: "Das quietschsaubere Gefühl? Ausgetrocknete Haut.", nl: "Dat piepschone gevoel? Een uitgedroogde huid." },
      modelm:  { en: "A daily clean that's gentle on everyone.", de: "Tägliche Reinigung, sanft zu allen.", nl: "Dagelijkse reiniging, zacht voor iedereen." },
      vanity:  { en: "Where slow mornings start.", de: "Wo ruhige Morgen beginnen.", nl: "Waar rustige ochtenden beginnen." },
      flatlay: { en: "Plant-powered and properly certified.", de: "Pflanzenkraft, echt zertifiziert.", nl: "Plantkracht, echt gecertificeerd." },
    } },
  { slug: "p3", name: "Purifying Toner",
    benefit: { en: "A fragrance-free toner that clears pores and brings oily and combination skin into balance.", de: "Ein parfümfreies Tonikum, das die Poren klärt und fettige sowie Mischhaut in Balance bringt.", nl: "Een parfumvrije toner die de poriën zuivert en de vette en gemengde huid in balans brengt." },
    angles: {
      hero:    { en: "Clear pores, kept in balance.", de: "Klare Poren, im Gleichgewicht.", nl: "Heldere poriën, in balans." },
      modelf:  { en: "Shiny by midday? You might be over-washing.", de: "Mittags-Glanz? Vielleicht wäschst du zu viel.", nl: "Glans tegen de middag? Misschien was je te vaak." },
      modelm:  { en: "Five stars, from Berlin.", de: "Fünf Sterne, aus Berlin.", nl: "Vijf sterren, uit Berlijn." },
      vanity:  { en: "The two-second step that balances your day.", de: "Der Zwei-Sekunden-Schritt für mehr Balance.", nl: "De tweesecondenstap die je dag in balans brengt." },
      flatlay: { en: "Fragrance-free and COSMOS Natural certified.", de: "Parfümfrei und COSMOS Natural zertifiziert.", nl: "Parfumvrij en COSMOS Natural gecertificeerd." },
    },
    // social-proof body for the modelm post (Emma's real 5★ review)
    review: { en: "“Feels light — and my T-zone looks calmer all day.” — Emma, Berlin", de: "„Fühlt sich leicht an – und meine T-Zone wirkt den ganzen Tag ruhiger.“ — Emma, Berlin", nl: "„Voelt licht aan – en mijn T-zone oogt de hele dag rustiger.“ — Emma, Berlijn" } },
  { slug: "p2", name: "Sensitive Scalp Shampoo",
    benefit: { en: "Soothing, dermatologically tested care for sensitive scalps — suitable for all hair types.", de: "Beruhigende, dermatologisch getestete Pflege für empfindliche Kopfhaut – für jeden Haartyp.", nl: "Kalmerende, dermatologisch geteste verzorging voor een gevoelige hoofdhuid — geschikt voor elk haartype." },
    angles: {
      hero:    { en: "Gentle on the most reactive scalps.", de: "Sanft zur empfindlichsten Kopfhaut.", nl: "Zacht voor de meest gevoelige hoofdhuid." },
      modelf:  { en: "Itchy scalp? Look at your shampoo first.", de: "Juckende Kopfhaut? Schau zuerst aufs Shampoo.", nl: "Jeukende hoofdhuid? Kijk eerst naar je shampoo." },
      modelm:  { en: "Soothing care for every hair type.", de: "Beruhigende Pflege für jeden Haartyp.", nl: "Kalmerende verzorging voor elk haartype." },
      vanity:  { en: "A wash ritual your scalp will thank you for.", de: "Ein Waschritual, das deine Kopfhaut liebt.", nl: "Een wasritueel waar je hoofdhuid dol op is." },
      flatlay: { en: "Dermatologically tested, COSMOS Natural certified.", de: "Dermatologisch getestet, COSMOS Natural zertifiziert.", nl: "Dermatologisch getest, COSMOS Natural gecertificeerd." },
    } },
];
const SCENES = ["hero", "vanity", "modelf", "modelm", "flatlay"];

const captions = [];   // local: marketing/social/captions.json
const posts = [];      // public manifest: media-worker/public/posts.json
for (const p of PRODUCTS) for (const s of SCENES) for (const lang of ["en", "de", "nl"]) {
  const hook = p.angles[s][lang];
  // p3's social-proof post leads the body with Emma's review, then the substantiated benefit
  const body = (s === "modelm" && p.review) ? `${p.review[lang]}\n\n${p.benefit[lang]}` : p.benefit[lang];
  const caption = `${hook}\n\n${body}\n\n${BAR[lang]}\n${CTA[lang]}\n\n${HASH[lang]}`;
  const rel = `post/${lang}/${p.slug}-${s}.jpg`;
  captions.push({ product: p.slug, name: p.name, scene: s, lang, angle: s, file: `marketing/social/nano/${rel}`, caption });
  posts.push({ path: rel, lang, product: p.slug, scene: s, caption });
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(captions, null, 1));
fs.writeFileSync(PUBPOSTS, JSON.stringify(posts, null, 1));
console.log(`✓ ${captions.length} captions → captions.json + media-worker/public/posts.json`);
console.log(`  5 distinct angles/product · Emma review on p3 modelm posts`);
