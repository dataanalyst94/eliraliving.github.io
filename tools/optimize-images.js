/* Re-compress oversized JPEGs and generate WebP siblings for every content
   image. Run: node tools/optimize-images.js
   - Caps hero/product images at 1440px, gallery at 1080px, mozjpeg q80.
   - Writes a .webp next to each .jpg (quality 74) for <picture> sources.
   - Leaves og-image.jpg and brand/* (logos/icons) untouched. */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const IMG = path.join(__dirname, "..", "assets", "img");
const GAL = path.join(IMG, "gallery");
const SKIP = new Set(["og-image.jpg"]);

function listJpgs(dir, maxW) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.jpe?g$/i.test(f) && !SKIP.has(f))
    .map(f => ({ file: path.join(dir, f), maxW }));
}

(async () => {
  const targets = [...listJpgs(IMG, 1440), ...listJpgs(GAL, 1080)];
  let savedJpg = 0, webpBytes = 0;
  for (const { file, maxW } of targets) {
    const src = fs.readFileSync(file);            // load to buffer (releases the file handle)
    const before = src.length;
    const meta = await sharp(src).metadata();
    const oversize = before > 150_000 || (meta.width || 0) > maxW + 40;

    let current = src;
    if (oversize) {
      const buf = await sharp(src)
        .resize({ width: Math.min(meta.width || maxW, maxW), withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      if (buf.length < before) { fs.writeFileSync(file, buf); current = buf; }
    }
    const after = fs.statSync(file).size;
    savedJpg += (before - after);

    // WebP sibling (from the in-memory buffer)
    const webpPath = file.replace(/\.jpe?g$/i, ".webp");
    const webpBuf = await sharp(current)
      .resize({ width: maxW, withoutEnlargement: true })
      .webp({ quality: 74 })
      .toBuffer();
    fs.writeFileSync(webpPath, webpBuf);
    const wb = webpBuf.length;
    webpBytes += wb;
    const name = path.relative(path.join(__dirname, ".."), file);
    console.log(`${name.padEnd(46)} jpg ${(before/1024).toFixed(0)}→${(after/1024).toFixed(0)}KB   webp ${(wb/1024).toFixed(0)}KB`);
  }
  console.log(`\nJPEG saved: ${(savedJpg/1024).toFixed(0)}KB · total WebP set: ${(webpBytes/1024).toFixed(0)}KB`);
})().catch(e => { console.error(e); process.exit(1); });
