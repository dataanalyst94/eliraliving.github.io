/* Generate favicon / app-icon / social-card set from the brand logo.
   Run: node tools/gen-brand-assets.js   (needs assets/img/brand/logo-white.png)
   Produces dark-tile icons (white wordmark) + a 1200x630 OG card + a monogram. */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const BRAND = path.join(__dirname, "..", "assets", "img", "brand");
const IMG = path.join(__dirname, "..", "assets", "img");
const ROOT = path.join(__dirname, "..");
const DARK = "#0F120D";
const WHITE_LOGO = path.join(BRAND, "logo-white.png");

const tile = (size, bg) => sharp({ create: { width: size, height: size, channels: 4, background: bg } });

// White wordmark centred on a dark square tile, logo width ~ ratio of tile.
async function brandTile(size, logoFrac, out, flatten = true) {
  const logoW = Math.round(size * logoFrac);
  const logo = await sharp(WHITE_LOGO).resize({ width: logoW }).toBuffer();
  const meta = await sharp(logo).metadata();
  let img = tile(size, flatten ? DARK : { r: 15, g: 18, b: 13, alpha: 1 }).composite([
    { input: logo, top: Math.round((size - meta.height) / 2), left: Math.round((size - logoW) / 2) }
  ]);
  if (flatten) img = img.flatten({ background: DARK });
  await img.png().toFile(out);
  console.log("✓", path.relative(ROOT, out), size + "x" + size);
}

// Monogram favicon: crop the "e" from the wordmark, centre it on a dark tile.
async function monogram(size, out) {
  // The wordmark "elira" sits in the top band; the leading "e" is far left.
  const eCrop = await sharp(WHITE_LOGO)
    .extract({ left: 0, top: 0, width: 52, height: 74 })
    .trim()
    .toBuffer();
  const target = Math.round(size * 0.62);
  const e = await sharp(eCrop).resize({ height: target, fit: "inside" }).toBuffer();
  const m = await sharp(e).metadata();
  await tile(size, DARK)
    .composite([{ input: e, top: Math.round((size - m.height) / 2), left: Math.round((size - m.width) / 2) }])
    .flatten({ background: DARK })
    .png().toFile(out);
  console.log("✓", path.relative(ROOT, out), size + "x" + size, "(monogram)");
}

// 1200x630 OG / social card: dark bg, gold hairline, white wordmark centred.
async function ogCard(out) {
  const W = 1200, H = 630;
  const logoW = 430;
  const logo = await sharp(WHITE_LOGO).resize({ width: logoW }).toBuffer();
  const lm = await sharp(logo).metadata();
  // subtle gold rule + vignette as an SVG layer (shapes only — no fonts needed)
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
       <defs><radialGradient id="v" cx="50%" cy="42%" r="70%">
         <stop offset="0%" stop-color="#1b2016" stop-opacity="0.9"/>
         <stop offset="100%" stop-color="#0F120D" stop-opacity="1"/>
       </radialGradient></defs>
       <rect width="${W}" height="${H}" fill="url(#v)"/>
       <rect x="${(W - 260) / 2}" y="510" width="260" height="2" fill="#C8A24E" opacity="0.8"/>
     </svg>`);
  await sharp({ create: { width: W, height: H, channels: 4, background: DARK } })
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: logo, top: Math.round(H / 2 - lm.height / 2 - 18), left: Math.round((W - logoW) / 2) }
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log("✓", path.relative(ROOT, out), W + "x" + H, "(OG card)");
}

(async () => {
  await brandTile(512, 0.70, path.join(BRAND, "logo-512.png"));      // Organization JSON-LD logo
  await brandTile(512, 0.68, path.join(BRAND, "icon-512.png"));      // PWA
  await brandTile(192, 0.68, path.join(BRAND, "icon-192.png"));      // PWA
  await brandTile(180, 0.70, path.join(BRAND, "apple-touch-icon.png")); // iOS
  await monogram(32, path.join(BRAND, "favicon-32.png"));
  await monogram(16, path.join(BRAND, "favicon-16.png"));
  // favicon.ico fallback for bots hitting /favicon.ico (PNG bytes; widely accepted)
  fs.copyFileSync(path.join(BRAND, "favicon-32.png"), path.join(ROOT, "favicon.ico"));
  console.log("✓ favicon.ico");
  await ogCard(path.join(IMG, "og-image.jpg"));
  console.log("\nAll brand assets generated.");
})().catch(e => { console.error(e); process.exit(1); });
