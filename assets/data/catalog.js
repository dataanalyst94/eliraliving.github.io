/* =========================================================================
   ELIRA LIVING — CENTRAL CATALOG (single source of truth).
   Language-AGNOSTIC product data: SKU, price, images, category, sizes, badges.
   Edit here once and rebuild — changes reflect across EN / DE / NL.
   Names, descriptions and ingredient notes live in /assets/content/<lang>.js
   ========================================================================= */
(function (root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (typeof window !== "undefined") window.CATALOG = data;
})(this, function () {

  const CONFIG = {
    currency: "EUR",
    freeShippingThreshold: 3900, // €39.00 (cents)
    shippingFlat: 495,           // €4.95
    markets: ["DE", "NL"],
    baseUrl: "https://www.eliraliving.com"
  };

  const CATEGORIES = ["skincare", "haircare"];

  // price = EUR cents · image = primary · images = gallery (optional)
  // featureKeys resolve to localized labels in content[lang].features
  const PRODUCTS = [
    {
      id: "sensitive-moisturizing-cream",
      sku: "EL-SC-CREAM-50",
      category: "skincare",
      price: 1990,
      size: "50 ml",
      sizes: [{ id: "50ml", add: 0 }],
      badge: "bestseller",
      featureKeys: ["vegan", "cosmosOrganic", "fragranceFree", "sensitiveSkin"],
      naturalOrigin: null,
      image: "/assets/img/cream.jpg",
      images: ["/assets/img/cream.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "radiant-glow-cleanser",
      sku: "EL-SC-CLEAN-145",
      category: "skincare",
      price: 2599,
      size: "145 ml",
      sizes: [{ id: "145ml", add: 0 }],
      badge: "bestseller",
      featureKeys: ["vegan", "cosmosNatural", "dailyUse", "allSkin"],
      naturalOrigin: null,
      image: "/assets/img/cleanser.jpg",
      images: ["/assets/img/cleanser.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "purifying-toner",
      sku: "EL-SC-TONER-200",
      category: "skincare",
      price: 2400,
      size: "200 ml",
      sizes: [{ id: "200ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "fragranceFree", "oilyComb"],
      naturalOrigin: 99,
      image: "/assets/img/toner.jpg",
      images: ["/assets/img/toner.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "sensitive-scalp-shampoo",
      sku: "EL-HC-SHAMP-400",
      category: "haircare",
      price: 2300,
      size: "400 ml",
      sizes: [{ id: "400ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "derm", "allHair"],
      naturalOrigin: 98,
      image: "/assets/img/shampoo.jpg",
      images: ["/assets/img/shampoo.jpg"],
      priceId: "", paymentLink: ""
    }
  ];

  // INCI ingredient lists are language-neutral (EU INCI nomenclature) → shared.
  const INCI = {
    "purifying-toner": "Aqua, Alcohol, Lavandula Angustifolia (Lavender) Flower Water*, Glycerin**, Betaine, Propanediol, Acorus Calamus (Sweet Flag) Root Extract*, Cucumis Sativus (Cucumber) Fruit Extract*, Salicylic Acid, Benzyl Alcohol, Sodium Benzoate, Potassium Sorbate, Rhamnose, Glucose, Glucuronic Acid.",
    "sensitive-scalp-shampoo": "Aqua, Sodium Coco-Sulfate, Cocamidopropyl Betaine, Coco-Glucoside, Betaine, Glyceryl Oleate, Prunus Domestica (Plum) Fruit Extract*, Sodium Chloride, Citric Acid, Parfum, Benzyl Alcohol, Hydrolyzed Wheat Protein, Tilia Cordata (Linden) Flower Extract*, Sodium Benzoate, Potassium Sorbate, Jasminum Officinale (Jasmin) Extract, Leuconostoc/Radish Root Ferment Filtrate.",
    "sensitive-moisturizing-cream": null,
    "radiant-glow-cleanser": null
  };

  function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
  function getProducts(category) { return (!category || category === "all") ? PRODUCTS.slice() : PRODUCTS.filter(p => p.category === category); }

  return { CONFIG, CATEGORIES, PRODUCTS, INCI, getProduct, getProducts };
});
