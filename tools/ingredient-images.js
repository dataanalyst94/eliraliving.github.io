/* Photoreal botanical ingredient imagery for the "About Ingredients" page, via
   Google Gemini 2.5 Flash Image ("Nano Banana") through OpenRouter.
   Each ingredient gets one clean macro shot on the brand's dark nature-luxe
   palette. No packaging, no text, no people — just the raw ingredient.
   Run:  node tools/ingredient-images.js <OPENROUTER_KEY> [slug1,slug2,...]
   Output: assets/img/ingredients/<slug>.jpg (+ .webp), square 1024×1024. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "img", "ingredients");
const KEY = process.argv[2];
const ONLY = (process.argv[3] || "").split(",").filter(Boolean); // optional subset
const MODEL = "google/gemini-2.5-flash-image";
const SIZE = 1024;
fs.mkdirSync(OUT, { recursive: true });

if (!KEY) { console.error("Usage: node tools/ingredient-images.js <OPENROUTER_KEY> [slug,slug]"); process.exit(1); }

// Shared style spine — keeps all 8 images consistent with the site aesthetic.
const STYLE = "Professional commercial macro photography, photorealistic, ultra-detailed, true-to-life botanical textures, fresh and natural, soft diffused natural lighting with gentle realistic shadows and a few delicate water droplets, shallow depth of field, premium clean-beauty editorial styling, calm muted natural color grade on a dark moody deep sage-green background with subtle warm highlights. Centered composition with breathing room. Absolutely NO text, NO labels, NO packaging, NO bottles, NO hands or people — only the natural ingredient itself.";

// slug → subject prompt. Subjects are the botanical source of each INCI item.
const INGREDIENTS = [
  ["lavender",       "A small bundle of fresh purple lavender flower sprigs with green stems, a few loose buds scattered beside it"],
  ["cucumber",       "Fresh crisp cucumber: one whole cucumber with two clean-cut round slices showing the juicy seeds, dewy and fresh"],
  ["salicylic-acid", "A piece of natural white willow bark with a few slender green willow leaves resting beside it on dark stone"],
  ["glycerin",       "A single glossy green leaf covered in large clear glycerin-like dew droplets catching soft light, plant-derived purity"],
  ["betaine",        "A fresh sugar beet, deep magenta-red, one whole and one halved to show the pale inner flesh, with a green leaf"],
  ["plum",           "Two or three ripe deep-purple plums with a soft natural bloom on the skin, one halved to show the amber flesh and pit"],
  ["linden",         "Delicate pale-yellow linden (lime tree) blossoms with their long leaf bracts and soft green leaves"],
  ["coco-glucoside", "A fresh coconut, one whole and one halved showing the white flesh and clear coconut water, with a green palm leaf"],
];

async function gen(slug, subject) {
  const prompt = `${subject}.\n\n${STYLE}`;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://www.eliraliving.com", "X-Title": "Elira Living" },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], max_tokens: 8192, messages: [{ role: "user", content: [{ type: "text", text: prompt }] }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!img) throw new Error("no image in response: " + JSON.stringify(j).slice(0, 300));
  const raw = Buffer.from(img.split(",")[1], "base64");
  await sharp(raw).resize(SIZE, SIZE, { fit: "cover", position: "attention" }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, slug + ".jpg"));
  await sharp(raw).resize(SIZE, SIZE, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(path.join(OUT, slug + ".webp"));
  const usage = j.usage ? ` (${j.usage.total_tokens} tok)` : "";
  console.log("✓", slug + usage);
}

(async () => {
  const jobs = INGREDIENTS.filter(([slug]) => !ONLY.length || ONLY.includes(slug));
  for (const [slug, subject] of jobs) {
    try { await gen(slug, subject); }
    catch (e) { console.error("✗", slug, e.message); }
  }
  console.log(`\nDone → assets/img/ingredients/  (${jobs.length} requested). Now run: node build.js`);
})().catch(e => { console.error(e); process.exit(1); });
