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
    markets: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"], // all 27 EU member states
    baseUrl: "https://www.eliraliving.com"
  };

  const CATEGORIES = ["skincare", "haircare"];
  const LOCALIZED_IMAGE_IDS = [
    "sensitive-moisturizing-cream",
    "radiant-glow-cleanser",
    "purifying-toner",
    "sensitive-scalp-shampoo",
    "retinol-alternative-serum",
    "peptide-anti-aging-serum",
    "anti-aging-duo"
  ];

  function imageGroup(lang) {
    return lang === "fi" ? "fi" : "de";
  }

  function localizedImage(id, lang) {
    return LOCALIZED_IMAGE_IDS.indexOf(id) >= 0 ? `/assets/img/products/${imageGroup(lang)}/${id}.jpg` : "";
  }

  // price = EUR cents · image = primary · images = gallery (optional)
  // featureKeys resolve to localized labels in content[lang].features
  const PRODUCTS = [
    {
      id: "sensitive-moisturizing-cream",
      sku: "EL-SC-CREAM-50",
      category: "skincare",
      price: 2650,
      size: "50 ml",
      sizes: [{ id: "50ml", add: 0 }],
      badge: "bestseller",
      featureKeys: ["vegan", "cosmosOrganic", "fragranceFree", "sensitiveSkin"],
      naturalOrigin: null,
      freeShipping: true,
      image: "/assets/img/cream.jpg",
      images: ["/assets/img/cream.jpg", "/assets/img/gallery/sensitive-moisturizing-cream-2.jpg", "/assets/img/gallery/sensitive-moisturizing-cream-3.jpg", "/assets/img/gallery/sensitive-moisturizing-cream-4.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "radiant-glow-cleanser",
      sku: "EL-SC-CLEAN-145",
      category: "skincare",
      price: 3250,
      size: "145 ml",
      sizes: [{ id: "145ml", add: 0 }],
      badge: "bestseller",
      featureKeys: ["vegan", "cosmosNatural", "dailyUse", "allSkin"],
      naturalOrigin: null,
      freeShipping: true,
      image: "/assets/img/cleanser.jpg",
      images: ["/assets/img/cleanser.jpg", "/assets/img/gallery/radiant-glow-cleanser-2.jpg", "/assets/img/gallery/radiant-glow-cleanser-3.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "purifying-toner",
      sku: "EL-SC-TONER-200",
      category: "skincare",
      price: 3050,
      size: "200 ml",
      sizes: [{ id: "200ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "fragranceFree", "oilyComb"],
      naturalOrigin: 99,
      freeShipping: true,
      image: "/assets/img/toner.jpg",
      images: ["/assets/img/toner.jpg", "/assets/img/gallery/purifying-toner-2.jpg", "/assets/img/gallery/purifying-toner-3.jpg", "/assets/img/gallery/purifying-toner-4.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "sensitive-scalp-shampoo",
      sku: "EL-HC-SHAMP-400",
      category: "haircare",
      price: 2950,
      size: "400 ml",
      sizes: [{ id: "400ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "derm", "allHair"],
      naturalOrigin: 98,
      freeShipping: true,
      image: "/assets/img/shampoo.jpg",
      images: ["/assets/img/shampoo.jpg", "/assets/img/gallery/sensitive-scalp-shampoo-2.jpg", "/assets/img/gallery/sensitive-scalp-shampoo-3.jpg", "/assets/img/gallery/sensitive-scalp-shampoo-4.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "retinol-alternative-serum",
      sku: "EL-SC-SERUM-30",
      category: "skincare",
      price: 2999,
      size: "30 ml",
      sizes: [{ id: "30ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "antiAging", "allSkin"],
      naturalOrigin: 99,
      freeShipping: true,                 // this product ships free regardless of cart total
      image: "/assets/img/serum.jpg",
      images: ["/assets/img/serum.jpg", "/assets/img/gallery/retinol-alternative-serum-2.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      id: "peptide-anti-aging-serum",
      sku: "EL-SC-PEP-30",
      category: "skincare",
      price: 2999,
      size: "30 ml",
      sizes: [{ id: "30ml", add: 0 }],
      badge: "new",
      featureKeys: ["vegan", "cosmosNatural", "antiAging", "normalDry"],
      naturalOrigin: 99,
      freeShipping: true,
      image: "/assets/img/peptide-serum.jpg",
      images: ["/assets/img/peptide-serum.jpg", "/assets/img/gallery/peptide-anti-aging-serum-2.jpg", "/assets/img/gallery/peptide-anti-aging-serum-3.jpg", "/assets/img/gallery/peptide-anti-aging-serum-4.jpg"],
      priceId: "", paymentLink: ""
    },
    {
      // Bundle: Retinol-Alternative Serum + Peptide Anti-Aging Serum, 10% off the
      // combined €59.98 (exact 10% = €53.98). Single SKU; the product name/desc
      // spells out both contents so manual fulfilment (no bundle-splitting logic
      // in the cart/order pipeline) packs the right two bottles.
      id: "anti-aging-duo",
      sku: "EL-BND-AAD",
      category: "skincare",
      price: 5398,
      size: "2 × 30 ml",
      sizes: [{ id: "bundle", add: 0 }],
      badge: "bundle",
      featureKeys: ["vegan", "cosmosNatural", "antiAging"],
      naturalOrigin: null,
      image: "/assets/img/anti-aging-duo.jpg",
      images: ["/assets/img/anti-aging-duo.jpg", "/assets/img/serum.jpg", "/assets/img/peptide-serum.jpg"],
      priceId: "", paymentLink: ""
    }
  ];

  const DEFAULT_IMAGES = {};
  PRODUCTS.forEach(p => {
    DEFAULT_IMAGES[p.id] = {
      image: p.image,
      images: p.images && p.images.length ? p.images.slice() : [p.image]
    };
  });

  function productImage(id, lang) {
    return localizedImage(id, lang) || (DEFAULT_IMAGES[id] && DEFAULT_IMAGES[id].image) || "";
  }

  function productImages(id, lang) {
    const primary = localizedImage(id, lang);
    if (primary) {
      if (id === "anti-aging-duo") {
        return [
          primary,
          localizedImage("retinol-alternative-serum", lang),
          localizedImage("peptide-anti-aging-serum", lang)
        ];
      }
      return [primary];
    }
    return DEFAULT_IMAGES[id] ? DEFAULT_IMAGES[id].images.slice() : [];
  }

  function productImageMap(lang) {
    const map = {};
    PRODUCTS.forEach(p => {
      const next = productImage(p.id, lang);
      if (!next) return;
      const oldSet = new Set((DEFAULT_IMAGES[p.id] && DEFAULT_IMAGES[p.id].images) || []);
      oldSet.add(DEFAULT_IMAGES[p.id] && DEFAULT_IMAGES[p.id].image);
      oldSet.forEach(src => {
        if (src) map[src] = next;
      });
    });
    return map;
  }

  function localizeProductImages(lang) {
    PRODUCTS.forEach(p => {
      p.image = productImage(p.id, lang);
      p.images = productImages(p.id, lang);
    });
  }

  if (typeof window !== "undefined") localizeProductImages(window.LANG || "de");

  // INCI ingredient lists are language-neutral (EU INCI nomenclature) → shared.
  const INCI = {
    "purifying-toner": "Aqua, Alcohol, Lavandula Angustifolia (Lavender) Flower Water*, Glycerin**, Betaine, Propanediol, Acorus Calamus (Sweet Flag) Root Extract*, Cucumis Sativus (Cucumber) Fruit Extract*, Salicylic Acid, Benzyl Alcohol, Sodium Benzoate, Potassium Sorbate, Rhamnose, Glucose, Glucuronic Acid.",
    "sensitive-scalp-shampoo": "Aqua, Sodium Coco-Sulfate, Cocamidopropyl Betaine, Coco-Glucoside, Betaine, Glyceryl Oleate, Prunus Domestica (Plum) Fruit Extract*, Sodium Chloride, Citric Acid, Parfum, Benzyl Alcohol, Hydrolyzed Wheat Protein, Tilia Cordata (Linden) Flower Extract*, Sodium Benzoate, Potassium Sorbate, Jasminum Officinale (Jasmin) Extract, Leuconostoc/Radish Root Ferment Filtrate.",
    "sensitive-moisturizing-cream": null,
    "radiant-glow-cleanser": null
  };

  function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
  function getProducts(category) { return (!category || category === "all") ? PRODUCTS.slice() : PRODUCTS.filter(p => p.category === category); }

  return { CONFIG, CATEGORIES, PRODUCTS, INCI, getProduct, getProducts, productImage, productImages, productImageMap, localizeProductImages };
});
