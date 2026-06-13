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
async function addCopy(buf, o, bar) {
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
    <text x="${W / 2}" y="${H - 33}" fill="${CC.cream}" font-family="InterEmbed,sans-serif" font-size="27" letter-spacing="3" text-anchor="middle">${escX(bar)}</text>
  </svg>`;
  return sharp(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}


/* ---- trilingual library spec --------------------------------------------- */
// All copy is traceable ONLY to each product's on-site description
// (EU Reg. 655/2013 — no claims beyond the substantiated product copy).
const SCENES = ["hero", "vanity", "modelf", "modelm", "flatlay"];
const BAR = {
  en: "VEGAN · CRUELTY-FREE · COSMOS NATURAL",
  de: "VEGAN · TIERVERSUCHSFREI · COSMOS NATURAL",
  nl: "VEGAN · DIERPROEFVRIJ · COSMOS NATURAL",
};

// Female / male lifestyle templates per category.
function lifestyle(p, sex) {
  if (sex === "m") {
    // masculine: upright posture, firm grip, calm serious/neutral expression —
    // NOT soft, coy, seductive, no head tilt, no pouting.
    const grip = "holds {P} firmly and confidently in front of him at about chest height, presenting the bottle clearly to camera";
    const look = "calm, serious, self-assured expression, relaxed strong jaw, looking straight at the camera, upright squared shoulders, masculine grounded posture; not soft, not coy, not seductive, no head tilt, no pouted lips";
    if (p.cat === "hair")
      return `A confident man with healthy, well-groomed hair and light stubble, a towel over one shoulder, ${grip}, in a bright airy bathroom, soft natural daylight, calm blurred background, ${look}`;
    return `A confident man with healthy, well-groomed skin and light stubble, ${grip}, soft natural daylight, minimal neutral blurred background, ${look}`;
  }
  if (p.cat === "hair")
    return `A woman with healthy, glowing hair, a soft towel around the shoulders, holds {P} in a bright airy bathroom, soft natural daylight, calm blurred background, modern clean-beauty moment`;
  return `A woman with healthy, glowing skin gently holds {P} near the face, soft natural daylight, minimal neutral blurred background, intimate skincare moment`;
}
const FRAME = " The bottle is turned at a slight three-quarter angle so the tiny fine print on the label is not sharply legible, while the brand name and product name remain clearly visible and in focus.";

const PRODUCTS = [
  {
    ref: "pep.png", slug: "pep", cat: "skin",
    desc: "a small frosted blush-pink glass serum bottle with a white pump dispenser (NOT a glass dropper) and a cream label",
    copy: {
      hero:    { en: ["Peptide Anti-Aging Serum", "Visibly softer fine lines."], de: ["Peptid Anti-Aging Serum", "Sichtbar glattere Fältchen."], nl: ["Peptide Anti-Aging Serum", "Zichtbaar gladdere lijntjes."] },
      vanity:  { en: ["The evening ritual", "Wind down. Smooth on."], de: ["Das Abendritual", "Zur Ruhe kommen."], nl: ["Het avondritueel", "Tot rust komen."] },
      modelf:  { en: ["Hexapeptide-11 + Ginkgo", "Plumper, firmer skin."], de: ["Hexapeptid-11 + Ginkgo", "Pralle, festere Haut."], nl: ["Hexapeptide-11 + Ginkgo", "Voller, stevigere huid."] },
      modelm:  { en: ["Anti-aging, for everyone", "Smooth lines. Any age."], de: ["Anti-Aging, für alle", "Glatte Linien. Jedes Alter."], nl: ["Anti-aging, voor iedereen", "Gladde lijnen. Elke leeftijd."] },
      flatlay: { en: ["Plant-powered, vegan", "Peptides, the gentle way."], de: ["Pflanzenkraft, vegan", "Peptide, ganz sanft."], nl: ["Plantkracht, vegan", "Peptiden, de zachte manier."] },
    },
  },
  {
    ref: "p4.png", slug: "p4", cat: "skin",
    desc: "a skincare serum bottle with a pump and a cream label",
    copy: {
      hero:    { en: ["Retinol Alternative Serum", "Refines texture, no irritation."], de: ["Retinol-Alternative Serum", "Verfeinert die Haut, ohne Reizung."], nl: ["Retinol-alternatief Serum", "Verfijnt de huid, zonder irritatie."] },
      vanity:  { en: ["The nightly swap", "Retinol results, plant-based."], de: ["Der Abend-Tausch", "Retinol-Effekt, pflanzlich."], nl: ["De avondwissel", "Retinol-effect, plantaardig."] },
      modelf:  { en: ["2% Bidens Pilosa", "Softer lines, even tone."], de: ["2% Bidens Pilosa", "Sanftere Linien, ebenmäßiger Teint."], nl: ["2% Bidens Pilosa", "Zachtere lijnen, egale teint."] },
      modelm:  { en: ["For all skin types", "Refined skin, zero sting."], de: ["Für jeden Hauttyp", "Verfeinerte Haut, kein Brennen."], nl: ["Voor elk huidtype", "Verfijnde huid, geen branderig gevoel."] },
      flatlay: { en: ["Plant-powered, vegan", "Nature's retinol alternative."], de: ["Pflanzenkraft, vegan", "Die pflanzliche Retinol-Alternative."], nl: ["Plantkracht, vegan", "Het plantaardige retinol-alternatief."] },
    },
  },
  {
    ref: "cream.png", slug: "cream", cat: "skin",
    desc: "a skincare cream tube with a cream label",
    copy: {
      hero:    { en: ["Sensitive Moisturizing Cream", "Soothes sensitive skin."], de: ["Feuchtigkeitscreme Sensitiv", "Beruhigt empfindliche Haut."], nl: ["Hydraterende Crème Gevoelig", "Kalmeert de gevoelige huid."] },
      vanity:  { en: ["Fragrance-free care", "Calm, strengthened skin."], de: ["Parfümfreie Pflege", "Ruhige, gestärkte Haut."], nl: ["Parfumvrije verzorging", "Rustige, sterkere huid."] },
      modelf:  { en: ["Daily moisture", "Soft skin, no fragrance."], de: ["Tägliche Feuchtigkeit", "Weiche Haut, parfümfrei."], nl: ["Dagelijkse hydratatie", "Zachte huid, parfumvrij."] },
      modelm:  { en: ["Made for reactive skin", "Strength for sensitive skin."], de: ["Für reaktive Haut", "Stärke für sensible Haut."], nl: ["Voor reactieve huid", "Kracht voor de gevoelige huid."] },
      flatlay: { en: ["Plant-powered, vegan", "Bare-minimum, by design."], de: ["Pflanzenkraft, vegan", "Bewusst minimalistisch."], nl: ["Plantkracht, vegan", "Bewust minimalistisch."] },
    },
  },
  {
    ref: "p1.png", slug: "p1", cat: "skin",
    desc: "a facial cleanser pump bottle with a cream label",
    copy: {
      hero:    { en: ["Radiant Glow Cleanser", "Fresh, radiant skin."], de: ["Radiant Glow Reiniger", "Frische, strahlende Haut."], nl: ["Radiant Glow Reiniger", "Frisse, stralende huid."] },
      vanity:  { en: ["The morning rinse", "A gentle daily cleanse."], de: ["Die Morgenreinigung", "Eine sanfte tägliche Reinigung."], nl: ["De ochtendreiniging", "Een zachte dagelijkse reiniging."] },
      modelf:  { en: ["Lifts away impurities", "Clean skin, kept calm."], de: ["Löst Unreinheiten", "Saubere Haut, schön ruhig."], nl: ["Verwijdert onzuiverheden", "Schone huid, lekker rustig."] },
      modelm:  { en: ["Daily, for everyone", "Fresh start, every morning."], de: ["Täglich, für alle", "Frischer Start, jeden Morgen."], nl: ["Dagelijks, voor iedereen", "Frisse start, elke ochtend."] },
      flatlay: { en: ["Plant-powered, vegan", "Clean that respects skin."], de: ["Pflanzenkraft, vegan", "Reinigung, die die Haut achtet."], nl: ["Plantkracht, vegan", "Reiniging die de huid respecteert."] },
    },
  },
  {
    ref: "p3.png", slug: "p3", cat: "skin",
    desc: "a toner bottle with a cream label",
    copy: {
      hero:    { en: ["Purifying Toner", "Clears pores, balanced skin."], de: ["Klärendes Gesichtswasser", "Klärt Poren, ausgeglichene Haut."], nl: ["Zuiverende Toner", "Heldere poriën, balans in de huid."] },
      vanity:  { en: ["Between cleanse & serum", "Fresh, supple, balanced."], de: ["Zwischen Reinigung & Serum", "Frisch, geschmeidig, im Gleichgewicht."], nl: ["Tussen reiniging & serum", "Fris, soepel, in balans."] },
      modelf:  { en: ["For oily & combination skin", "Clarified, not stripped."], de: ["Für fettige & Mischhaut", "Geklärt, nicht ausgetrocknet."], nl: ["Voor vette & gemengde huid", "Gezuiverd, niet uitgedroogd."] },
      modelm:  { en: ["Fragrance-free", "Balance for oily skin."], de: ["Parfümfrei", "Balance für fettige Haut."], nl: ["Parfumvrij", "Balans voor de vette huid."] },
      flatlay: { en: ["Plant-powered, vegan", "Purify, the calm way."], de: ["Pflanzenkraft, vegan", "Klären, ganz ruhig."], nl: ["Plantkracht, vegan", "Zuiveren, op een rustige manier."] },
    },
  },
  {
    ref: "p2.png", slug: "p2", cat: "hair",
    desc: "a shampoo bottle with a cream label",
    copy: {
      hero:    { en: ["Sensitive Scalp Shampoo", "Gentle on sensitive scalps."], de: ["Shampoo Sensitive Kopfhaut", "Sanft zur empfindlichen Kopfhaut."], nl: ["Shampoo Gevoelige Hoofdhuid", "Zacht voor de gevoelige hoofdhuid."] },
      vanity:  { en: ["Dermatologically tested", "Soothes from the roots."], de: ["Dermatologisch getestet", "Beruhigt ab dem Ansatz."], nl: ["Dermatologisch getest", "Kalmeert vanaf de wortel."] },
      modelf:  { en: ["All hair types", "Calm scalp, soft hair."], de: ["Für jeden Haartyp", "Ruhige Kopfhaut, weiches Haar."], nl: ["Voor elk haartype", "Rustige hoofdhuid, zacht haar."] },
      modelm:  { en: ["For reactive scalps", "Wash gentle, every day."], de: ["Für reaktive Kopfhaut", "Sanft waschen, jeden Tag."], nl: ["Voor reactieve hoofdhuid", "Zacht wassen, elke dag."] },
      flatlay: { en: ["Plant-powered, vegan", "Scalp care, simplified."], de: ["Pflanzenkraft, vegan", "Kopfhautpflege, einfach gemacht."], nl: ["Plantkracht, vegan", "Hoofdhuidverzorging, vereenvoudigd."] },
    },
  },
];

function scenePrompt(p, scene) {
  const D = p.desc;
  if (scene === "hero")
    return `Hero shot: ${D} standing on a wet dark stone surface with delicate water ripples, deep muted sage-green moody background, a single soft studio key light from upper right, fine water droplets on the bottle, luxurious minimal clean-beauty editorial.${FRAME}`;
  if (scene === "vanity")
    return `${D} on a pale marble vanity beside a small eucalyptus sprig and a folded linen towel, soft morning window light from the left, a few water droplets, calm spa atmosphere, background softly blurred.`;
  if (scene === "flatlay")
    return `Top-down flatlay: ${D} on natural beige linen with scattered fresh botanical leaves, eucalyptus and a few water drops, soft even overhead light, calm editorial styling.`;
  const sex = scene === "modelm" ? "m" : "f";
  return `${lifestyle(p, sex).replace("{P}", D)}. The product is clearly visible and in sharp focus.${FRAME}`;
}

async function buildLibrary() {
  const cleanDir = path.join(OUT, "clean");
  fs.mkdirSync(cleanDir, { recursive: true });
  const FORCE = (process.argv[4] || "").split(",").filter(Boolean); // e.g. pep-modelf
  const manifest = [];

  // 1) ensure all 30 clean photos exist (reuse cache; regenerate forced ones)
  for (const p of PRODUCTS) {
    for (const scene of SCENES) {
      const id = `${p.slug}-${scene}`;
      const f = path.join(cleanDir, id + ".jpg");
      const need = !fs.existsSync(f) || FORCE.includes(id);
      if (need) {
        try { await gen2(f, scenePrompt(p, scene), [path.join(IMG, "_src", p.ref)]); }
        catch (e) { console.error("✗ gen", id, e.message); continue; }
      } else console.log("• cached", id);
    }
  }

  // 2) overlay copy in every language (overlay-only = no API cost)
  for (const lang of ["en", "de", "nl"]) {
    const postDir = path.join(OUT, "post", lang);
    fs.mkdirSync(postDir, { recursive: true });
    for (const p of PRODUCTS) {
      for (const scene of SCENES) {
        const id = `${p.slug}-${scene}`;
        const clean = path.join(cleanDir, id + ".jpg");
        if (!fs.existsSync(clean)) continue;
        const [eyebrow, title] = p.copy[scene][lang];
        const posted = await addCopy(fs.readFileSync(clean), { eyebrow, title }, BAR[lang]);
        const pf = path.join(postDir, id + ".jpg");
        fs.writeFileSync(pf, posted);
        manifest.push({
          file: path.relative(ROOT, pf).split(path.sep).join("/"),
          lang, product: p.slug, scene,
          eyebrow, title,
          caption: `${eyebrow} — ${title}`,
        });
      }
    }
    console.log(`✓ ${lang.toUpperCase()} overlays done`);
  }

  fs.writeFileSync(path.join(OUT, "library.json"), JSON.stringify(manifest, null, 0));
  console.log(`\n✓ library.json — ${manifest.length} images (${manifest.length / 3} concepts × 3 languages)`);
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

(async () => { await buildLibrary(); console.log("\nDone. See marketing/social/nano/post/<lang>/"); })()
  .catch(e => { console.error(e); process.exit(1); });
