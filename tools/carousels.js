/* Educational Instagram carousels (DE / NL) — top-notch, EU-compliant.
   COPY  : Claude Haiku 4.5 via OpenRouter (carousel best-practices in the prompt,
           strict JSON out, claims locked to substantiated product facts).
   IMAGE : Google Gemini 2.5 Flash Image via OpenRouter for fresh texture +
           ingredient visuals; cached clean product/model photos reused for the rest.
   OUT   : marketing/social/carousels/<lang>/<slug>/card-1..6.jpg  + carousels.json

   Run:  node tools/carousels.js <OPENROUTER_KEY> [slug1,slug2 | all] [de,nl]
   e.g.  node tools/carousels.js sk-or-v1-... pep de,nl     (review batch: 1 product)
         node tools/carousels.js sk-or-v1-... all de,nl     (full run)
*/
const fs = require("fs"); const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "assets", "img");
const CLEAN = path.join(ROOT, "marketing", "social", "nano", "clean");
const OUT = path.join(ROOT, "marketing", "social", "carousels");
const CARDIMG = path.join(OUT, "_cardimg"); // cached Gemini texture/ingredient shots
const KEY = process.argv[2];
const ONLY = (process.argv[3] || "all");
const LANGS = (process.argv[4] || "de,nl").split(",").filter(Boolean);
const TXT_MODEL = "anthropic/claude-haiku-4.5";
const IMG_MODEL = "google/gemini-2.5-flash-image";
const W = 1080, H = 1350;
fs.mkdirSync(CARDIMG, { recursive: true });

const dataURL = p => "data:image/jpeg;base64," + fs.readFileSync(p).toString("base64");
const ORH = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://www.eliraliving.com", "X-Title": "Elira Living" };

/* ---------- product knowledge (substantiated facts only) ------------------- */
const LANGNAME = { de: "German", nl: "Dutch", en: "English" };
const PRODUCTS = [
  { slug: "pep", ref: "pep.png", cat: "skin", name: "Peptide Anti-Aging Serum",
    facts: "2% Hexapeptide-11 and Ginkgo Biloba; visibly softens fine lines for plumper, firmer-looking skin; for normal to dry skin; lightweight serum in a frosted blush-pink glass bottle with a white pump.",
    ingredients: "2% Hexapeptide-11, Ginkgo Biloba extract",
    textureGen: "a single glossy translucent drop of lightweight peptide serum on a frosted blush-pink glass surface, extreme macro, soft caustic highlights",
    ingredientGen: "a calm botanical still life of fresh green Ginkgo Biloba leaves and a small dish of clear serum on pale stone, soft daylight" },
  { slug: "p4", ref: "p4.png", cat: "skin", name: "Retinol Alternative Serum",
    facts: "2% Bidens Pilosa, a plant-based retinol alternative; refines skin texture and softens fine lines without irritation; suitable for all skin types.",
    ingredients: "2% Bidens Pilosa (plant-based retinol alternative)",
    textureGen: "a smooth silky drop of plant serum spreading on frosted glass, extreme macro, warm soft highlights",
    ingredientGen: "a botanical still life of fresh Bidens Pilosa wildflowers and green leaves beside a serum bottle on pale linen, soft daylight" },
  { slug: "cream", ref: "cream.png", cat: "skin", name: "Sensitive Moisturizing Cream",
    facts: "Fragrance-free moisturizer that soothes and strengthens sensitive skin.",
    ingredients: "fragrance-free soothing moisturizing base",
    textureGen: "a soft swirl of rich white moisturizing cream with a clean peak, extreme macro on pale stone, soft diffuse light",
    ingredientGen: "a minimal calm still life of a cream jar with soft white cream and a few green leaves on pale neutral linen, fragrance-free clean-beauty mood" },
  { slug: "p1", ref: "p1.png", cat: "skin", name: "Radiant Glow Cleanser",
    facts: "Gentle daily cleanser that lifts away impurities for fresh, radiant-looking skin.",
    ingredients: "gentle daily cleansing base",
    textureGen: "soft fresh cleansing foam and light bubbles on a wet pale surface, extreme macro, fresh airy highlights",
    ingredientGen: "a fresh clean still life of a cleanser pump bottle with water droplets and green leaves on pale stone, morning light" },
  { slug: "p3", ref: "p3.png", cat: "skin", name: "Purifying Toner",
    facts: "Fragrance-free toner that clears pores and balances oily and combination skin.",
    ingredients: "fragrance-free pore-clarifying base",
    textureGen: "a clear toner liquid splash and droplets on frosted glass, extreme macro, crisp clean highlights",
    ingredientGen: "a fresh still life of a toner bottle with a cotton pad and water droplets and green leaves on pale stone, clean light" },
  { slug: "p2", ref: "p2.png", cat: "hair", name: "Sensitive Scalp Shampoo",
    facts: "Soothing, dermatologically tested shampoo for sensitive scalps; suitable for all hair types.",
    ingredients: "soothing dermatologically-tested cleansing base",
    textureGen: "soft gentle shampoo lather and fine bubbles on a wet pale surface, extreme macro, soft soothing highlights",
    ingredientGen: "a calm clean still life of a shampoo bottle with soft lather and green leaves on pale stone, soft bathroom daylight" },
];
const CERT = "ECOCERT COSMOS Natural certified, vegan, cruelty-free, made in the EU";

/* ---------- Haiku: carousel copy (best practices in the brief) ------------- */
function copyPrompt(p, lang) {
  return `You are the senior social copywriter for Elira Living, a vegan, ECOCERT COSMOS Natural, cruelty-free skincare brand made in the EU (sells to Germany and the Netherlands). Voice: calm, confident, proof over hype — premium clean-beauty, never salesy.

Write a 6-card educational Instagram CAROUSEL for the "${p.name}" entirely in ${LANGNAME[lang]}.

SUBSTANTIATED FACTS (you may ONLY make claims supported by these — EU Reg. 655/2013, no medical, anti-disease, or exaggerated claims, no "cures", no guarantees):
- ${p.facts}
- Key ingredients: ${p.ingredients}
- Brand proof: ${CERT}${p.cat === "hair" ? "; dermatologically tested" : ""}

CLAIMS DISCIPLINE (hard rules — a violation makes the copy unusable):
- NEVER invent numbers, percentages, timeframes or statistics. Forbidden examples: "in 4 weeks / in vier Wochen / in 4 weken", "90% saw results", "2x more". The ONLY figures you may state are those literally in the facts above (e.g. the 2% active). No time-to-result or before/after promises.
- Keep every benefit "soft" and appearance-based ("lässt die Haut praller wirken" / "doet de huid voller lijken"), never a guaranteed clinical result.
- The HOOK (card 1) must be self-contained — no pronoun ("sie/ze/they") referring to something the reader hasn't seen yet.

CAROUSEL BEST PRACTICES TO FOLLOW:
- Card 1 = the HOOK: a scroll-stopping, curiosity-driven headline (max 7 words). Open a loop the reader must swipe to close. No product name dump. Favour an emotional or problem-aware angle ("Warum brennt deine Kopfhaut?") over a textbook statement.
- Cards build one idea each; short, skimmable, mobile-first. Plain language.
- Lead with the BENEFIT/outcome, not the feature ("für sichtbar pralle Haut", not "enthält Peptide").
- Card 6 = a clear, single CTA. The CTA headline must name the concrete OUTCOME the reader gets (not a generic "mehr erfahren"). Light momentum, no fake urgency.
- Every card earns the next swipe.

ADDRESS FORM (critical, must be 100% consistent across ALL cards): Elira is a young, premium clean-beauty brand. Always use the INFORMAL address — ${lang === "de" ? "German \"du / dein / dir\" (NEVER the formal \"Sie / Ihre / Ihnen\")" : lang === "nl" ? "Dutch \"je / jij / jouw\" (NEVER the formal \"u / uw\")" : "English \"you / your\""}. Do not mix formal and informal anywhere.

LANGUAGE QUALITY: Write in flawless, natural, native ${LANGNAME[lang]}. Use only real, dictionary-correct ${LANGNAME[lang]} words — never invent words, never Germanise Dutch or Dutch-ise German (e.g. in Dutch use "voller/steviger", never the German "praller/pralere"), and never mix in English (no Denglish / no Dutch-English). Avoid English bottle/colour descriptors — describe them in ${LANGNAME[lang]} or omit. Translate EVERY descriptor and generic ingredient/base name fully into ${LANGNAME[lang]} (e.g. not "Fragrance-free Soothing Base" but ${lang === "de" ? "\"Duftfreie beruhigende Basis\"" : lang === "nl" ? "\"Geurvrije kalmerende basis\"" : "\"Fragrance-free soothing base\""}, not "Moisturizing Complex" but ${lang === "de" ? "\"Feuchtigkeitskomplex\"" : lang === "nl" ? "\"Hydraterend complex\"" : "\"Moisturizing complex\""}). ONLY these stay in their original form: proper INCI actives (Hexapeptide-11, Ginkgo Biloba, Bidens Pilosa) and "ECOCERT COSMOS Natural".

Return ONLY valid minified JSON, no markdown, exactly this shape:
{"hook":{"eyebrow":"2-3 word tag","headline":"max 7 words"},
"texture":{"eyebrow":"short tag","headline":"max 6 words","body":"max 14 words sensory line"},
"ingredients":{"eyebrow":"short tag","headline":"max 6 words","items":[{"name":"ingredient","benefit":"max 8 words"}]},
"forwhom":{"eyebrow":"short tag","headline":"max 6 words","body":"max 14 words"},
"proof":{"eyebrow":"short tag","headline":"max 6 words","points":["max 4 words","max 4 words","max 4 words"]},
"cta":{"eyebrow":"short tag","headline":"max 7 words, names the outcome","button":"2-3 word action","save":"short save-for-later nudge, max 5 words"}}`;
}

async function writeCopy(p, lang) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: ORH,
    body: JSON.stringify({ model: TXT_MODEL, max_tokens: 900, temperature: 0.8,
      messages: [{ role: "user", content: copyPrompt(p, lang) }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`copy ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  let t = (j.choices?.[0]?.message?.content || "").trim();
  t = t.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("no JSON from Haiku: " + t.slice(0, 200));
  return JSON.parse(t.slice(s, e + 1));
}

/* ---------- Gemini: fresh card visuals (texture + ingredient) -------------- */
const GENSTYLE = "Professional commercial clean-beauty photography, photorealistic, ultra-detailed, natural soft diffused light, muted natural color grade, premium editorial, vertical 4:5. No text, no words, no logos in the image.";
async function genCardImg(outPath, prompt, ref) {
  if (fs.existsSync(outPath)) { console.log("• cached", path.basename(outPath)); return; }
  const content = [{ type: "text", text: `${prompt}\n\n${GENSTYLE}` }];
  if (ref) content.push({ type: "image_url", image_url: { url: dataURL(ref) } });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: ORH,
    body: JSON.stringify({ model: IMG_MODEL, modalities: ["image", "text"], max_tokens: 8192, messages: [{ role: "user", content }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`img ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!img) throw new Error("no image: " + JSON.stringify(j).slice(0, 300));
  await sharp(Buffer.from(img.split(",")[1], "base64")).resize(W, H, { fit: "cover" }).jpeg({ quality: 92, mozjpeg: true }).toFile(outPath);
  console.log("✓ gen", path.basename(outPath));
}

/* ---------- brand card compositor ----------------------------------------- */
const bfont = f => fs.readFileSync(path.join(__dirname, "fonts", f)).toString("base64");
const FONTCSS = `<style>@font-face{font-family:'BodoniEmbed';src:url(data:font/ttf;base64,${bfont("Bodoni.ttf")}) format('truetype');}@font-face{font-family:'InterEmbed';src:url(data:font/ttf;base64,${bfont("Inter.ttf")}) format('truetype');}</style>`;
const CC = { cream: "#ECE7DB", gold: "#C8A24E", ink: "#171B12" };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(t, m) { const w = String(t).split(" "); const o = []; let l = ""; for (const x of w) { if ((l + " " + x).trim().length > m) { o.push(l.trim()); l = x; } else l += " " + x; } if (l.trim()) o.push(l.trim()); return o; }
const BAR = { en: "VEGAN · CRUELTY-FREE · COSMOS NATURAL", de: "VEGAN · TIERVERSUCHSFREI · COSMOS NATURAL", nl: "VEGAN · DIERPROEFVRIJ · COSMOS NATURAL" };

// shared chrome: wordmark + card counter (+ optional swipe hint)
let CARD_TOTAL = 6; // overridable for non-6-card carousels (e.g. routines)
const setCardTotal = n => { CARD_TOTAL = n; };
function chrome(idx, swipeHint) {
  const counter = `<text x="${W - 70}" y="${H - 54}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="26" text-anchor="end" opacity="0.85">${idx} / ${CARD_TOTAL}</text>`;
  const mark = `<text x="70" y="86" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="34" letter-spacing="2">elira living</text>`;
  const swipe = swipeHint ? `<text x="${W - 70}" y="86" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="24" text-anchor="end" letter-spacing="3">${esc(swipeHint)} →</text>` : "";
  return mark + swipe + counter;
}
function grad(fromY, toOpacity, dir) {
  const id = "g" + Math.random().toString(36).slice(2, 7);
  if (dir === "top") return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${CC.ink}" stop-opacity="${toOpacity}"/><stop offset="55%" stop-color="${CC.ink}" stop-opacity="0"/></linearGradient>`, rect: `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id})"/>` };
  return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${CC.ink}" stop-opacity="0"/><stop offset="${fromY}%" stop-color="${CC.ink}" stop-opacity="${toOpacity}"/></linearGradient>`, rect: `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id})"/>` };
}

async function render(bgBuf, svgInner, defs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${FONTCSS}<defs>${defs || ""}</defs>${svgInner}</svg>`;
  return sharp(bgBuf).resize(W, H, { fit: "cover" }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

// Card 1 — HOOK
async function cardHook(bg, d, lang) {
  const g = grad(35, 0.86);
  const hl = wrap(d.hook.headline, 16);
  const base = H - 150;
  const top = base - hl.length * 92;
  const head = hl.map((l, i) => `<text x="70" y="${top + i * 92}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="84">${esc(l)}</text>`).join("");
  const eb = `<text x="72" y="${top - 70}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="28" letter-spacing="6" font-weight="600">${esc(d.hook.eyebrow.toUpperCase())}</text>`;
  return render(bg, g.rect + chrome(1, lang === "de" ? "wischen" : lang === "nl" ? "veeg" : "swipe") + eb + head, g.def);
}
// generic content card (texture / for-whom): eyebrow + headline + body
async function cardLine(bg, idx, eyebrow, headline, body, lang) {
  const g = grad(40, 0.84);
  const hl = wrap(headline, 18);
  const bl = body ? wrap(body, 34) : [];
  const blockH = hl.length * 70 + (bl.length ? 24 + bl.length * 40 : 0);
  const top = H - 150 - blockH;
  const eb = `<text x="72" y="${top - 30}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="5" font-weight="600">${esc(eyebrow.toUpperCase())}</text>`;
  const head = hl.map((l, i) => `<text x="70" y="${top + 24 + i * 70}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="62">${esc(l)}</text>`).join("");
  const bodyY = top + 24 + hl.length * 70 + 30;
  const bod = bl.map((l, i) => `<text x="72" y="${bodyY + i * 40}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="30" opacity="0.92">${esc(l)}</text>`).join("");
  return render(bg, g.rect + chrome(idx) + eb + head + bod, g.def);
}
// Card 3 — INGREDIENTS list
async function cardIngredients(bg, d, lang) {
  const g = grad(34, 0.86);
  const hl = wrap(d.ingredients.headline, 18);
  const items = (d.ingredients.items || []).slice(0, 3);
  const itemH = 96;
  const block = hl.length * 66 + 30 + items.length * itemH;
  const top = H - 130 - block;
  const eb = `<text x="72" y="${top - 50}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="5" font-weight="600">${esc(d.ingredients.eyebrow.toUpperCase())}</text>`;
  const head = hl.map((l, i) => `<text x="70" y="${top + i * 66}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="58">${esc(l)}</text>`).join("");
  let iy = top + hl.length * 66 + 40;
  const list = items.map(it => {
    const nm = `<text x="96" y="${iy}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="32" font-weight="700">${esc(it.name)}</text>`;
    const bn = `<text x="96" y="${iy + 38}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="27" opacity="0.85">${esc(it.benefit)}</text>`;
    const dot = `<circle cx="78" cy="${iy - 10}" r="6" fill="${CC.gold}"/>`;
    iy += itemH; return dot + nm + bn;
  }).join("");
  return render(bg, g.rect + chrome(3) + eb + head + list, g.def);
}
// Card 5 — PROOF points + cert bar
async function cardProof(bg, d, lang) {
  const g = grad(34, 0.86);
  const hl = wrap(d.proof.headline, 18);
  const pts = (d.proof.points || []).slice(0, 3);
  const block = hl.length * 66 + 30 + pts.length * 58;
  const top = H - 200 - block;
  const eb = `<text x="72" y="${top - 50}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="5" font-weight="600">${esc(d.proof.eyebrow.toUpperCase())}</text>`;
  const head = hl.map((l, i) => `<text x="70" y="${top + i * 66}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="58">${esc(l)}</text>`).join("");
  let py = top + hl.length * 66 + 44;
  const list = pts.map(pt => { const row = `<text x="100" y="${py}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="31">${esc(pt)}</text><path d="M72 ${py - 11} l8 9 l16 -20" stroke="${CC.gold}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; py += 58; return row; }).join("");
  const bar = `<rect x="0" y="${H - 84}" width="${W}" height="84" fill="${CC.ink}" fill-opacity="0.6"/><text x="${W / 2}" y="${H - 32}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="3" text-anchor="middle">${esc(BAR[lang])}</text>`;
  return render(bg, g.rect + chrome(5) + eb + head + list + bar, g.def);
}
// Card 6 — CTA with button
async function cardCTA(bg, d, lang) {
  const g = grad(34, 0.88);
  const hl = wrap(d.cta.headline, 16);
  const top = H - 360 - hl.length * 84;
  const eb = `<text x="72" y="${top - 60}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="26" letter-spacing="5" font-weight="600">${esc(d.cta.eyebrow.toUpperCase())}</text>`;
  const head = hl.map((l, i) => `<text x="70" y="${top + i * 84}" fill="${CC.cream}" font-family="BodoniEmbed,serif" font-size="74">${esc(l)}</text>`).join("");
  const by = top + hl.length * 84 + 60;
  const label = (d.cta.button || "Shop now").toUpperCase();
  const btnW = 120 + label.length * 18;
  const btn = `<rect x="70" y="${by}" width="${btnW}" height="74" rx="37" fill="${CC.gold}"/><text x="${70 + btnW / 2}" y="${by + 48}" fill="${CC.ink}" font-family="InterEmbed,sans-serif" font-size="28" font-weight="700" letter-spacing="2" text-anchor="middle">${esc(label)}</text>`;
  const url = `<text x="70" y="${by + 132}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="30" letter-spacing="2">eliraliving.com</text>`;
  const sy = by + 184;
  const save = d.cta.save
    ? `<path d="M70 ${sy - 22} h22 v30 l-11 -8 l-11 8 z" fill="${CC.gold}"/><text x="106" y="${sy}" fill="${CC.gold}" font-family="InterEmbed,sans-serif" font-size="25" letter-spacing="1" opacity="0.95">${esc(d.cta.save)}</text>`
    : "";
  return render(bg, g.rect + chrome(6) + eb + head + btn + url + save, g.def);
}

/* ---------- per-product build --------------------------------------------- */
const cleanBuf = id => fs.readFileSync(path.join(CLEAN, id + ".jpg"));

// Composite all 6 cards from copy + cached/clean images. NO API calls — pure render.
// Card backgrounds (real product imagery, no AI-hallucinated blank bottles on card 3):
//   1 hook=hero · 2 texture=Gemini macro · 3 ingredients=flatlay (real product+botanicals)
//   4 for-whom=modelf · 5 proof=modelm · 6 cta=vanity
async function composeCards(p, copy, lang) {
  const texImg = path.join(CARDIMG, `${p.slug}-texture.jpg`);
  const bgFor = {
    1: cleanBuf(`${p.slug}-hero`),
    2: fs.readFileSync(texImg),
    3: cleanBuf(`${p.slug}-flatlay`),
    4: cleanBuf(`${p.slug}-modelf`),
    5: cleanBuf(`${p.slug}-modelm`),
    6: cleanBuf(`${p.slug}-vanity`),
  };
  return Promise.all([
    cardHook(bgFor[1], copy, lang),
    cardLine(bgFor[2], 2, copy.texture.eyebrow, copy.texture.headline, copy.texture.body, lang),
    cardIngredients(bgFor[3], copy, lang),
    cardLine(bgFor[4], 4, copy.forwhom.eyebrow, copy.forwhom.headline, copy.forwhom.body, lang),
    cardProof(bgFor[5], copy, lang),
    cardCTA(bgFor[6], copy, lang),
  ]);
}

function writeCards(p, lang, cards, manifest, copy) {
  const dir = path.join(OUT, lang, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (let i = 0; i < cards.length; i++) {
    const f = path.join(dir, `card-${i + 1}.jpg`);
    fs.writeFileSync(f, cards[i]);
    files.push(path.relative(ROOT, f).split(path.sep).join("/"));
  }
  manifest.push({ product: p.slug, name: p.name, lang, cards: files, copy });
}

async function buildProduct(p, manifest) {
  // 1) fresh Gemini texture visual for card 2 (language-neutral, generated once, cached)
  const texImg = path.join(CARDIMG, `${p.slug}-texture.jpg`);
  await genCardImg(texImg, p.textureGen, fs.existsSync(path.join(IMG, "_src", p.ref)) ? path.join(IMG, "_src", p.ref) : null);

  for (const lang of LANGS) {
    let copy;
    try { copy = await writeCopy(p, lang); }
    catch (e) { console.error(`✗ copy ${p.slug}/${lang}:`, e.message); continue; }
    const cards = await composeCards(p, copy, lang);
    writeCards(p, lang, cards, manifest, copy);
    console.log(`✓ carousel ${p.slug} / ${lang.toUpperCase()} — 6 cards`);
  }
}

module.exports = { PRODUCTS, OUT, ROOT, composeCards, writeCards, cleanBuf, setCardTotal, cardHook, cardLine, cardCTA, render };

if (require.main === module) {
  (async () => {
    if (!KEY) throw new Error("Pass the OpenRouter key as arg 1");
    const list = ONLY === "all" ? PRODUCTS : PRODUCTS.filter(p => ONLY.split(",").includes(p.slug));
    if (!list.length) throw new Error("no matching product for: " + ONLY);
    const manifest = [];
    for (const p of list) await buildProduct(p, manifest);
    fs.mkdirSync(OUT, { recursive: true });
    const mf = path.join(OUT, "carousels.json");
    const prev = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : [];
    const merged = prev.filter(x => !manifest.some(m => m.product === x.product && m.lang === x.lang)).concat(manifest);
    fs.writeFileSync(mf, JSON.stringify(merged, null, 0));
    console.log(`\n✓ Done. ${manifest.length} carousels this run · ${merged.length} total → ${path.relative(ROOT, mf)}`);
  })().catch(e => { console.error(e); process.exit(1); });
}
