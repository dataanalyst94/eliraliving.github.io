/* Build the optimized lifestyle / trust imagery used across the site (home
   trust strip, philosophy split, About story). Sources:
     - marketing/social/nano/clean/*-model{f,m}.jpg  → AI people holding the
       REAL Elira products (highest-trust social proof)
     - assets/img/_src/stock/*.jpg                   → ambient lifestyle stock
   Crops each to a 4:5 portrait and writes optimized .jpg + .webp.
   Run: node tools/lifestyle-images.js
   Output: assets/img/lifestyle/<name>.jpg (+ .webp) */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "img", "lifestyle");
const W = 1000, H = 1250; // 4:5
fs.mkdirSync(OUT, { recursive: true });

// [source (relative to repo root), output name]
const SET = [
  ["marketing/social/nano/clean/pep-modelf.jpg",   "hold-serum-f"],
  ["marketing/social/nano/clean/pep-modelm.jpg",   "hold-serum-m"],
  ["marketing/social/nano/clean/p1-modelf.jpg",    "hold-cleanser-f"],
  ["marketing/social/nano/clean/p2-modelm.jpg",    "hold-shampoo-m"],
  ["marketing/social/nano/clean/cream-modelf.jpg", "hold-cream-f"],
  ["assets/img/_src/stock/self-care-9260472.jpg",  "ritual"],
  ["assets/img/_src/stock/natural-beauty-5479678.jpg", "glow"],
  ["assets/img/_src/stock/calm-woman-7161651.jpg", "calm"],
  ["assets/img/_src/stock/morning-skincare-6925542.jpg", "morning"],
];

(async () => {
  for (const [src, name] of SET) {
    const abs = path.join(ROOT, src);
    if (!fs.existsSync(abs)) { console.log("• missing", src); continue; }
    const buf = fs.readFileSync(abs);
    await sharp(buf).resize(W, H, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, name + ".jpg"));
    await sharp(buf).resize(W, H, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(path.join(OUT, name + ".webp"));
    console.log("✓", name);
  }
  console.log("\nDone → assets/img/lifestyle/  Now run: node build.js");
})().catch(e => { console.error(e); process.exit(1); });
