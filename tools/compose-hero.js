/* Build a classy hero "collection" image: all five bottles in a gentle arc on
   the brand backdrop, with the left side kept darker for the headline.
   Run: node tools/compose-hero.js [--preview]   (sources in assets/img/_src) */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets", "img", "_src");
const OUT = path.join(ROOT, "assets", "img");
const PREVIEW = process.argv.includes("--preview");

const W = 2400, H = 1500;
const BASE_Y = Math.round(H * 0.90);   // bottle bottoms align near here

// left->right: source png, centre x (fraction), bottle height (px)
const LAYOUT = [
  { src: "p4",    cx: 0.325, h: 860 },  // serum
  { src: "p1",    cx: 0.445, h: 950 },  // cleanser
  { src: "cream", cx: 0.565, h: 1040 }, // cream (centre, tallest)
  { src: "p3",    cx: 0.685, h: 950 },  // toner
  { src: "p2",    cx: 0.805, h: 860 },  // shampoo
];
// draw order: outers first, centre last (centre sits in front)
const DRAW = ["p4", "p2", "p1", "p3", "cream"];

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="52%" cy="40%" r="82%">
      <stop offset="0%" stop-color="#28301f"/>
      <stop offset="48%" stop-color="#1a1f14"/>
      <stop offset="100%" stop-color="#0f120d"/>
    </radialGradient>
    <radialGradient id="halo" cx="55%" cy="36%" r="46%">
      <stop offset="0%" stop-color="#9DB08A" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#9DB08A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
</svg>`;
// darken the left third so the headline reads, + a soft floor vignette
const veilSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="lx" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0c0f09" stop-opacity="0.82"/>
      <stop offset="26%" stop-color="#0c0f09" stop-opacity="0.42"/>
      <stop offset="50%" stop-color="#0c0f09" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="70%" stop-color="#0f120d" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0f120d" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lx)"/>
  <rect width="${W}" height="${H}" fill="url(#fl)"/>
</svg>`;

async function shadow(cx, cy, rx, ry) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="0.42"/></svg>`;
  return sharp(Buffer.from(s)).blur(34).toBuffer();
}

(async () => {
  const prepared = {};
  for (const item of LAYOUT) {
    const trimmed = await sharp(fs.readFileSync(path.join(SRC, item.src + ".png"))).trim({ threshold: 12 }).toBuffer();
    const box = await sharp(trimmed).resize({ height: item.h }).toBuffer();
    const m = await sharp(box).metadata();
    prepared[item.src] = { box, w: m.width, h: m.height, left: Math.round(W * item.cx - m.width / 2), top: BASE_Y - m.height };
  }
  // shadows first (under everything)
  const shadows = [];
  for (const item of LAYOUT) { const p = prepared[item.src]; shadows.push({ input: await shadow(W * item.cx, BASE_Y - 6, Math.max(150, p.w * 0.44), 30), top: 0, left: 0 }); }
  const bottleLayers = DRAW.map(src => ({ input: prepared[src].box, top: prepared[src].top, left: prepared[src].left }));

  const out = await sharp(Buffer.from(bgSvg))
    .composite([...shadows, ...bottleLayers, { input: Buffer.from(veilSvg), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const dest = PREVIEW ? path.join(SRC, "out-hero.jpg") : path.join(OUT, "hero.jpg");
  fs.writeFileSync(dest, out);
  console.log("✓ hero", W + "x" + H, (out.length / 1024 | 0) + "KB", "→", path.relative(ROOT, dest));
})().catch(e => { console.error(e); process.exit(1); });
