const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CUTOUTS = "C:/Users/zeera/.codex/visualizations/2026/09/03/01a06820-f5da-7031-987b-9d18ffcfc814/cutouts-bgremoved";
const OUT = path.join(ROOT, "assets", "img", "products");
const W = 1000;
const H = 1250;
const BASE_Y = 1066;

const PRODUCTS = [
  { id: "sensitive-moisturizing-cream", key: "moisturizer", height: 930, alpha: 64 },
  { id: "radiant-glow-cleanser", key: "facewash", height: 940, alpha: 64 },
  { id: "purifying-toner", key: "toner", height: 930, alpha: 64 },
  { id: "sensitive-scalp-shampoo", key: "shampoo", height: 965, alpha: 64 },
  { id: "retinol-alternative-serum", key: "retinol", height: 790, alpha: 220 },
  { id: "peptide-anti-aging-serum", key: "peptide", height: 780, alpha: 64 },
];

function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="bg" cx="53%" cy="31%" r="82%">
        <stop offset="0%" stop-color="#31402a"/>
        <stop offset="58%" stop-color="#1a2116"/>
        <stop offset="100%" stop-color="#0f120d"/>
      </radialGradient>
      <radialGradient id="halo" cx="52%" cy="39%" r="44%">
        <stop offset="0%" stop-color="#b0bd96" stop-opacity=".16"/>
        <stop offset="100%" stop-color="#b0bd96" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="65%" stop-color="#0f120d" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0b0e09" stop-opacity=".88"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#halo)"/>
    <rect width="${W}" height="${H}" fill="url(#floor)"/>
  </svg>`;
}

async function shadow(cx, cy, rx, ry, opacity = 0.42) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${opacity}"/>
  </svg>`;
  return sharp(Buffer.from(s)).blur(20).toBuffer();
}

async function trimAlpha(inputPath, threshold, pad = 20) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0 || maxY < 0) return sharp(inputPath).png().toBuffer();
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(info.width - 1, maxX + pad);
  maxY = Math.min(info.height - 1, maxY + pad);
  return sharp(inputPath)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();
}

async function productLayer(lang, item, heightOverride) {
  const source = path.join(CUTOUTS, `${lang}-${item.key}.png`);
  const trimmed = await trimAlpha(source, item.alpha);
  const image = await sharp(trimmed).resize({ height: heightOverride || item.height }).png().toBuffer();
  const meta = await sharp(image).metadata();
  return { image, width: meta.width, height: meta.height };
}

async function savePhoto(outBase, layers) {
  const composites = [];
  for (const layer of layers) {
    composites.push({
      input: await shadow(layer.cx, BASE_Y + 8, Math.max(94, layer.width * 0.42), 25, layer.shadowOpacity || 0.42),
      left: 0,
      top: 0,
    });
  }
  for (const layer of layers) {
    composites.push({
      input: layer.image,
      left: Math.round(layer.cx - layer.width / 2),
      top: BASE_Y - layer.height,
    });
  }
  const jpg = `${outBase}.jpg`;
  const webp = `${outBase}.webp`;
  const base = await sharp(Buffer.from(backgroundSvg())).composite(composites).toBuffer();
  await sharp(base).jpeg({ quality: 91, mozjpeg: true }).toFile(jpg);
  await sharp(base).webp({ quality: 84 }).toFile(webp);
  console.log(path.relative(ROOT, jpg));
}

async function saveIndividual(lang) {
  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  for (const item of PRODUCTS) {
    const layer = await productLayer(lang, item);
    await savePhoto(path.join(dir, item.id), [{ ...layer, cx: W / 2 }]);
  }
}

async function saveDuo(lang) {
  const dir = path.join(OUT, lang);
  const retinol = await productLayer(lang, PRODUCTS.find(p => p.key === "retinol"), 760);
  const peptide = await productLayer(lang, PRODUCTS.find(p => p.key === "peptide"), 780);
  await savePhoto(path.join(dir, "anti-aging-duo"), [
    { ...retinol, cx: 390, shadowOpacity: 0.38 },
    { ...peptide, cx: 610, shadowOpacity: 0.42 },
  ]);
}

(async () => {
  for (const lang of ["fi", "de"]) {
    await saveIndividual(lang);
    await saveDuo(lang);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
