/* Photoreal product imagery via Google Gemini 2.5 Flash Image ("Nano Banana")
   through OpenRouter. Feeds the REAL product photo as a reference and asks the
   model to place it into a scene with matched lighting (product preserved).
   Run: node tools/nano-images.js <OPENROUTER_KEY> proofs
   Output: marketing/social/nano/<id>.jpg  (cropped to 1080x1350 4:5) */
const fs = require("fs"); const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "assets", "img");
const OUT = path.join(ROOT, "marketing", "social", "nano");
const KEY = process.argv[2];
const MODE = process.argv[3] || "proofs";
const MODEL = "google/gemini-2.5-flash-image";
const W = 1080, H = 1350;
fs.mkdirSync(OUT, { recursive: true });

const dataURL = p => "data:image/jpeg;base64," + fs.readFileSync(p).toString("base64");

// Shared style spine for every prompt — the "pro technique" wrapper.
const STYLE = "Professional commercial product photography, photorealistic, ultra-detailed, true-to-life PBR materials, natural soft diffused lighting with gentle realistic shadows and subtle reflections, shot on an 85mm lens with shallow depth of field, vertical 4:5 portrait composition, premium clean-beauty editorial aesthetic, muted natural color grade. CRITICAL: reproduce the provided product EXACTLY as shown — identical bottle shape, pump, proportions, label text and colors; do not redesign, restyle, warp, or relabel it. Integrate it naturally into the scene with lighting and shadows that match the environment.";

async function gen(id, prompt, refs) {
  const content = [{ type: "text", text: `${prompt}\n\n${STYLE}` }];
  for (const r of refs) content.push({ type: "image_url", image_url: { url: dataURL(r) } });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://www.eliraliving.com", "X-Title": "Elira Living" },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], max_tokens: 8192, messages: [{ role: "user", content }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 400)}`);
  const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!img) throw new Error("no image in response: " + JSON.stringify(j).slice(0, 400));
  const b64 = img.split(",")[1];
  const raw = Buffer.from(b64, "base64");
  const f = path.join(OUT, id + ".jpg");
  await sharp(raw).resize(W, H, { fit: "cover" }).jpeg({ quality: 90, mozjpeg: true }).toFile(f);
  const usage = j.usage ? ` (${j.usage.total_tokens} tok)` : "";
  console.log("✓", path.relative(ROOT, f) + usage);
}

/* ---- brand text overlay (embedded fonts) for finished posts -------------- */
const b64 = f => fs.readFileSync(path.join(__dirname, "fonts", f)).toString("base64");
const FONTCSS = `<style>@font-face{font-family:'BodoniEmbed';src:url(data:font/ttf;base64,${b64("Bodoni.ttf")}) format('truetype');}@font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${b64("Inter.ttf")}) format('truetype');}</style>`;
const CC = { cream: "#ECE7DB", gold: "#C8A24E", ink: "#171B12" };
const escX = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(t, m) { const w = t.split(" "); const o = []; let l = ""; for (const x of w) { if ((l + " " + x).trim().length > m) { o.push(l.trim()); l = x; } else l += " " + x; } if (l.trim()) o.push(l.trim()); return o; }
async function addCopy(buf, o) {
  const hl = wrap(o.title, 20);
  const top = H - 86 - 40 - hl.length * 74 - 30;
  const head = hl.map((l, i) => `<text x="80" y="${top + 40 + i * 74}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="64">${escX(l)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${FONTCSS}
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${CC.ink}" stop-opacity="0"/><stop offset="100%" stop-color="${CC.ink}" stop-opacity="0.82"/></linearGradient></defs>
    <rect x="0" y="${H - 560}" width="${W}" height="560" fill="url(#s)"/>
    <text x="${W / 2}" y="92" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="40" text-anchor="middle" letter-spacing="2">elira living</text>
    <text x="80" y="${top - 36}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="6" font-weight="600">${escX(o.eyebrow.toUpperCase())}</text>
    ${head}
    <rect x="0" y="${H - 86}" width="${W}" height="86" fill="${CC.ink}" fill-opacity="0.55"/>
    <text x="${W / 2}" y="${H - 33}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="27" letter-spacing="3" text-anchor="middle">FREE SHIPPING · VEGAN · ECOCERT COSMOS</text>
  </svg>`;
  return sharp(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

/* ---- full library spec --------------------------------------------------- */
const PRODUCTS = [
  { ref: "pep.png", name: "Peptide Anti-Aging Serum", cat: "skin", desc: "a small frosted blush-pink glass serum bottle with a white pump and cream label", title: "Firmer skin, none of the sting." },
  { ref: "p4.png", name: "Retinol Alternative Serum", cat: "skin", desc: "a skincare serum bottle with a dropper/pump and cream label", title: "Retinol results, zero burn." },
  { ref: "cream.png", name: "Sensitive Moisturizing Cream", cat: "skin", desc: "a skincare cream jar/tube with cream label", title: "Calm skin, no compromise." },
  { ref: "p1.png", name: "Radiant Glow Cleanser", cat: "skin", desc: "a facial cleanser pump bottle with cream label", title: "Clean that doesn't strip." },
  { ref: "p3.png", name: "Purifying Toner", cat: "skin", desc: "a toner bottle with cream label", title: "Clarify without the sting." },
  { ref: "p2.png", name: "Sensitive Scalp Shampoo", cat: "hair", desc: "a shampoo bottle with cream label", title: "For scalps that react to everything." },
];
const SCENES = p => {
  const lifestyle = p.cat === "hair"
    ? "A woman with healthy hair, a towel around her shoulders, holds the product in a bright airy bathroom, soft daylight, natural blurred background"
    : "A woman with healthy glowing skin gently holds the product near her cheek, soft daylight, minimal neutral blurred background, intimate skincare moment";
  return [
    { id: "hero", eyebrow: p.name, title: p.title, prompt: `Hero shot: ${p.desc} standing on a wet dark stone surface with delicate water ripples, deep sage-green moody background, a single soft studio key light from upper right, droplets on the bottle, luxurious and minimal.` },
    { id: "vanity", eyebrow: "The gentle ritual", title: "Slow mornings, calmer skin.", prompt: `${p.desc} on a pale marble vanity beside a small eucalyptus sprig and a folded linen towel, soft morning window light from the left, a few water droplets, calm spa atmosphere, background softly blurred.` },
    { id: "model", eyebrow: "Results without irritation", title: "Strong results. Soft on you.", prompt: `${lifestyle}. The product is clearly visible and in sharp focus.` },
    { id: "flatlay", eyebrow: "Plant-powered", title: "Nature, but proven.", prompt: `Top-down flatlay: ${p.desc} on natural beige linen with scattered fresh botanical leaves, eucalyptus and a few water drops, soft even overhead light, calm editorial styling.` },
  ];
};

async function buildAll() {
  const manifest = [];
  const cleanDir = path.join(OUT, "clean"), postDir = path.join(OUT, "post");
  fs.mkdirSync(cleanDir, { recursive: true }); fs.mkdirSync(postDir, { recursive: true });
  for (const p of PRODUCTS) {
    const ref = path.join(IMG, "_src", p.ref);
    const slug = p.ref.replace(/\.png$/, "");
    for (const s of SCENES(p)) {
      const id = `${slug}-${s.id}`;
      try {
        await gen2(path.join(cleanDir, id + ".jpg"), s.prompt, [ref]);
        const posted = await addCopy(fs.readFileSync(path.join(cleanDir, id + ".jpg")), s);
        const pf = path.join(postDir, id + ".jpg"); fs.writeFileSync(pf, posted);
        manifest.push({ style: "photoreal", file: path.relative(ROOT, pf).split(path.sep).join("/"), caption: `${p.name} — ${s.title}` });
        console.log("  ↳ posted", id);
      } catch (e) { console.error("✗", id, e.message); }
    }
  }
  // fold in the free programmatic text styles already generated by content-images.js
  const cm = path.join(ROOT, "marketing", "social", "manifest.json");
  if (fs.existsSync(cm)) for (const e of JSON.parse(fs.readFileSync(cm))) if (/s2-quote|s4-review|s5-compare/.test(e.style)) manifest.push(e);
  fs.writeFileSync(path.join(ROOT, "marketing", "social", "library.json"), JSON.stringify(manifest, null, 0));
  console.log(`\n✓ library.json — ${manifest.length} curated images (${manifest.filter(m => m.style === "photoreal").length} photoreal + text styles)`);
}
// gen variant that writes to an explicit path
async function gen2(outPath, prompt, refs) {
  const content = [{ type: "text", text: `${prompt}\n\n${STYLE}` }];
  for (const r of refs) content.push({ type: "image_url", image_url: { url: dataURL(r) } });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://www.eliraliving.com", "X-Title": "Elira Living" }, body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], max_tokens: 8192, messages: [{ role: "user", content }] }) });
  const j = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!img) throw new Error("no image: " + JSON.stringify(j).slice(0, 300));
  await sharp(Buffer.from(img.split(",")[1], "base64")).resize(W, H, { fit: "cover" }).jpeg({ quality: 92, mozjpeg: true }).toFile(outPath);
  console.log("✓", path.relative(ROOT, outPath));
}

const PEP = path.join(IMG, "_src", "pep_front_nobox.jpg");
const PROOFS = [
  ["proof-1", "Place the product on a pale marble bathroom shelf beside a small eucalyptus sprig, soft morning window light from the left, a few water droplets on the marble, calm spa atmosphere, background softly blurred."],
  ["proof-2", "A woman with healthy natural skin gently holds the product near her cheek, soft daylight, minimal neutral blurred background, intimate skincare-routine moment, focus on the bottle in her hand."],
  ["proof-3", "Hero shot of the product standing on a wet dark stone surface with delicate water ripples, deep sage-green moody background, a single soft studio key light from upper right, luxurious and minimal."],
];

(async () => {
  if (!fs.existsSync(PEP)) throw new Error("missing reference " + PEP);
  if (MODE === "proofs") for (const [id, p] of PROOFS) { try { await gen(id, p, [PEP]); } catch (e) { console.error("✗", id, e.message); } }
  else if (MODE === "all") await buildAll();
  console.log("\nDone. See marketing/social/nano/");
})().catch(e => { console.error(e); process.exit(1); });
