/* Generate trilingual (EN/DE/NL) social captions + hashtags for the photoreal
   library (30 concepts: 6 products x 5 scenes) -> marketing/social/captions.json.
   EU-compliant: claims trace to on-site product descriptions. Run: node tools/gen-captions.js */
const fs = require("fs"); const path = require("path");
const OUT = path.join(__dirname, "..", "marketing", "social", "captions.json");

const HASH = {
  en: "#veganskincare #sensitiveskin #cleanbeauty #crueltyfree #cosmosnatural #skincareroutine #madeintheeu #eliraliving",
  de: "#vegankosmetik #empfindlichehaut #naturkosmetik #tierversuchsfrei #cosmosnatural #hautpflege #madeineu #eliraliving",
  nl: "#veganskincare #gevoeligehuid #natuurlijkehuidverzorging #dierproefvrij #cosmosnatural #huidverzorging #eliraliving",
};
const BAR = { en: "Vegan · cruelty-free · COSMOS Natural · made in the EU", de: "Vegan · tierversuchsfrei · COSMOS Natural · in der EU hergestellt", nl: "Veganistisch · dierproefvrij · COSMOS Natural · gemaakt in de EU" };
const CTA = { en: "Shop the range → eliraliving.com", de: "Zur Kollektion → eliraliving.com", nl: "Bekijk de collectie → eliraliving.com" };

const PRODUCTS = [
  { slug: "pep", name: "Peptide Anti-Aging Serum",
    hook: { en: "Visibly softer fine lines — none of the sting.", de: "Sichtbar glattere Fältchen – ganz ohne Brennen.", nl: "Zichtbaar gladdere lijntjes – zonder branderig gevoel." },
    benefit: { en: "2% Hexapeptide-11 + Ginkgo Biloba visibly soften fine lines for plumper, firmer skin — for normal to dry skin.", de: "2% Hexapeptid-11 + Ginkgo Biloba glätten sichtbar Fältchen für prallere, festere Haut – für normale bis trockene Haut.", nl: "2% Hexapeptide-11 + Ginkgo Biloba verzachten zichtbaar lijntjes voor een voller, steviger huid — voor de normale tot droge huid." } },
  { slug: "p4", name: "Retinol Alternative Serum",
    hook: { en: "Retinol results, plant-based.", de: "Retinol-Effekt, pflanzlich.", nl: "Retinol-effect, plantaardig." },
    benefit: { en: "2% Bidens Pilosa refines skin texture and softens fine lines — without the irritation.", de: "2% Bidens Pilosa verfeinert die Hautstruktur und glättet Fältchen – ohne Reizungen.", nl: "2% Bidens Pilosa verfijnt de huidstructuur en verzacht lijntjes – zonder irritatie." } },
  { slug: "cream", name: "Sensitive Moisturizing Cream",
    hook: { en: "Calm, comforted, fragrance-free.", de: "Beruhigt, gepflegt, parfümfrei.", nl: "Gekalmeerd, verzorgd, parfumvrij." },
    benefit: { en: "Soothes and strengthens sensitive skin, every day.", de: "Beruhigt und stärkt empfindliche Haut, jeden Tag.", nl: "Kalmeert en versterkt de gevoelige huid, elke dag." } },
  { slug: "p1", name: "Radiant Glow Cleanser",
    hook: { en: "A clean that never strips.", de: "Sauber, ohne auszutrocknen.", nl: "Schoon, zonder uit te drogen." },
    benefit: { en: "Lifts away impurities for fresh, radiant skin.", de: "Entfernt Unreinheiten für frische, strahlende Haut.", nl: "Verwijdert onzuiverheden voor een frisse, stralende huid." } },
  { slug: "p3", name: "Purifying Toner",
    hook: { en: "Clear pores, kept in balance.", de: "Klare Poren, im Gleichgewicht.", nl: "Heldere poriën, in balans." },
    benefit: { en: "Clarifies oily and combination skin — fragrance-free.", de: "Klärt fettige und Mischhaut – parfümfrei.", nl: "Zuivert de vette en gemengde huid – parfumvrij." } },
  { slug: "p2", name: "Sensitive Scalp Shampoo",
    hook: { en: "Gentle on the most reactive scalps.", de: "Sanft zur empfindlichsten Kopfhaut.", nl: "Zacht voor de meest gevoelige hoofdhuid." },
    benefit: { en: "Soothing, dermatologically tested care for all hair types.", de: "Beruhigende, dermatologisch getestete Pflege für jeden Haartyp.", nl: "Kalmerende, dermatologisch geteste verzorging voor elk haartype." } },
];
const SCENE = {
  hero: { en: "", de: "", nl: "" },
  vanity: { en: "Slow mornings start here.", de: "Ruhige Morgen beginnen hier.", nl: "Rustige ochtenden beginnen hier." },
  modelf: { en: "Strong results, soft on you.", de: "Starke Ergebnisse, sanft zu dir.", nl: "Sterke resultaten, zacht voor jou." },
  modelm: { en: "Skincare, for everyone.", de: "Hautpflege, für alle.", nl: "Huidverzorging, voor iedereen." },
  flatlay: { en: "Plant-powered, properly certified.", de: "Pflanzenkraft, echt zertifiziert.", nl: "Plantkracht, echt gecertificeerd." },
};
const SCENES = ["hero", "vanity", "modelf", "modelm", "flatlay"];

const out = [];
for (const p of PRODUCTS) for (const s of SCENES) for (const lang of ["en", "de", "nl"]) {
  const angle = SCENE[s][lang] ? SCENE[s][lang] + " " : "";
  const caption = `${p.hook[lang]}\n\n${angle}${p.benefit[lang]}\n\n${BAR[lang]}\n${CTA[lang]}\n\n${HASH[lang]}`;
  out.push({ product: p.slug, name: p.name, scene: s, lang, file: `marketing/social/nano/post/${lang}/${p.slug}-${s}.jpg`, caption });
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`✓ captions.json — ${out.length} captions (${out.length / 3} concepts × 3 languages)`);
