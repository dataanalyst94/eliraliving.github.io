/* =========================================================================
   ELIRA LIVING — Product catalogue.
   Natural-certified (ECOCERT COSMOS) skincare & haircare. Vegan.
   Prices in EUR cents. category: "skincare" | "haircare"
   ========================================================================= */

const PRODUCTS = [
  {
    id: "sensitive-moisturizing-cream",
    name: "Sensitive Moisturizing Cream",
    category: "skincare", gender: "unisex", price: 1990, badge: "bestseller",
    size: "50 ml",
    desc: {
      de: "Parfümfreie Feuchtigkeitscreme, die empfindliche Haut beruhigt und stärkt. Vegan, ECOCERT COSMOS zertifiziert.",
      nl: "Parfumvrije moisturizer die de gevoelige huid kalmeert en versterkt. Vegan, ECOCERT COSMOS-gecertificeerd.",
      en: "A fragrance-free moisturiser that soothes and strengthens sensitive skin. Vegan, ECOCERT COSMOS certified."
    },
    features: ["Vegan", "COSMOS Organic", "Fragrance-free", "Sensitive skin"],
    sizes: [{ name: "50 ml", add: 0 }],
    ingredients: "Vegan · ECOCERT COSMOS Organic certified · Fragrance-free. Full INCI is printed on the product packaging.",
    img: "assets/img/cream.jpg", priceId: "", paymentLink: ""
  },
  {
    id: "radiant-glow-cleanser",
    name: "Radiant Glow Facial Cleanser",
    category: "skincare", gender: "unisex", price: 2599, badge: "bestseller",
    size: "145 ml",
    desc: {
      de: "Sanfter Reiniger für täglichen Gebrauch — entfernt Unreinheiten für frische, strahlende Haut. Vegan, COSMOS Natural.",
      nl: "Milde dagelijkse reiniger die onzuiverheden verwijdert voor een frisse, stralende huid. Vegan, COSMOS Natural.",
      en: "A gentle daily cleanser that lifts away impurities for fresh, radiant skin. Vegan, COSMOS Natural."
    },
    features: ["Vegan", "COSMOS Natural", "Daily use", "All skin types"],
    sizes: [{ name: "145 ml", add: 0 }],
    ingredients: "Vegan · ECOCERT COSMOS Natural certified. Full INCI is printed on the product packaging.",
    img: "assets/img/cleanser.jpg", priceId: "", paymentLink: ""
  },
  {
    id: "purifying-toner",
    name: "Purifying Toner",
    category: "skincare", gender: "unisex", price: 2400, badge: "new",
    size: "200 ml",
    desc: {
      de: "Klärendes Gesichtswasser, das Poren reinigt und fettige Mischhaut ausgleicht — für ein frisches, geschmeidiges Hautgefühl. Ohne Parfüm, COSMOS Natural.",
      nl: "Zuiverende toner die poriën reinigt en de vette/gemengde huid in balans brengt — fris en soepel. Parfumvrij, COSMOS Natural.",
      en: "A purifying toner that clears pores and balances oily, combination skin — leaving it fresh and supple. Fragrance-free, COSMOS Natural."
    },
    features: ["Vegan", "COSMOS Natural", "Fragrance-free", "Oily / combination"],
    sizes: [{ name: "200 ml", add: 0 }],
    ingredients: "Aqua, Alcohol, Lavandula Angustifolia (Lavender) Flower Water*, Glycerin**, Betaine, Propanediol, Acorus Calamus (Sweet Flag) Root Extract*, Cucumis Sativus (Cucumber) Fruit Extract*, Salicylic Acid, Benzyl Alcohol, Sodium Benzoate, Potassium Sorbate, Rhamnose, Glucose, Glucuronic Acid.  *from organic farming  **made using organic ingredients · 99% natural origin · ECOCERT COSMOS Natural.",
    img: "assets/img/toner.jpg", priceId: "", paymentLink: ""
  },
  {
    id: "sensitive-scalp-shampoo",
    name: "Sensitive Scalp Shampoo",
    category: "haircare", gender: "unisex", price: 2300, badge: "new",
    size: "400 ml",
    desc: {
      de: "Sanftes, beruhigendes Shampoo für empfindliche Kopfhaut und alle Haartypen. Dermatologisch getestet, COSMOS Natural.",
      nl: "Milde, kalmerende shampoo voor de gevoelige hoofdhuid en alle haartypes. Dermatologisch getest, COSMOS Natural.",
      en: "A gentle, soothing shampoo for sensitive scalps and all hair types. Dermatologically tested, COSMOS Natural."
    },
    features: ["Vegan", "COSMOS Natural", "Dermatologically tested", "All hair types"],
    sizes: [{ name: "400 ml", add: 0 }],
    ingredients: "Aqua, Sodium Coco-Sulfate, Cocamidopropyl Betaine, Coco-Glucoside, Betaine, Glyceryl Oleate, Prunus Domestica (Plum) Fruit Extract*, Sodium Chloride, Citric Acid, Parfum, Benzyl Alcohol, Hydrolyzed Wheat Protein, Tilia Cordata (Linden) Flower Extract*, Sodium Benzoate, Potassium Sorbate, Jasminum Officinale (Jasmin) Extract, Leuconostoc/Radish Root Ferment Filtrate.  *from organic farming · 98% natural origin · ECOCERT COSMOS Natural.",
    img: "assets/img/shampoo.jpg", priceId: "", paymentLink: ""
  }
];

const CATEGORIES = ["skincare", "haircare"];

// Soft gradient pairs per category for the elegant SVG fallback tiles
const CATEGORY_GRADIENT = {
  skincare: ["#D8E6D6", "#7E9A86"],
  haircare: ["#EDE3D0", "#B89B6E"]
};

function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
function getProducts({ category = "all" } = {}) {
  return PRODUCTS.filter(p => category === "all" || p.category === category);
}
function productDesc(p) {
  const lang = window.I18nState ? I18nState.lang : "en";
  return p.desc[lang] || p.desc.en;
}

window.PRODUCTS = PRODUCTS;
window.CATEGORIES = CATEGORIES;
window.CATEGORY_GRADIENT = CATEGORY_GRADIENT;
window.getProduct = getProduct;
window.getProducts = getProducts;
window.productDesc = productDesc;
