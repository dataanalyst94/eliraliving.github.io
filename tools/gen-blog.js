#!/usr/bin/env node
/* =========================================================================
   ELIRA LIVING — SEO blog content engine (Phase 1).

   Generates full, on-brand, SEO-optimised blog posts with the Claude API and
   writes them as JSON into assets/data/blog/, where build.js renders them into
   trilingual /en /de /nl pages with Article + FAQPage + Breadcrumb schema and
   internal links to the relevant product pages.

   It writes EN first (structured JSON), then localises that exact structure
   into native, market-tuned DE and NL — so product links and layout line up
   across all three languages.

   --------------------------------------------------------------------------
   SETUP (one time)
     npm install                       # installs @anthropic-ai/sdk
     set ANTHROPIC_API_KEY=sk-ant-...  # Windows (PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-...")

   USAGE
     # one post from a topic
     node tools/gen-blog.js "How to layer a vegan skincare routine" --category skincare --related purifying-toner,sensitive-moisturizing-cream

     # many posts from a seed file (see tools/blog-topics.example.json)
     node tools/gen-blog.js --batch tools/blog-topics.json

     # preview without writing a file
     node tools/gen-blog.js "Salicylic acid for oily skin" --dry

   OPTIONS
     --category   skincare | haircare              (default: skincare)
     --related    comma-separated product ids      (auto-suggested from category if omitted)
     --image      /assets/img/xyz.jpg              (default: a category image)
     --slug       custom-url-slug                  (default: derived from the English title)
     --langs      en,de,nl                         (default: en,de,nl)
     --model      claude-opus-4-8                  (env ELIRA_MODEL also works; Sonnet/Haiku are cheaper for bulk)
     --batch      path/to/topics.json              ([{topic,category?,related?,image?,slug?}, ...] or ["topic", ...])
     --dry        print the result, do not write a file
     --force      overwrite an existing post file with the same slug

   After generating, run:  node build.js
   ========================================================================= */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "assets", "data", "blog");
const CAT = require(path.join(ROOT, "assets", "data", "catalog.js"));
const CONTENT_EN = require(path.join(ROOT, "assets", "content", "en.js"));

/* ---- load the SDK (with a friendly message if it's missing) ------------ */
let Anthropic;
try {
  const mod = require("@anthropic-ai/sdk");
  Anthropic = mod.default || mod;
} catch (e) {
  console.error("\n✗ The Anthropic SDK is not installed.\n  Run:  npm install\n  (this installs @anthropic-ai/sdk from package.json)\n");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\n✗ ANTHROPIC_API_KEY is not set.\n  PowerShell:  $env:ANTHROPIC_API_KEY=\"sk-ant-...\"\n  cmd.exe:     set ANTHROPIC_API_KEY=sk-ant-...\n");
  process.exit(1);
}

const MODEL = process.env.ELIRA_MODEL || "claude-opus-4-8";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

/* ---- brand + product context fed to the model -------------------------- */
const LANG_NAME = { en: "English", de: "German (Germany)", nl: "Dutch (Netherlands)" };
const PRODUCTS = CAT.PRODUCTS.map(p => ({
  id: p.id,
  name: CONTENT_EN.products[p.id].name,
  category: p.category,
  desc: CONTENT_EN.products[p.id].desc
}));
const PRODUCT_IDS = new Set(PRODUCTS.map(p => p.id));
const CATEGORY_IMAGE = { skincare: "/assets/img/cream.jpg", haircare: "/assets/img/shampoo.jpg" };

function brandContext() {
  return [
    "BRAND: Elira Living — a Finnish small business selling vegan, ECOCERT COSMOS-certified natural skincare & haircare.",
    "Made in the EU; ships to Germany and the Netherlands. Every formula is 100% vegan and cruelty-free; several are fragrance-free.",
    "VOICE: warm, expert, calm, jargon-free. Practical and trustworthy (E-E-A-T). Never over-claim.",
    "",
    "PRODUCTS you may reference by exact id in `product` body blocks (use only when genuinely relevant):",
    ...PRODUCTS.map(p => `  - id="${p.id}" | ${p.name} (${p.category}) — ${p.desc}`)
  ].join("\n");
}

/* ---- structured-output schema for one post (one language) -------------- */
const blockVariants = [
  { type: "object", additionalProperties: false, required: ["type", "text"], properties: { type: { const: "p" }, text: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "text"], properties: { type: { const: "h2" }, text: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "text"], properties: { type: { const: "h3" }, text: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "text"], properties: { type: { const: "quote" }, text: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "items"], properties: { type: { const: "ul" }, items: { type: "array", items: { type: "string" } } } },
  { type: "object", additionalProperties: false, required: ["type", "items"], properties: { type: { const: "ol" }, items: { type: "array", items: { type: "string" } } } },
  { type: "object", additionalProperties: false, required: ["type", "id"], properties: { type: { const: "product" }, id: { type: "string" } } }
];
const POST_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "keywords", "excerpt", "readMins", "body", "faq"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    keywords: { type: "string" },
    excerpt: { type: "string" },
    readMins: { type: "integer" },
    body: { type: "array", items: { anyOf: blockVariants } },
    faq: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["q", "a"], properties: { q: { type: "string" }, a: { type: "string" } } }
    }
  }
};

/* ---- one constrained, streamed Claude call → parsed JSON --------------- */
async function generateJSON(system, userText) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: POST_SCHEMA } },
    system,
    messages: [{ role: "user", content: userText }]
  });
  const msg = await stream.finalMessage();
  const text = (msg.content.find(b => b.type === "text") || {}).text || "";
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Model did not return valid JSON: " + e.message + "\n--- raw ---\n" + text.slice(0, 600));
  }
}

/* ---- sanitise model output before we trust it -------------------------- */
function sanitise(post, relatedHint) {
  // Drop product blocks that reference an unknown id.
  post.body = (post.body || []).filter(b => b.type !== "product" || PRODUCT_IDS.has(b.id));
  post.readMins = Math.max(2, Math.min(20, parseInt(post.readMins, 10) || 5));
  post.faq = Array.isArray(post.faq) ? post.faq.slice(0, 6) : [];
  return post;
}

/* ---- generate EN, then localise into DE / NL --------------------------- */
async function generatePost(opts) {
  const category = opts.category === "haircare" ? "haircare" : "skincare";
  const related = (opts.related && opts.related.length ? opts.related : PRODUCTS.filter(p => p.category === category).map(p => p.id))
    .filter(id => PRODUCT_IDS.has(id));
  const langs = opts.langs && opts.langs.length ? opts.langs : ["en", "de", "nl"];

  const baseSystem = brandContext() + `

TASK: Write one genuinely useful, original SEO blog article for The Elira Journal.
- Audience: people researching natural / vegan ${category} (sensitive-skin focus). Most arrive from Google.
- Length: roughly 600–1100 words across clear sections.
- Structure: open with 1–2 short intro paragraphs (no h2 before them), then h2/h3 sections with concise paragraphs and the occasional bullet list (ul).
- Include 1–3 \`product\` blocks placed where a specific Elira Living product is the natural recommendation. Prefer these ids when relevant: ${related.join(", ")}. Use the exact id. Do NOT invent products or prices; never put a price in the text.
- "keywords": 6–12 comma-separated SEO keywords/phrases a real person would search.
- "description": a compelling <=155-character meta description.
- "excerpt": one or two sentences for the blog index card.
- "faq": 2–3 real questions + concise answers (these become FAQ schema).
- E-E-A-T: be accurate and helpful. No medical claims, no cures, no "treats" disease language. Skin/scalp advice only; suggest seeing a professional for persistent or severe issues.
- Output ONLY the JSON object matching the schema.`;

  console.log(`  • EN  …writing`);
  const en = sanitise(await generateJSON(baseSystem, `Topic / working title: "${opts.topic}"\nProduct category: ${category}`), related);

  const out = { en };
  for (const L of langs.filter(x => x !== "en")) {
    console.log(`  • ${L.toUpperCase()}  …localising`);
    const locSystem = brandContext() + `

TASK: Localise the following English blog post into natural, native, SEO-optimised ${LANG_NAME[L]}.
- This is NOT a literal translation: rewrite so it reads as if originally written for the ${LANG_NAME[L]} market, while keeping the same meaning, structure and length.
- Keep the body block ORDER and TYPES identical. Keep every \`product\` block's id EXACTLY as-is. Keep readMins the same.
- Translate all human-readable text: title, description (<=155 chars), keywords (localised search terms, not literal), excerpt, every paragraph/heading/list item, and the faq.
- Output ONLY the JSON object matching the schema.`;
    const loc = sanitise(await generateJSON(locSystem, "English post JSON to localise:\n" + JSON.stringify(en)), related);
    out[L] = loc;
  }

  const slug = opts.slug ? slugify(opts.slug) : slugify(en.title);
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug,
    category,
    image: opts.image || CATEGORY_IMAGE[category],
    date: today,
    related,
    i18n: out
  };
}

/* ---- helpers ----------------------------------------------------------- */
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function parseArgs(argv) {
  const o = { topic: "", category: "skincare", related: [], langs: [], dry: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") o.dry = true;
    else if (a === "--force") o.force = true;
    else if (a === "--category") o.category = argv[++i];
    else if (a === "--related") o.related = String(argv[++i] || "").split(",").map(s => s.trim()).filter(Boolean);
    else if (a === "--image") o.image = argv[++i];
    else if (a === "--slug") o.slug = argv[++i];
    else if (a === "--langs") o.langs = String(argv[++i] || "").split(",").map(s => s.trim()).filter(Boolean);
    else if (a === "--model") process.env.ELIRA_MODEL = argv[++i];
    else if (a === "--batch") o.batch = argv[++i];
    else if (!a.startsWith("--") && !o.topic) o.topic = a;
  }
  return o;
}

function writePost(post, force, dry) {
  const file = path.join(BLOG_DIR, post.slug + ".json");
  if (dry) {
    console.log("\n--- DRY RUN: " + post.slug + ".json ---");
    console.log(JSON.stringify(post, null, 2));
    return;
  }
  if (fs.existsSync(file) && !force) {
    console.log(`  ! ${post.slug}.json already exists — skipping (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(post, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote assets/data/blog/${post.slug}.json`);
}

/* ---- main -------------------------------------------------------------- */
(async () => {
  const args = parseArgs(process.argv.slice(2));

  let jobs = [];
  if (args.batch) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(args.batch), "utf8"));
    jobs = raw.map(item => typeof item === "string"
      ? { topic: item, category: args.category, related: args.related, langs: args.langs }
      : { category: args.category, related: args.related, langs: args.langs, ...item });
  } else if (args.topic) {
    jobs = [args];
  } else {
    console.error('Usage: node tools/gen-blog.js "Your topic" [--category skincare|haircare] [--related id1,id2] [--batch file.json] [--dry]');
    process.exit(1);
  }

  console.log(`\nElira blog engine · model=${MODEL} · ${jobs.length} post(s)\n`);
  let ok = 0;
  for (const job of jobs) {
    try {
      console.log(`▶ "${job.topic}"`);
      const post = await generatePost(job);
      writePost(post, args.force, args.dry);
      ok++;
    } catch (e) {
      console.error(`  ✗ failed: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${jobs.length} generated.${args.dry ? "" : "  Now run:  node build.js"}\n`);
})();
