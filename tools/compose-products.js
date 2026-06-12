/* Composite each transparent product render onto ONE consistent, premium brand
   backdrop (soft sage-lit studio gradient + grounding shadow) so every listing
   image is cohesive. Run: node tools/compose-products.js [--preview]
   Outputs to assets/img/<name>.jpg  (or assets/img/_src/out-<name>.jpg in preview). */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets", "img", "_src");
const OUT = path.join(ROOT, "assets", "img");
const PREVIEW = process.argv.includes("--preview");

// source png (in _src) -> deployed product image name
const MAP = { cream: "cream", p1: "cleanser", p3: "toner", p2: "shampoo", p4: "serum" };

const W = 1000, H = 1250; // 4:5 to match the card .media aspect
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#2c3322"/>
      <stop offset="50%" stop-color="#1e2417"/>
      <stop offset="100%" stop-color="#171b12"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="35%" r="44%">
      <stop offset="0%" stop-color="#9DB08A" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#9DB08A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
</svg>`;

async function shadow(cx, cy, rx, ry) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="0.5"/></svg>`;
  return sharp(Buffer.from(s)).blur(26).toBuffer();
}

(async () => {
  for (const [src, name] of Object.entries(MAP)) {
    const p = path.join(SRC, src + ".png");
    if (!fs.existsSync(p)) { console.log("skip (missing)", src); continue; }
    const trimmed = await sharp(fs.readFileSync(p)).trim({ threshold: 12 }).toBuffer();
    const box = await sharp(trimmed).resize({ width: Math.round(W * 0.58), height: Math.round(H * 0.72), fit: "inside" }).toBuffer();
    const m = await sharp(box).metadata();
    const left = Math.round((W - m.width) / 2);
    const baseY = Math.round(H * 0.84);
    const top = baseY - m.height;
    const sh = await shadow(W / 2, baseY - 4, Math.max(130, m.width * 0.42), 34);
    const out = await sharp(Buffer.from(bgSvg))
      .composite([{ input: sh, top: 0, left: 0 }, { input: box, top, left }])
      .jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    const dest = PREVIEW ? path.join(SRC, "out-" + name + ".jpg") : path.join(OUT, name + ".jpg");
    fs.writeFileSync(dest, out);
    console.log("✓", name, "(bottle " + m.width + "x" + m.height + ")", "→", path.relative(ROOT, dest));
  }
})().catch(e => { console.error(e); process.exit(1); });
