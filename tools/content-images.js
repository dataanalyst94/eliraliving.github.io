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
const SERIF = "Bodoni Moda, Didot, Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Segoe UI', Arial, sans-serif";

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

async function svg(s) { return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`)).png().toBuffer(); }
async function save(style, id, buf) { const d = path.join(OUT, style); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, id + ".jpg"); await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(f); console.log("✓", path.relative(ROOT, f)); }

/* ---- STYLE TEMPLATES ---------------------------------------------------- */
// S1 hero: product image base + eyebrow/headline + offer bar
async function s1(o) {
  const base = await sharp(path.join(IMG, o.product)).resize(W, H, { fit: "cover" }).toBuffer();
  const over = await svg(`${logo}${eyebrow(80, 250, o.eyebrow)}${headline(80, 340, wrap(o.title, 16))}${offerBar}`);
  return sharp(base).composite([{ input: over }]).png().toBuffer();
}
// S2 quote card
async function s2(o) { return svg(`${bg()}${logo}${eyebrow(W / 2, 430, o.eyebrow)} <g/>${headline(W / 2, 560, wrap(o.quote, 20), 76, 96, "middle")}${body(W / 2, 560 + wrap(o.quote, 20).length * 96 + 40, [o.sub || ""], 30, 42, C.sage, "middle")}`.replace("<g/>", `<line x1="${W / 2 - 40}" y1="395" x2="${W / 2 + 40}" y2="395" stroke="${C.gold}" stroke-width="2"/>`)); }
// S3 ingredient spotlight: product + callouts
async function s3(o) {
  const cut = fs.existsSync(path.join(IMG, "_src", o.cut)) ? path.join(IMG, "_src", o.cut) : null;
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
// S6 lifestyle: stock photo base (if provided) + headline; else soft gradient placeholder
async function s6(o) {
  let base;
  const stock = o.stock && path.join(IMG, "_src", o.stock);
  if (stock && fs.existsSync(stock)) base = await sharp(stock).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.78 }).toBuffer();
  else base = await svg(bg(`<rect width="${W}" height="${H}" fill="${C.forest}" fill-opacity="0.2"/>`));
  const over = await svg(`<rect width="${W}" height="${H}" fill="${C.ink}" fill-opacity="0.25"/>${logo}${eyebrow(80, H - 360, o.eyebrow)}${headline(80, H - 270, wrap(o.title, 18), 70, 80)}${body(80, H - 150, wrap(o.sub || "", 40), 28, 38, C.cream)}`);
  return sharp(base).composite([{ input: over }]).png().toBuffer();
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

const mode = process.argv[2] || "proofs";
(mode === "proofs" ? proofs() : Promise.resolve()).catch(e => { console.error(e); process.exit(1); });
