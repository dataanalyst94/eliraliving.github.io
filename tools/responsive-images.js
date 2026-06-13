/* Generate mobile-sized responsive variants (-480, -960) in WebP + JPEG for the
   images that render large, so phones don't download desktop-sized images, and
   write a manifest (assets/data/responsive-manifest.json) that build.js reads to
   emit correct <picture> srcset/sizes. The existing full file stays the largest
   tier. Run: node tools/responsive-images.js */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "assets", "img");
const GAL = path.join(IMG, "gallery");
const TOP = ["cream", "cleanser", "toner", "shampoo", "serum", "peptide-serum", "hero"]; // deployed product + hero images
const WIDTHS = [480, 960];
const manifest = {};

const pub = abs => "/" + path.relative(ROOT, abs).split(path.sep).join("/");

async function process(file) {
  const src = fs.readFileSync(file);
  const base = file.replace(/\.jpe?g$/i, "");
  const fullMeta = await sharp(fs.readFileSync(base + ".webp")).metadata(); // optimized full
  const tiers = []; // [width, webpPublic, jpgPublic] ascending
  for (const w of WIDTHS) {
    if ((fullMeta.width || 0) <= w) continue; // skip if full is already <= this width
    await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(`${base}-${w}.webp`);
    await sharp(src).resize({ width: w }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${base}-${w}.jpg`);
    tiers.push([w, pub(`${base}-${w}.webp`), pub(`${base}-${w}.jpg`)]);
  }
  tiers.push([fullMeta.width, pub(base + ".webp"), pub(file)]); // full = largest tier
  manifest[pub(file)] = tiers;
  console.log("✓", path.relative(ROOT, file), tiers.map(t => t[0] + "w").join(", "));
}

(async () => {
  for (const n of TOP) { const f = path.join(IMG, n + ".jpg"); if (fs.existsSync(f)) await process(f); }
  if (fs.existsSync(GAL)) for (const f of fs.readdirSync(GAL).filter(f => /\.jpg$/i.test(f) && !/-(480|960)\.jpg$/i.test(f))) await process(path.join(GAL, f));
  fs.writeFileSync(path.join(ROOT, "assets", "data", "responsive-manifest.json"), JSON.stringify(manifest, null, 0) + "\n");
  console.log("\n✓ assets/data/responsive-manifest.json  (" + Object.keys(manifest).length + " images)");
})().catch(e => { console.error(e); process.exit(1); });
