/* =========================================================================
   ELIRA LIVING — AIEO knowledge base (EN / DE / NL).
   Product FAQs, "how to use", and ingredient explanations. Build-time only.
   Feeds: product-page FAQ sections + FAQPage JSON-LD, the Ingredients page,
   and the llms.txt facts. Edit here, then: node build.js
   ========================================================================= */

// ---- How to use (per product, per language) -----------------------------
const USAGE = {
  "sensitive-moisturizing-cream": {
    en: "Apply morning and evening to clean skin as the last step of your routine. Suitable for daily use on sensitive skin.",
    de: "Morgens und abends als letzten Schritt der Pflege auf die gereinigte Haut auftragen. Für die tägliche Anwendung bei empfindlicher Haut geeignet.",
    nl: "Breng ’s ochtends en ’s avonds aan op de gereinigde huid als laatste stap van je routine. Geschikt voor dagelijks gebruik bij de gevoelige huid." },
  "radiant-glow-cleanser": {
    en: "Massage a small amount onto damp skin morning and evening, then rinse with lukewarm water.",
    de: "Eine kleine Menge morgens und abends auf die feuchte Haut einmassieren und mit lauwarmem Wasser abspülen.",
    nl: "Masseer ’s ochtends en ’s avonds een kleine hoeveelheid op de vochtige huid en spoel af met lauw water." },
  "purifying-toner": {
    en: "After cleansing, apply to the face with clean hands or a cotton pad, avoiding the eye area. Use morning and evening.",
    de: "Nach der Reinigung mit sauberen Händen oder einem Wattepad auf das Gesicht auftragen, die Augenpartie aussparen. Morgens und abends anwenden.",
    nl: "Breng na het reinigen aan op het gezicht met schone handen of een wattenschijfje, vermijd de oogcontour. Gebruik ’s ochtends en ’s avonds." },
  "sensitive-scalp-shampoo": {
    en: "Massage into wet hair and scalp, lather, then rinse thoroughly. Gentle enough for frequent use.",
    de: "In das nasse Haar und die Kopfhaut einmassieren, aufschäumen und gründlich ausspülen. Mild genug für die häufige Anwendung.",
    nl: "Masseer in nat haar en op de hoofdhuid, laat schuimen en spoel grondig uit. Mild genoeg voor frequent gebruik." },
  "retinol-alternative-serum": {
    en: "Cleanse your face and pat dry. Apply a few drops to face and neck and massage in gently. Use morning and/or evening, before moisturiser; avoid the eye area.",
    de: "Das Gesicht gründlich reinigen und leicht abtrocknen. Einige Tropfen auf Gesicht und Hals auftragen und sanft einmassieren. Morgens und/oder abends vor der Feuchtigkeitspflege anwenden; Augenkontakt vermeiden.",
    nl: "Reinig je gezicht en dep droog. Breng enkele druppels aan op gezicht en hals en masseer zachtjes in. Gebruik ’s ochtends en/of ’s avonds, vóór je moisturizer; vermijd de oogcontour." }
};

// ---- Product FAQs (the questions people ask AI about these products) ----
const PRODUCT_FAQ = {
  "sensitive-moisturizing-cream": {
    en: [
      { q: "Is this moisturizer suitable for sensitive or reactive skin?", a: "Yes. It is fragrance-free, vegan and ECOCERT COSMOS Organic certified, formulated to soothe and strengthen sensitive, easily-irritated skin." },
      { q: "Does it contain fragrance or essential oils?", a: "No — it is completely fragrance-free, which makes it a good choice for reactive, allergy-prone or eczema-prone skin." },
      { q: "Is it vegan and cruelty-free?", a: "Yes. Every Elira Living product is 100% vegan, cruelty-free and made in the EU." }
    ],
    de: [
      { q: "Ist diese Feuchtigkeitscreme für empfindliche oder reaktive Haut geeignet?", a: "Ja. Sie ist parfümfrei, vegan und ECOCERT COSMOS Organic zertifiziert und beruhigt und stärkt empfindliche, schnell gereizte Haut." },
      { q: "Enthält sie Parfüm oder ätherische Öle?", a: "Nein — sie ist vollständig parfümfrei und damit ideal für reaktive, allergie- oder ekzemanfällige Haut." },
      { q: "Ist sie vegan und tierversuchsfrei?", a: "Ja. Jedes Elira Living-Produkt ist 100 % vegan, tierversuchsfrei und in der EU hergestellt." }
    ],
    nl: [
      { q: "Is deze moisturizer geschikt voor de gevoelige of reactieve huid?", a: "Ja. Hij is parfumvrij, veganistisch en ECOCERT COSMOS Organic-gecertificeerd, en kalmeert en versterkt de gevoelige, snel geïrriteerde huid." },
      { q: "Bevat hij parfum of etherische oliën?", a: "Nee — hij is volledig parfumvrij, ideaal voor de reactieve, allergiegevoelige of eczeemgevoelige huid." },
      { q: "Is hij veganistisch en dierproefvrij?", a: "Ja. Elk Elira Living-product is 100% veganistisch, dierproefvrij en gemaakt in de EU." }
    ]
  },
  "radiant-glow-cleanser": {
    en: [
      { q: "What skin type is this facial cleanser for?", a: "All skin types, including normal and oily. It gently removes impurities and excess sebum without stripping or tightening the skin." },
      { q: "Is it a natural, vegan cleanser?", a: "Yes — vegan and ECOCERT COSMOS Natural certified, made with cleanly sourced ingredients." },
      { q: "How often should I use it?", a: "Daily, morning and evening. Massage onto damp skin and rinse." }
    ],
    de: [
      { q: "Für welchen Hauttyp ist dieser Gesichtsreiniger?", a: "Für alle Hauttypen, auch normale und fettige Haut. Er entfernt sanft Unreinheiten und überschüssigen Talg, ohne die Haut auszutrocknen." },
      { q: "Ist es ein natürlicher, veganer Reiniger?", a: "Ja — vegan und ECOCERT COSMOS Natural zertifiziert, mit sauber gewonnenen Inhaltsstoffen." },
      { q: "Wie oft sollte ich ihn verwenden?", a: "Täglich, morgens und abends. Auf die feuchte Haut einmassieren und abspülen." }
    ],
    nl: [
      { q: "Voor welk huidtype is deze gezichtsreiniger?", a: "Voor alle huidtypes, inclusief de normale en vette huid. Hij verwijdert mild onzuiverheden en overtollig talg zonder de huid uit te drogen." },
      { q: "Is het een natuurlijke, veganistische reiniger?", a: "Ja — veganistisch en ECOCERT COSMOS Natural-gecertificeerd, met zuiver gewonnen ingrediënten." },
      { q: "Hoe vaak moet ik hem gebruiken?", a: "Dagelijks, ’s ochtends en ’s avonds. Masseer op de vochtige huid en spoel af." }
    ]
  },
  "purifying-toner": {
    en: [
      { q: "Does this toner help with oily or blemish-prone skin?", a: "Yes. It clears pores of excess sebum and impurities and helps balance oily and combination skin, using salicylic acid with organic lavender water and cucumber." },
      { q: "Is the toner fragrance-free?", a: "Yes, there is no added perfume. It contains a small amount of alcohol typical of clarifying toners, balanced with glycerin and cucumber to keep skin supple." },
      { q: "How do I use a toner?", a: "After cleansing, apply to the face with clean hands or a cotton pad, avoiding the eyes, then follow with moisturiser." }
    ],
    de: [
      { q: "Hilft dieses Gesichtswasser bei fettiger oder unreiner Haut?", a: "Ja. Es befreit die Poren von überschüssigem Talg und Unreinheiten und gleicht fettige Mischhaut aus — mit Salicylsäure, Bio-Lavendelwasser und Gurke." },
      { q: "Ist das Gesichtswasser parfümfrei?", a: "Ja, ohne zugesetztes Parfüm. Es enthält etwas Alkohol, wie für klärende Toner üblich, ausgeglichen durch Glycerin und Gurke." },
      { q: "Wie verwende ich ein Gesichtswasser?", a: "Nach der Reinigung mit sauberen Händen oder einem Wattepad auftragen, die Augen aussparen, danach eine Feuchtigkeitspflege verwenden." }
    ],
    nl: [
      { q: "Helpt deze toner bij de vette of onzuivere huid?", a: "Ja. Hij verwijdert overtollig talg en onzuiverheden uit de poriën en brengt de vette/gemengde huid in balans, met salicylzuur, biologisch lavendelwater en komkommer." },
      { q: "Is de toner parfumvrij?", a: "Ja, zonder toegevoegd parfum. Hij bevat wat alcohol zoals gebruikelijk bij zuiverende toners, in balans gebracht met glycerine en komkommer." },
      { q: "Hoe gebruik ik een toner?", a: "Breng na het reinigen aan met schone handen of een wattenschijfje, vermijd de ogen, en gebruik daarna een moisturizer." }
    ]
  },
  "sensitive-scalp-shampoo": {
    en: [
      { q: "Is this shampoo good for a sensitive or itchy scalp?", a: "Yes. It is a gentle, dermatologically tested formula made for delicate, easily-irritated scalps and suitable for all hair types." },
      { q: "Is it vegan and sulfate-gentle?", a: "Yes — vegan, ECOCERT COSMOS Natural certified, and based on mild cleansers chosen for sensitive scalps." },
      { q: "Can I use it every day?", a: "Yes, it is gentle enough for frequent use. Massage into wet hair and scalp, lather, then rinse." }
    ],
    de: [
      { q: "Ist dieses Shampoo für eine empfindliche oder juckende Kopfhaut geeignet?", a: "Ja. Es ist eine sanfte, dermatologisch getestete Formel für empfindliche, schnell gereizte Kopfhaut und für alle Haartypen geeignet." },
      { q: "Ist es vegan und mild?", a: "Ja — vegan, ECOCERT COSMOS Natural zertifiziert und auf milden Reinigungssubstanzen für empfindliche Kopfhaut aufgebaut." },
      { q: "Kann ich es täglich verwenden?", a: "Ja, es ist mild genug für die häufige Anwendung. In nasses Haar und Kopfhaut einmassieren, aufschäumen und ausspülen." }
    ],
    nl: [
      { q: "Is deze shampoo goed voor een gevoelige of jeukende hoofdhuid?", a: "Ja. Het is een milde, dermatologisch geteste formule voor de gevoelige, snel geïrriteerde hoofdhuid en geschikt voor alle haartypes." },
      { q: "Is hij veganistisch en mild?", a: "Ja — veganistisch, ECOCERT COSMOS Natural-gecertificeerd en gebaseerd op milde reinigers voor de gevoelige hoofdhuid." },
      { q: "Kan ik hem elke dag gebruiken?", a: "Ja, hij is mild genoeg voor frequent gebruik. Masseer in nat haar en hoofdhuid, laat schuimen en spoel uit." }
    ]
  },
  "retinol-alternative-serum": {
    en: [
      { q: "Is this a real retinol?", a: "No — it's a gentle, plant-based retinol alternative built on 2% Bidens Pilosa, giving retinol-like smoothing benefits without the irritation, so it suits sensitive and all skin types." },
      { q: "How and when do I use the serum?", a: "Apply a few drops to clean skin morning and/or evening, before your moisturiser, and massage in gently. Avoid the eye area." },
      { q: "Is it vegan and certified?", a: "Yes — 100% vegan and COSMOS Natural certified by ECOCERT Greenlife, with 99% natural-origin ingredients and hyaluronic acid for hydration." }
    ],
    de: [
      { q: "Ist das echtes Retinol?", a: "Nein — es ist ein sanfter, pflanzlicher Retinol-Ersatz auf Basis von 2 % Bidens Pilosa. Er bietet retinolähnliche, glättende Effekte ohne Reizung und eignet sich für empfindliche sowie alle Hauttypen." },
      { q: "Wie und wann wende ich das Serum an?", a: "Einige Tropfen morgens und/oder abends vor der Feuchtigkeitspflege auf die gereinigte Haut auftragen und sanft einmassieren. Augenpartie aussparen." },
      { q: "Ist es vegan und zertifiziert?", a: "Ja — 100 % vegan und COSMOS Natural zertifiziert durch ECOCERT Greenlife, mit 99 % Inhaltsstoffen natürlichen Ursprungs und Hyaluronsäure für Feuchtigkeit." }
    ],
    nl: [
      { q: "Is dit echte retinol?", a: "Nee — het is een mild, plantaardig retinol-alternatief op basis van 2% Bidens Pilosa. Het geeft retinol-achtige, gladmakende voordelen zonder irritatie en is geschikt voor de gevoelige en alle huidtypes." },
      { q: "Hoe en wanneer gebruik ik het serum?", a: "Breng enkele druppels ’s ochtends en/of ’s avonds aan op de gereinigde huid, vóór je moisturizer, en masseer zachtjes in. Vermijd de oogcontour." },
      { q: "Is het veganistisch en gecertificeerd?", a: "Ja — 100% veganistisch en COSMOS Natural gecertificeerd door ECOCERT Greenlife, met 99% ingrediënten van natuurlijke oorsprong en hyaluronzuur voor hydratatie." }
    ]
  }
};

// ---- Ingredient glossary (for the Ingredients page) ---------------------
const INGREDIENTS = {
  en: [
    { name: "Lavender Flower Water", inci: "Lavandula Angustifolia Flower Water", what: "Organic floral water distilled from lavender.", why: "Calms and tones the skin and gives our toner its gentle, naturally derived base." },
    { name: "Cucumber Extract", inci: "Cucumis Sativus Fruit Extract", what: "Organic extract of cucumber fruit.", why: "Hydrates and refreshes, helping balance oily and combination skin." },
    { name: "Salicylic Acid", inci: "Salicylic Acid", what: "A beta-hydroxy acid (BHA).", why: "Gently clears excess sebum and helps keep pores clear, for fresher, clearer-looking skin." },
    { name: "Glycerin", inci: "Glycerin", what: "A plant-derived humectant, made using organic ingredients.", why: "Draws in and holds moisture so skin stays supple, not tight." },
    { name: "Betaine", inci: "Betaine", what: "A naturally derived moisturising agent.", why: "Adds gentle hydration and improves skin feel without heaviness." },
    { name: "Plum Extract", inci: "Prunus Domestica Fruit Extract", what: "Organic plum fruit extract.", why: "Conditions hair and scalp in our sensitive-scalp shampoo." },
    { name: "Linden Flower Extract", inci: "Tilia Cordata Flower Extract", what: "Organic linden (lime tree) flower extract.", why: "Soothes the scalp, supporting a comfortable, balanced feel." },
    { name: "Coco-Glucoside", inci: "Coco-Glucoside", what: "A mild, sugar- and coconut-derived cleanser.", why: "Cleanses gently — chosen for sensitive scalps instead of harsh detergents." }
  ],
  de: [
    { name: "Lavendelblütenwasser", inci: "Lavandula Angustifolia Flower Water", what: "Bio-Blütenwasser, aus Lavendel destilliert.", why: "Beruhigt und klärt die Haut und bildet die sanfte, natürliche Basis unseres Gesichtswassers." },
    { name: "Gurkenextrakt", inci: "Cucumis Sativus Fruit Extract", what: "Bio-Extrakt aus der Gurkenfrucht.", why: "Spendet Feuchtigkeit und erfrischt, hilft fettige Mischhaut auszugleichen." },
    { name: "Salicylsäure", inci: "Salicylic Acid", what: "Eine Beta-Hydroxysäure (BHA).", why: "Befreit sanft von überschüssigem Talg und hält die Poren frei — für ein frischeres, klareres Hautbild." },
    { name: "Glycerin", inci: "Glycerin", what: "Pflanzlicher Feuchthaltestoff, mit biologischen Zutaten hergestellt.", why: "Bindet Feuchtigkeit, damit die Haut geschmeidig statt spannend bleibt." },
    { name: "Betain", inci: "Betaine", what: "Ein natürlich gewonnener Feuchtigkeitsspender.", why: "Sorgt für sanfte Hydratation und ein angenehmes Hautgefühl ohne Schwere." },
    { name: "Pflaumenextrakt", inci: "Prunus Domestica Fruit Extract", what: "Bio-Extrakt aus der Pflaumenfrucht.", why: "Pflegt Haar und Kopfhaut in unserem Shampoo für empfindliche Kopfhaut." },
    { name: "Lindenblütenextrakt", inci: "Tilia Cordata Flower Extract", what: "Bio-Extrakt aus Lindenblüten.", why: "Beruhigt die Kopfhaut für ein angenehmes, ausgeglichenes Gefühl." },
    { name: "Coco-Glucoside", inci: "Coco-Glucoside", what: "Milder Reinigungsstoff aus Zucker und Kokos.", why: "Reinigt sanft — bewusst statt aggressiver Tenside für empfindliche Kopfhaut gewählt." }
  ],
  nl: [
    { name: "Lavendelbloemwater", inci: "Lavandula Angustifolia Flower Water", what: "Biologisch bloesemwater, gedistilleerd uit lavendel.", why: "Kalmeert en zuivert de huid en vormt de milde, natuurlijke basis van onze toner." },
    { name: "Komkommerextract", inci: "Cucumis Sativus Fruit Extract", what: "Biologisch extract van komkommervrucht.", why: "Hydrateert en verfrist, helpt de vette/gemengde huid in balans te brengen." },
    { name: "Salicylzuur", inci: "Salicylic Acid", what: "Een bèta-hydroxyzuur (BHA).", why: "Verwijdert mild overtollig talg en houdt de poriën vrij — voor een frissere, helderdere huid." },
    { name: "Glycerine", inci: "Glycerin", what: "Een plantaardige vochtbinder, gemaakt met biologische ingrediënten.", why: "Bindt vocht zodat de huid soepel blijft in plaats van strak." },
    { name: "Betaïne", inci: "Betaine", what: "Een natuurlijk gewonnen vochtinbrengend bestanddeel.", why: "Geeft milde hydratatie en een prettig huidgevoel zonder zwaarte." },
    { name: "Pruimenextract", inci: "Prunus Domestica Fruit Extract", what: "Biologisch extract van pruimenvrucht.", why: "Verzorgt haar en hoofdhuid in onze shampoo voor de gevoelige hoofdhuid." },
    { name: "Lindebloesemextract", inci: "Tilia Cordata Flower Extract", what: "Biologisch extract van lindebloesem.", why: "Kalmeert de hoofdhuid voor een comfortabel, gebalanceerd gevoel." },
    { name: "Coco-Glucoside", inci: "Coco-Glucoside", what: "Een milde reiniger op basis van suiker en kokos.", why: "Reinigt mild — bewust gekozen in plaats van agressieve detergenten voor de gevoelige hoofdhuid." }
  ]
};

const INGREDIENTS_PAGE = {
  en: { title: "About our ingredients", lead: "Every Elira Living formula is vegan and ECOCERT COSMOS certified. Here is what is inside — and why.", intro: "We believe you should know exactly what you put on your skin and hair. Below we explain the key ingredients across our range in plain language. Full INCI lists are printed on every product." },
  de: { title: "Über unsere Inhaltsstoffe", lead: "Jede Elira Living-Formel ist vegan und ECOCERT COSMOS zertifiziert. Hier erfahren Sie, was drin ist — und warum.", intro: "Sie sollten genau wissen, was Sie auf Haut und Haar auftragen. Im Folgenden erklären wir die wichtigsten Inhaltsstoffe unseres Sortiments in klarer Sprache. Die vollständige INCI-Liste steht auf jedem Produkt." },
  nl: { title: "Over onze ingrediënten", lead: "Elke Elira Living-formule is veganistisch en ECOCERT COSMOS-gecertificeerd. Hier lees je wat erin zit — en waarom.", intro: "Je hoort precies te weten wat je op je huid en haar aanbrengt. Hieronder leggen we de belangrijkste ingrediënten uit ons assortiment in heldere taal uit. Volledige INCI-lijsten staan op elk product." },
  fi: { title: "Tietoa ainesosistamme", lead: "Jokainen Elira Living -formulaatio on vegaaninen ja ECOCERT COSMOS -sertifioitu. Tässä kerromme, mitä tuotteissa on — ja miksi.", intro: "Mielestämme sinun kuuluu tietää tarkalleen, mitä laitat iholle ja hiuksiin. Alla selitämme valikoimamme keskeiset ainesosat selkokielellä. Täydelliset INCI-luettelot on painettu jokaiseen tuotteeseen." }
};

module.exports = { USAGE, PRODUCT_FAQ, INGREDIENTS, INGREDIENTS_PAGE };
