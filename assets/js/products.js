/* =========================================================================
   Elira Living — Product catalogue (mock data).
   Prices are in EUR cents. Replace `img` with your own photos in assets/img/
   and set `priceId` / `paymentLink` per product for Stripe (see README).
   gender: "women" | "men" | "unisex"  ·  category: face|eyes|lips|skin|fragrance|tools
   ========================================================================= */

const PRODUCTS = [
  {
    id: "lumiere-serum-foundation",
    name: "Lumière Serum Foundation",
    category: "face", gender: "unisex", price: 3800, badge: "bestseller",
    desc: {
      de: "Leichte Serum-Foundation mit mittlerer, aufbaubarer Deckkraft.",
      nl: "Lichte serum-foundation met middelmatige, opbouwbare dekking.",
      en: "Weightless serum foundation with buildable, medium coverage."
    },
    shades: [
      { name: "Porcelain", hex: "#F1D9C4" }, { name: "Sand", hex: "#E6C2A1" },
      { name: "Honey", hex: "#CFA172" }, { name: "Amber", hex: "#B07B4E" },
      { name: "Sienna", hex: "#8A5732" }, { name: "Espresso", hex: "#5C3A23" }
    ],
    ingredients: "Aqua, Hyaluronic Acid, Niacinamide, Squalane, Iron Oxides, Mica.",
    img: "https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "noir-volumising-mascara",
    name: "Noir Volumising Mascara",
    category: "eyes", gender: "unisex", price: 2400, badge: "bestseller",
    desc: {
      de: "Tiefschwarze Mascara für sofortiges Volumen ohne Verklumpen.",
      nl: "Diepzwarte mascara voor direct volume zonder klontering.",
      en: "Inky-black mascara for instant volume with zero clumping."
    },
    shades: [{ name: "Carbon Black", hex: "#0E0E0E" }, { name: "Soft Brown", hex: "#4A3220" }],
    ingredients: "Aqua, Beeswax, Carnauba Wax, Provitamin B5, Iron Oxides.",
    img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "velvet-matte-lip",
    name: "Velvet Matte Lip",
    category: "lips", gender: "women", price: 2200, badge: "new",
    desc: {
      de: "Cremiger Matt-Lippenstift mit 8 Stunden Halt.",
      nl: "Romige matte lippenstift met 8 uur houdbaarheid.",
      en: "Creamy matte lipstick with 8-hour staying power."
    },
    shades: [
      { name: "Terracotta", hex: "#B65E3C" }, { name: "Rosewood", hex: "#9B5159" },
      { name: "Brick", hex: "#8C3B2E" }, { name: "Nude Clay", hex: "#C08A6E" },
      { name: "Plum", hex: "#5E2A3A" }
    ],
    ingredients: "Castor Seed Oil, Shea Butter, Vitamin E, Candelilla Wax, Pigments.",
    img: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "second-skin-tinted-balm",
    name: "Second Skin Tinted Balm",
    category: "skin", gender: "men", price: 2600,
    desc: {
      de: "Getönter Feuchtigkeitsbalsam, der Rötungen ausgleicht — natürlich matt.",
      nl: "Getinte vochtinbrengende balsem die roodheid egaliseert — natuurlijk mat.",
      en: "Tinted moisture balm that evens redness — naturally matte."
    },
    shades: [
      { name: "Light", hex: "#E9C9A8" }, { name: "Medium", hex: "#C99B6E" },
      { name: "Tan", hex: "#A9794D" }, { name: "Deep", hex: "#7A5234" }
    ],
    ingredients: "Aqua, Glycerin, Jojoba Oil, Zinc Oxide, Green Tea Extract.",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "halo-cream-blush",
    name: "Halo Cream Blush",
    category: "face", gender: "women", price: 2800,
    desc: {
      de: "Cremiges Rouge für einen dewy, natürlichen Schimmer.",
      nl: "Crèmeblush voor een dewy, natuurlijke gloed.",
      en: "Cream blush for a dewy, lit-from-within flush."
    },
    shades: [
      { name: "Peach", hex: "#E79B72" }, { name: "Rose", hex: "#D77F84" },
      { name: "Coral", hex: "#E07856" }, { name: "Berry", hex: "#A24E5C" }
    ],
    ingredients: "Coconut Oil, Shea Butter, Squalane, Mica, Vitamin E.",
    img: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "architect-brow-gel",
    name: "Architect Brow Gel",
    category: "eyes", gender: "unisex", price: 1900,
    desc: {
      de: "Fixierendes Augenbrauengel für volle, definierte Brauen.",
      nl: "Fixerende wenkbrauwgel voor volle, gedefinieerde wenkbrauwen.",
      en: "Setting brow gel for full, defined brows that stay put."
    },
    shades: [
      { name: "Clear", hex: "#E8E2D6" }, { name: "Taupe", hex: "#8A7A66" },
      { name: "Ash Brown", hex: "#5C4A3A" }, { name: "Ebony", hex: "#2A211A" }
    ],
    ingredients: "Aqua, PVP, Provitamin B5, Aloe Vera, Fibres.",
    img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "glow-ritual-face-oil",
    name: "Glow Ritual Face Oil",
    category: "skin", gender: "unisex", price: 4200, badge: "bestseller",
    desc: {
      de: "Nährendes Gesichtsöl mit Squalan und Vitamin C für strahlende Haut.",
      nl: "Voedende gezichtsolie met squalaan en vitamine C voor een stralende huid.",
      en: "Nourishing face oil with squalane and vitamin C for radiant skin."
    },
    sizes: [{ name: "30 ml", add: 0 }, { name: "50 ml", add: 1500 }],
    ingredients: "Squalane, Rosehip Oil, Vitamin C, Sea Buckthorn, Vitamin E.",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "neroli-eau-de-parfum",
    name: "Elira Signature Eau de Parfum",
    category: "fragrance", gender: "unisex", price: 7900, badge: "new",
    desc: {
      de: "Unser Signature-Duft: Orangenblüte, Bergamotte und Zedernholz.",
      nl: "Onze signatuurgeur: oranjebloesem, bergamot en cederhout.",
      en: "Our signature scent: orange blossom, bergamot and cedarwood."
    },
    sizes: [{ name: "50 ml", add: 0 }, { name: "100 ml", add: 3000 }],
    ingredients: "Alcohol Denat., Parfum, Neroli, Bergamot, Cedarwood, Musk.",
    img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "matte-shadow-quad",
    name: "Atelier Shadow Quad",
    category: "eyes", gender: "women", price: 3400,
    desc: {
      de: "Vier aufeinander abgestimmte Lidschatten in mattem Finish.",
      nl: "Vier op elkaar afgestemde oogschaduwtinten in matte finish.",
      en: "Four coordinated eyeshadows in a velvet-matte finish."
    },
    shades: [
      { name: "Terra", hex: "#A86A45" }, { name: "Dune", hex: "#C9A87C" },
      { name: "Smoke", hex: "#5A5048" }, { name: "Ink", hex: "#2A2520" }
    ],
    ingredients: "Talc, Mica, Magnesium Stearate, Jojoba Oil, Pigments.",
    img: "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "sculpt-contour-stick",
    name: "Sculpt Contour Stick",
    category: "face", gender: "men", price: 2900,
    desc: {
      de: "Cremiger Contour-Stick für mühelose Definition.",
      nl: "Crèmige contourstick voor moeiteloze definitie.",
      en: "Creamy contour stick for effortless, natural definition."
    },
    shades: [
      { name: "Soft", hex: "#C49873" }, { name: "Medium", hex: "#A6764E" },
      { name: "Deep", hex: "#7C5232" }
    ],
    ingredients: "Caprylic Triglyceride, Shea Butter, Vitamin E, Iron Oxides.",
    img: "https://images.unsplash.com/photo-1597225638516-7c66b8e2a5a2?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "pro-blend-brush",
    name: "Pro Blend Brush No.7",
    category: "tools", gender: "unisex", price: 2100,
    desc: {
      de: "Veganer Kabuki-Pinsel für ein flawless, gleichmäßiges Finish.",
      nl: "Veganistische kabuki-kwast voor een flawless, egale finish.",
      en: "Vegan kabuki brush for a flawless, even finish."
    },
    ingredients: "Recycled aluminium ferrule, FSC birch handle, vegan Taklon bristles.",
    img: "https://images.unsplash.com/photo-1599733589046-75c6b4d5e7ce?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  },
  {
    id: "overnight-recovery-cream",
    name: "Overnight Recovery Cream",
    category: "skin", gender: "unisex", price: 4800, badge: "bestseller",
    desc: {
      de: "Reichhaltige Nachtcreme mit Peptiden und Ceramiden.",
      nl: "Rijke nachtcrème met peptiden en ceramiden.",
      en: "Rich night cream with peptides and ceramides."
    },
    sizes: [{ name: "50 ml", add: 0 }],
    ingredients: "Aqua, Peptides, Ceramides, Shea Butter, Hyaluronic Acid, Bakuchiol.",
    img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=900&q=80",
    priceId: "", paymentLink: ""
  }
];

const CATEGORIES = ["face", "eyes", "lips", "skin", "fragrance", "tools"];

// Soft gradient pairs per category for the elegant SVG fallback tiles
const CATEGORY_GRADIENT = {
  face:      ["#E8C8A8", "#C98F63"],
  eyes:      ["#9A8E7E", "#3A332A"],
  lips:      ["#C98173", "#8C3B2E"],
  skin:      ["#CFE0CE", "#7E9A86"],
  fragrance: ["#E4D9C4", "#B89B6E"],
  tools:     ["#D7CFC2", "#9A8C78"]
};

function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
function getProducts({ category = "all", gender = "all" } = {}) {
  return PRODUCTS.filter(p =>
    (category === "all" || p.category === category) &&
    (gender === "all" || p.gender === gender || (gender === "unisex" && p.gender === "unisex"))
  );
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
