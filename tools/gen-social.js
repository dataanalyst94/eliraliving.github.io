#!/usr/bin/env node
/* =========================================================================
   ELIRA LIVING — Social caption engine (Phase 5, self-contained slice).

   Turns a blog post (or any topic) into ready-to-post, trilingual social
   captions for Instagram, TikTok, Pinterest, Facebook and LinkedIn — hook,
   caption, hashtags and CTA per platform, with the post link baked in.

   Pairs with tools/gen-blog.js: write a post, then generate the social pack
   that drives traffic back to it. The only input it needs from you is your
   ANTHROPIC_API_KEY (same as the blog engine).

   --------------------------------------------------------------------------
   SETUP
     npm install
     $env:ANTHROPIC_API_KEY = "sk-ant-..."   # PowerShell

   USAGE
     # from an existing blog post (reads assets/data/blog/<slug>.json)
     node tools/gen-social.js --post gentle-routine-for-sensitive-skin

     # from a free topic (no post link)
     node tools/gen-social.js "5 signs your skin barrier is damaged" --category skincare

     # every existing post at once
     node tools/gen-social.js --all

   OPTIONS
     --post <slug>   generate for one post file
     --all           generate for every post in assets/data/blog/
     --category      skincare | haircare (free-topic mode; default skincare)
     --langs         en,de,nl (default all three)
     --model         claude-opus-4-8 (or ELIRA_MODEL env; Sonnet/Haiku cheaper)
     --dry           print, don't write
     --force         overwrite an existing pack

   Output → marketing/social/<slug-or-topic>.json
   ========================================================================= */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "marketing", "social");
const BLOG_DIR = path.join(ROOT, "assets", "data", "blog");
const CAT = require(path.join(ROOT, "assets", "data", "catalog.js"));
const CONTENT_EN = require(path.join(ROOT, "assets", "content", "en.js"));
const BASE = CAT.CONFIG.baseUrl;

let Anthropic;
try { const mod = require("@anthropic-ai/sdk"); Anthropic = mod.default || mod; }
catch (e) { console.error("\n✗ Anthropic SDK missing. Run:  npm install\n"); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("\n✗ Set ANTHROPIC_API_KEY first.\n"); process.exit(1); }

const MODEL = () => process.env.ELIRA_MODEL || "claude-opus-4-8"; // resolved at call time (after --model is parsed)
const client = new Anthropic();
const LANG_NAME = { en: "English", de: "German (Germany)", nl: "Dutch (Netherlands)" };
const PLATFORMS = ["instagram", "tiktok", "pinterest", "facebook", "linkedin"];

const capObj = {
  type: "object", additionalProperties: false,
  required: ["hook", "caption", "hashtags", "cta"],
  properties: {
    hook: { type: "string" },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    cta: { type: "string" }
  }
};
const PACK_SCHEMA = {
  type: "object", additionalProperties: false,
  required: PLATFORMS,
  properties: PLATFORMS.reduce((o, p) => (o[p] = capObj, o), {})
};

function brandLine() {
  return "Elira Living: Finnish small business selling vegan, ECOCERT COSMOS-certified natural skincare & haircare. Made in the EU; ships to Germany & the Netherlands. Warm, expert, calm, never hype. No medical claims.";
}

const supportsThinking = m => /opus-4-[678]/.test(m) || /sonnet-4-6/.test(m);
async function genPack(system, userText) {
  const model = MODEL();
  const output_config = { format: { type: "json_schema", schema: PACK_SCHEMA } };
  const params = { model, max_tokens: 8000, output_config, system, messages: [{ role: "user", content: userText }] };
  if (supportsThinking(model)) { params.thinking = { type: "adaptive" }; output_config.effort = "high"; }
  const stream = client.messages.stream(params);
  const msg = await stream.finalMessage();
  const text = (msg.content.find(b => b.type === "text") || {}).text || "";
  try { return JSON.parse(text); }
  catch (e) { throw new Error("Bad JSON from model: " + e.message + "\n" + text.slice(0, 400)); }
}

function postBrief(L, post) {
  const c = post.i18n[L] || post.i18n.en;
  const points = (c.body || []).filter(b => b.type === "h2" || b.type === "h3").map(b => b.text).slice(0, 6);
  const url = `${BASE}/${L}/blog/${post.slug}.html`;
  return { title: c.title, excerpt: c.excerpt, points, url };
}

async function generateFor(job) {
  const langs = job.langs && job.langs.length ? job.langs : ["en", "de", "nl"];
  const out = { slug: job.slug, source: job.post ? "post" : "topic", url: {}, i18n: {} };

  for (const L of langs) {
    let brief, url;
    if (job.post) { const b = postBrief(L, job.post); brief = `Blog article to promote (link to it in the CTA):\nTitle: ${b.title}\nSummary: ${b.excerpt}\nKey points: ${b.points.join(" / ")}\nLink: ${b.url}`; url = b.url; }
    else { brief = `Topic: "${job.topic}" (category: ${job.category}). No article link — drive to the shop: ${BASE}/${L}/shop.html`; url = `${BASE}/${L}/shop.html`; }
    out.url[L] = url;

    const system = brandLine() + `

TASK: Write social media captions in ${LANG_NAME[L]} for these platforms: ${PLATFORMS.join(", ")}.
For EACH platform return: hook (scroll-stopping first line), caption (platform-appropriate length & tone), hashtags (array; 8-12 for instagram/tiktok/pinterest, 3-5 for facebook/linkedin, localised & relevant), cta (one line, include the link).
- Instagram: warm, value-first, line breaks ok. TikTok: punchy, trend-aware, spoken feel. Pinterest: keyword-rich, search-friendly. Facebook: friendly, slightly longer. LinkedIn: professional brand/sustainability angle.
- Native ${LANG_NAME[L]} (not a literal translation). No medical claims. Output ONLY the JSON matching the schema.`;

    console.log(`  • ${L.toUpperCase()}  …captions`);
    out.i18n[L] = await genPack(system, brief);
  }
  return out;
}

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function loadPost(slug) {
  const f = path.join(BLOG_DIR, slug + ".json");
  if (!fs.existsSync(f)) throw new Error("No post file: " + slug + ".json");
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

function parseArgs(argv) {
  const o = { category: "skincare", langs: [], dry: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") o.dry = true;
    else if (a === "--force") o.force = true;
    else if (a === "--all") o.all = true;
    else if (a === "--post") o.postSlug = argv[++i];
    else if (a === "--category") o.category = argv[++i];
    else if (a === "--langs") o.langs = String(argv[++i] || "").split(",").map(s => s.trim()).filter(Boolean);
    else if (a === "--model") process.env.ELIRA_MODEL = argv[++i];
    else if (!a.startsWith("--") && !o.topic) o.topic = a;
  }
  return o;
}

function write(pack, force, dry) {
  if (dry) { console.log("\n--- DRY: " + pack.slug + " ---\n" + JSON.stringify(pack, null, 2)); return; }
  const f = path.join(OUT_DIR, pack.slug + ".json");
  if (fs.existsSync(f) && !force) { console.log(`  ! ${pack.slug}.json exists — skipping (--force to overwrite)`); return; }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(pack, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote marketing/social/${pack.slug}.json`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let jobs = [];
  if (args.all) {
    if (!fs.existsSync(BLOG_DIR)) { console.error("No blog posts found."); process.exit(1); }
    jobs = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".json"))
      .map(f => { const p = loadPost(f.replace(/\.json$/, "")); return { post: p, slug: p.slug, langs: args.langs }; });
  } else if (args.postSlug) {
    const p = loadPost(args.postSlug); jobs = [{ post: p, slug: p.slug, langs: args.langs }];
  } else if (args.topic) {
    jobs = [{ topic: args.topic, category: args.category, slug: slugify(args.topic), langs: args.langs }];
  } else {
    console.error('Usage: node tools/gen-social.js --post <slug> | --all | "Topic" [--category skincare|haircare] [--dry]');
    process.exit(1);
  }

  console.log(`\nElira social engine · model=${MODEL()} · ${jobs.length} pack(s)\n`);
  let ok = 0;
  for (const job of jobs) {
    try { console.log(`▶ ${job.slug}`); write(await generateFor(job), args.force, args.dry); ok++; }
    catch (e) { console.error(`  ✗ ${job.slug}: ${e.message}`); }
  }
  console.log(`\nDone: ${ok}/${jobs.length} caption packs.\n`);
})();
