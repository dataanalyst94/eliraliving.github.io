/* Elira Living — programmatic social-image engine.
   Renders branded 4:5 (1080x1350) posts across 6 styles onto the brand sage
   backdrop. Text is drawn as SVG (crisp at any size). Run:
     node tools/content-images.js proofs     # one sample per style
     node tools/content-images.js all         # full library from spec (later)
   Output: marketing/social/<style>/<id>.jpg */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "assets", "img");
const OUT = path.join(ROOT, "marketing", "social");
const W = 1080, H = 1350;

const C = { sageDark: "#1E2417", forest: "#2C3322", ink: "#171B12", sage: "#9DB08A", gold: "#C8A24E", cream: "#ECE7DB", soft: "#A9B19C" };
const SERIF = "BodoniEmbed, Didot, Georgia, serif";
const SANS = "InterEmbed, 'Segoe UI', Arial, sans-serif";
// embed real brand fonts so renders are pixel-accurate regardless of system fonts
const b64 = f => fs.readFileSync(path.join(__dirname, "fonts", f)).toString("base64");
const FONTCSS = `<style>
  @font-face{font-family:'BodoniEmbed';src:url(data:font/ttf;base64,${b64("Bodoni.ttf")}) format('truetype');font-weight:400 700;}
  @font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${b64("Inter.ttf")}) format('truetype');font-weight:300 700;}
</style>`;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// crude word-wrap into <= maxChars lines
function wrap(t, max) { const w = t.split(" "); const out = []; let l = ""; for (const x of w) { if ((l + " " + x).trim().length > max) { out.push(l.trim()); l = x; } else l += " " + x; } if (l.trim()) out.push(l.trim()); return out; }

function bg(extra = "") {
  return `<defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="85%"><stop offset="0%" stop-color="${C.forest}"/><stop offset="55%" stop-color="${C.sageDark}"/><stop offset="100%" stop-color="${C.ink}"/></radialGradient>
    <radialGradient id="halo" cx="50%" cy="34%" r="46%"><stop offset="0%" stop-color="${C.sage}" stop-opacity="0.18"/><stop offset="100%" stop-color="${C.sage}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#halo)"/>${extra}`;
}
function eyebrow(x, y, t) { return `<text x="${x}" y="${y}" fill="${C.gold}" font-family="${SANS}" font-size="26" letter-spacing="6" font-weight="600">${esc(t.toUpperCase())}</text>`; }
function headline(x, y, lines, size = 78, lh = 86, anchor = "start") { return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" fill="${C.cream}" font-family="${SERIF}" font-size="${size}" text-anchor="${anchor}">${esc(l)}</text>`).join(""); }
function body(x, y, lines, size = 32, lh = 44, fill = C.soft, anchor = "start") { return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" fill="${fill}" font-family="${SANS}" font-size="${size}" text-anchor="${anchor}">${esc(l)}</text>`).join(""); }
const offerBar = `<rect x="0" y="${H - 86}" width="${W}" height="86" fill="${C.ink}" fill-opacity="0.55"/><text x="${W / 2}" y="${H - 33}" fill="${C.cream}" font-family="${SANS}" font-size="27" letter-spacing="3" text-anchor="middle">FREE SHIPPING · VEGAN · ECOCERT COSMOS</text>`;
const logo = `<text x="${W / 2}" y="92" fill="${C.cream}" font-family="${SERIF}" font-size="40" text-anchor="middle" letter-spacing="2">elira living</text>`;

async function svg(s) { return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${FONTCSS}${s}</svg>`)).png().toBuffer(); }
async function save(style, id, buf) { const d = path.join(OUT, style); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, id + ".jpg"); await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(f); console.log("✓", path.relative(ROOT, f)); }

/* ---- STYLE TEMPLATES ---------------------------------------------------- */
// S1 hero: product image base + eyebrow/headline + offer bar
async function s1(o) {
  const base = await sharp(path.join(IMG, o.product)).resize(W, H, { fit: "cover" }).toBuffer();
  const hl = wrap(o.title, 20);
  const top = H - 86 - 40 - hl.length * 74 - 30; // sit headline block just above offer bar
  const scrim = `<defs><linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C.ink}" stop-opacity="0"/><stop offset="100%" stop-color="${C.ink}" stop-opacity="0.85"/></linearGradient></defs><rect x="0" y="${H - 560}" width="${W}" height="560" fill="url(#sc)"/>`;
  const over = await svg(`${scrim}${logo}${eyebrow(80, top - 36, o.eyebrow)}${headline(80, top + 40, hl, 64, 74)}${offerBar}`);
  return sharp(base).composite([{ input: over }]).png().toBuffer();
}
// S2 quote card
async function s2(o) { return svg(`${bg()}${logo}${eyebrow(W / 2, 430, o.eyebrow)} <g/>${headline(W / 2, 560, wrap(o.quote, 20), 76, 96, "middle")}${body(W / 2, 560 + wrap(o.quote, 20).length * 96 + 40, [o.sub || ""], 30, 42, C.sage, "middle")}`.replace("<g/>", `<line x1="${W / 2 - 40}" y1="395" x2="${W / 2 + 40}" y2="395" stroke="${C.gold}" stroke-width="2"/>`)); }
// S3 ingredient spotlight: product + callouts
async function s3(o) {
  const cut = o.cut && fs.existsSync(path.join(IMG, "_src", o.cut)) ? path.join(IMG, "_src", o.cut) : null;
  const prod = cut ? await sharp(cut).trim({ threshold: 6 }).resize({ height: 900, fit: "inside" }).toBuffer() : await sharp(path.join(IMG, o.product)).resize(560, 900, { fit: "cover" }).toBuffer();
  const m = await sharp(prod).metadata();
  const callouts = o.points.map((p, i) => { const y = 360 + i * 230; return `<line x1="700" y1="${y}" x2="780" y2="${y}" stroke="${C.gold}" stroke-width="2"/>${body(700, y - 12, [p.h], 30, 40, C.cream)}${body(700, y + 28, wrap(p.t, 26), 24, 32, C.soft)}`; }).join("");
  const over = await svg(`${bg()}${logo}${eyebrow(80, 230, o.eyebrow)}${callouts}`);
  return sharp(over).composite([{ input: prod, left: 70, top: Math.round((H - m.height) / 2) + 30 }]).png().toBuffer();
}
// S4 review card
async function s4(o) {
  const stars = "★★★★★";
  return svg(`${bg()}${logo}<text x="${W / 2}" y="380" fill="${C.gold}" font-size="50" text-anchor="middle" font-family="${SANS}">${stars}</text>${headline(W / 2, 500, wrap('“' + o.quote + '”', 22), 56, 74, "middle")}${body(W / 2, 500 + wrap('“' + o.quote + '”', 22).length * 74 + 50, [`— ${o.name}, ${o.country}`], 30, 40, C.sage, "middle")}`);
}
// S5 gentle vs harsh comparison
async function s5(o) {
  const midY = 250;
  return svg(`${bg(`<line x1="${W / 2}" y1="${midY}" x2="${W / 2}" y2="${H - 120}" stroke="${C.gold}" stroke-opacity="0.4" stroke-width="1"/>`)}${logo}
    ${body(W / 4, midY, ["HARSH ACTIVES"], 30, 40, C.soft, "middle")}
    ${body(W * 3 / 4, midY, ["ELIRA LIVING"], 30, 40, C.gold, "middle")}
    ${o.rows.map((r, i) => { const y = midY + 90 + i * 110; return body(W / 4, y, wrap(r[0], 18), 28, 36, C.soft, "middle") + body(W * 3 / 4, y, wrap(r[1], 18), 28, 36, C.cream, "middle"); }).join("")}
    ${offerBar}`);
}
// S6 lifestyle: real stock photo + scrim + headline, with a product "chip"
// (real bottle cutout) so the product is present alongside real people.
async function s6(o) {
  let base;
  const stock = o.stock && path.join(IMG, "_src", "stock", o.stock);
  if (stock && fs.existsSync(stock)) base = await sharp(stock).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.82 }).toBuffer();
  else base = await svg(bg(`<rect width="${W}" height="${H}" fill="${C.forest}" fill-opacity="0.2"/>`));
  const scrim = `<defs><linearGradient id="s6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C.ink}" stop-opacity="0.45"/><stop offset="55%" stop-color="${C.ink}" stop-opacity="0.05"/><stop offset="100%" stop-color="${C.ink}" stop-opacity="0.9"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s6)"/>`;
  const over = await svg(`${scrim}${logo}${eyebrow(80, H - 340, o.eyebrow)}${headline(80, H - 250, wrap(o.title, 18), 66, 78)}${body(80, H - 135, wrap(o.sub || "", 42), 27, 36, C.cream)}`);
  const layers = [];
  // product chip bottom-right, grounded + brightness-matched to the scene
  const chipSrc = path.join(IMG, "_src", "pep_10.png");
  if (fs.existsSync(chipSrc)) {
    const chipH = 320;
    let chip = await sharp(chipSrc).trim({ threshold: 6 }).resize({ height: chipH, fit: "inside" }).toBuffer();
    const cm = await sharp(chip).metadata();
    const cx = W - cm.width - 64, cy = H - chipH - 120;
    // match exposure: nudge chip brightness toward the local scene luminance
    const region = { left: Math.max(0, cx - 20), top: Math.max(0, cy), width: Math.min(cm.width + 40, W - cx), height: Math.min(chipH, H - cy) };
    const lum = (await sharp(base).extract(region).greyscale().resize(1, 1).raw().toBuffer())[0];
    const chipLum = (await sharp(chip).flatten({ background: "#888" }).greyscale().resize(1, 1).raw().toBuffer())[0];
    const bf = Math.max(0.72, Math.min(1.12, (lum + 60) / (chipLum + 60)));
    chip = await sharp(chip).modulate({ brightness: bf, saturation: 0.9 }).blur(0.5).toBuffer(); // 0.5px = edge feather + slight DoF
    // soft contact shadow under the bottle
    const shW = Math.round(cm.width * 0.9), shY = cy + chipH - 18;
    const shadow = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><ellipse cx="${cx + cm.width / 2}" cy="${shY}" rx="${shW / 2}" ry="22" fill="#000" fill-opacity="0.42"/></svg>`)).blur(16).toBuffer();
    layers.push({ input: shadow, top: 0, left: 0 }, { input: chip, top: cy, left: cx });
  }
  layers.push({ input: over });
  // film grain over the whole frame to bind product + photo into one image
  const gw = Math.round(W / 2), gh = Math.round(H / 2), buf = Buffer.alloc(gw * gh * 3);
  for (let i = 0; i < buf.length; i++) buf[i] = 118 + Math.floor(Math.random() * 22);
  const grain = await sharp(buf, { raw: { width: gw, height: gh, channels: 3 } }).resize(W, H).png().toBuffer();
  return sharp(base).composite([...layers, { input: grain, blend: "soft-light" }]).png().toBuffer();
}

/* ---- PROOFS ------------------------------------------------------------- */
async function proofs() {
  await save("s1-hero", "proof", await s1({ product: "peptide-serum.jpg", eyebrow: "Peptide Anti-Aging Serum", title: "Firmer skin, none of the sting." }));
  await save("s2-quote", "proof", await s2({ eyebrow: "Results without irritation", quote: "Anti-aging that doesn't fight your skin.", sub: "Vegan · ECOCERT COSMOS certified" }));
  await save("s3-ingredient", "proof", await s3({ product: "peptide-serum.jpg", cut: "pep_10.png", eyebrow: "Inside the formula", points: [{ h: "2% Hexapeptide-11", t: "Visibly smooths fine lines" }, { h: "Ginkgo Biloba", t: "Antioxidant defense, calm" }, { h: "Hyaluronic acid", t: "Plumps, holds moisture" }] }));
  await save("s4-review", "proof", await s4({ quote: "Endlich ein Serum, das meine empfindliche Haut nicht reizt.", name: "Lena", country: "DE" }));
  await save("s5-compare", "proof", await s5({ rows: [["Tingling, redness", "Calm, tolerated"], ["Synthetic actives", "Plant-based, certified"], ["Strips the barrier", "Supports the barrier"]] }));
  await save("s6-lifestyle", "proof", await s6({ eyebrow: "The gentle ritual", title: "Slow mornings, calmer skin.", sub: "A routine your barrier will thank you for." }));
  console.log("\nProofs in marketing/social/*/proof.jpg");
}

/* ---- FULL 60 SPEC ------------------------------------------------------- */
const PROD = { cream: "Sensitive Moisturizing Cream", cleanser: "Radiant Glow Cleanser", toner: "Purifying Toner", shampoo: "Sensitive Scalp Shampoo", serum: "Retinol Alternative Serum", "peptide-serum": "Peptide Anti-Aging Serum" };
const SPEC = {
  "s1-hero": [
    { product: "cream.jpg", eyebrow: PROD.cream, title: "Calm skin, no compromise." },
    { product: "cream.jpg", eyebrow: PROD.cream, title: "Moisture your barrier can trust." },
    { product: "cleanser.jpg", eyebrow: PROD.cleanser, title: "Clean that doesn't strip." },
    { product: "cleanser.jpg", eyebrow: PROD.cleanser, title: "Fresh skin, barrier intact." },
    { product: "toner.jpg", eyebrow: PROD.toner, title: "Clarify without the sting." },
    { product: "toner.jpg", eyebrow: PROD.toner, title: "Balance, gently." },
    { product: "shampoo.jpg", eyebrow: PROD.shampoo, title: "For scalps that react to everything." },
    { product: "shampoo.jpg", eyebrow: PROD.shampoo, title: "Calm scalp, soft hair." },
    { product: "serum.jpg", eyebrow: PROD.serum, title: "Retinol results, zero retinol burn." },
    { product: "serum.jpg", eyebrow: PROD.serum, title: "Smoother skin, no irritation." },
    { product: "peptide-serum.jpg", eyebrow: PROD["peptide-serum"], title: "Firmer skin, none of the sting." },
    { product: "peptide-serum.jpg", eyebrow: PROD["peptide-serum"], title: "Age gently. Glow anyway." },
  ],
  "s2-quote": [
    "Anti-aging that doesn't fight your skin.", "If actives leave you red, start here.",
    "Certified gentle. Actually effective.", "Your barrier wants the calm version.",
    "Strong results. Soft on sensitive skin.", "Glow without the gamble.",
    "Skincare that calms, not conquers.", "Powerful plants. Gentle on you.",
    "Less sting. More skin you love.", "Sensitive skin deserves real results too.",
    "Clean beauty you can actually verify.", "Slow skincare for reactive skin.",
  ].map(q => ({ eyebrow: "Results without irritation", quote: q, sub: "Vegan · ECOCERT COSMOS certified" })),
  "s3-ingredient": [
    { product: "peptide-serum.jpg", cut: "pep_10.png", eyebrow: "Inside the formula", points: [{ h: "2% Hexapeptide-11", t: "Visibly smooths fine lines" }, { h: "Ginkgo Biloba", t: "Antioxidant defense" }, { h: "Hyaluronic acid", t: "Plumps & holds moisture" }] },
    { product: "serum.jpg", eyebrow: "Inside the formula", points: [{ h: "2% Bidens Pilosa", t: "Plant retinol alternative" }, { h: "Rosehip oil", t: "Softens fine lines" }, { h: "Hyaluronic acid", t: "Deep hydration" }] },
    { product: "toner.jpg", eyebrow: "Inside the formula", points: [{ h: "Lavender water", t: "Soothes & refreshes" }, { h: "Cucumber extract", t: "Calms the skin" }, { h: "Gentle BHA", t: "Clears without stripping" }] },
    { product: "shampoo.jpg", eyebrow: "Inside the formula", points: [{ h: "Plum extract", t: "Nourishes the scalp" }, { h: "Coco-glucoside", t: "Mild, plant-based wash" }, { h: "Derm-tested", t: "For sensitive scalps" }] },
    { product: "cream.jpg", eyebrow: "Inside the formula", points: [{ h: "Glycerin", t: "Draws in moisture" }, { h: "Fragrance-free", t: "Kind to reactive skin" }, { h: "Barrier support", t: "Strengthens over time" }] },
    { product: "cleanser.jpg", eyebrow: "Inside the formula", points: [{ h: "Aloe", t: "Soothes as it cleans" }, { h: "Gentle surfactants", t: "No tight, stripped feel" }, { h: "COSMOS Natural", t: "Certified clean" }] },
    { product: "peptide-serum.jpg", cut: "pep_10.png", eyebrow: "Antioxidant rich", points: [{ h: "Blueberry seed oil", t: "Protective antioxidants" }, { h: "Strawberry seed oil", t: "Replenishing lipids" }, { h: "Phytosterols", t: "Comfort & elasticity" }] },
    { product: "serum.jpg", eyebrow: "Barrier first", points: [{ h: "Sea buckthorn", t: "Revives dull skin" }, { h: "Mango butter", t: "Cushions & softens" }, { h: "99% natural", t: "ECOCERT COSMOS" }] },
  ],
  "s4-review": [
    { quote: "Meine Haut hat es gut vertragen.", name: "Julia R.", country: "DE" },
    { quote: "Ik hou ervan dat het niet zo sterk ruikt.", name: "Sanne M.", country: "NL" },
    { quote: "Fühlt sich gut an und sieht echt schick aus.", name: "Markus T.", country: "DE" },
    { quote: "Viel me echt mee — voelt prettig aan.", name: "Femke D.", country: "NL" },
    { quote: "Der Duft ist dezent. Finde ich gut.", name: "Sabine K.", country: "DE" },
    { quote: "Kwam goed verpakt binnen en voelt fijn.", name: "Daan V.", country: "NL" },
    { quote: "Cleanes Design, ordentlich gemacht.", name: "Lena B.", country: "DE" },
    { quote: "Geen rare geur, voelt betrouwbaar aan.", name: "Lotte S.", country: "NL" },
  ],
  "s5-compare": [
    { rows: [["Tingling, redness", "Calm, tolerated"], ["Synthetic actives", "Plant-based, certified"], ["Strips the barrier", "Supports the barrier"]] },
    { rows: [["Harsh retinol", "Bidens Pilosa"], ["Peeling, flaking", "Smooth, comfortable"], ["Sun-sensitive", "Daytime friendly"]] },
    { rows: [["Strong perfume", "Considerate scent"], ["Unknown origin", "99% natural origin"], ["Unclear ethics", "Vegan · ECOCERT"]] },
    { rows: [["Foaming sulfates", "Gentle cleansers"], ["Tight, dry feel", "Soft, fresh feel"], ["Daily irritation", "Daily comfort"]] },
    { rows: [["Quick fixes", "Barrier-first"], ["More is more", "Less, but right"], ["Marketing claims", "Certified proof"]] },
    { rows: [["Reactive scalp", "Soothed scalp"], ["Itch & flakes", "Calm & balanced"], ["Heavy build-up", "Light & clean"]] },
  ],
  "s6-lifestyle": null, // filled from stock dir below
};
// S6 copy pool
const S6COPY = [
  { eyebrow: "The gentle ritual", title: "Slow mornings, calmer skin.", sub: "A routine your barrier will thank you for." },
  { eyebrow: "Sensitive-skin friendly", title: "Results you can feel. Gently.", sub: "Vegan · ECOCERT COSMOS certified." },
  { eyebrow: "Real skin, real calm", title: "No sting. Just glow.", sub: "Plant-based actives for reactive skin." },
  { eyebrow: "Certified clean", title: "Trust what touches your skin.", sub: "99% natural origin." },
  { eyebrow: "Everyday comfort", title: "Skincare that behaves.", sub: "Fragrance-considerate, barrier-first." },
  { eyebrow: "For reactive skin", title: "Strong on results. Soft on you.", sub: "Vegan & certified." },
  { eyebrow: "The calm edit", title: "Less reaction. More radiance.", sub: "ECOCERT COSMOS certified." },
  { eyebrow: "Gentle by design", title: "Your skin, uncomplicated.", sub: "Clean, certified, kind." },
  { eyebrow: "Quiet luxury", title: "Effective doesn't have to hurt.", sub: "Plant-powered, sensitively made." },
  { eyebrow: "Morning light", title: "Begin gently.", sub: "Skincare for skin that reacts." },
  { eyebrow: "Self-care, simplified", title: "Calm is a routine.", sub: "Vegan · ECOCERT COSMOS." },
  { eyebrow: "Skin you trust", title: "Glow without the gamble.", sub: "Certified gentle, genuinely effective." },
  { eyebrow: "Plant-powered", title: "Nature, but proven.", sub: "99% natural origin · ECOCERT." },
  { eyebrow: "The soft approach", title: "Kind to sensitive skin.", sub: "Results without irritation." },
];

async function generateAll() {
  const R = { s1: s1, s2: s2, s3: s3, s4: s4, s5: s5, s6: s6 };
  // build S6 from stock images
  const stockDir = path.join(IMG, "_src", "stock");
  const stocks = fs.existsSync(stockDir) ? fs.readdirSync(stockDir).filter(f => /\.jpg$/i.test(f)) : [];
  SPEC["s6-lifestyle"] = stocks.slice(0, 14).map((s, i) => ({ stock: s, ...S6COPY[i % S6COPY.length] }));
  let total = 0; const manifest = [];
  const cap = (style, o) => o.title || o.quote || (o.points ? o.eyebrow + ": " + o.points.map(p => p.h).join(", ") : "") || (o.rows ? "Gentle vs harsh: " + o.rows.map(r => r[1]).join(", ") : "");
  for (const [style, items] of Object.entries(SPEC)) {
    const fn = R[style.slice(0, 2)];
    for (let i = 0; i < items.length; i++) {
      const id = String(i + 1).padStart(2, "0");
      await save(style, id, await fn(items[i])); total++;
      manifest.push({ style, file: `marketing/social/${style}/${id}.jpg`, caption: cap(style, items[i]) });
    }
  }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 0));
  console.log(`\n✓ ${total} images generated in marketing/social/  (+ manifest.json)`);
}

const mode = process.argv[2] || "proofs";
(mode === "all" ? generateAll() : mode === "proofs" ? proofs() : Promise.resolve()).catch(e => { console.error(e); process.exit(1); });
