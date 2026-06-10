#!/usr/bin/env node
/* =========================================================================
   ELIRA LIVING — Journalist-query pitch drafter (Phase 4).

   Paste a reporter/blogger source request (Qwoted, Featured, SourceBottle,
   #journorequest, etc.) and get a concise, quotable, on-brand response plus a
   one-line founder bio and a ready-to-send email — in EN, DE or NL.

   The only input it needs is your ANTHROPIC_API_KEY.

   USAGE
     node tools/gen-pitch.js "Looking for skincare experts on fragrance-free for sensitive skin"
     node tools/gen-pitch.js --file query.txt --lang de
     node tools/gen-pitch.js "..." --save        # also writes marketing/pitches/<ts>.md

   OPTIONS
     --lang   en | de | nl        (default en)
     --file   path to a .txt with the query
     --model  claude-opus-4-8     (or ELIRA_MODEL env; Opus recommended for PR quality)
     --save   write the result to marketing/pitches/
   ========================================================================= */

"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

let Anthropic;
try { const mod = require("@anthropic-ai/sdk"); Anthropic = mod.default || mod; }
catch (e) { console.error("\n✗ Anthropic SDK missing. Run:  npm install\n"); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("\n✗ Set ANTHROPIC_API_KEY first.\n"); process.exit(1); }

const MODEL = () => process.env.ELIRA_MODEL || "claude-opus-4-8";
const supportsThinking = m => /opus-4-[678]/.test(m) || /sonnet-4-6/.test(m);
const client = new Anthropic();
const LANG_NAME = { en: "English", de: "German (Germany)", nl: "Dutch (Netherlands)" };

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["relevant", "headline", "quote", "response", "bio", "subject", "email"],
  properties: {
    relevant: { type: "boolean" },          // is Elira Living a credible source for this query?
    headline: { type: "string" },           // the angle in one line
    quote: { type: "string" },              // one punchy pull-quote (<=40 words)
    response: { type: "string" },           // full answer, ~120-150 words
    bio: { type: "string" },                // one-line expert bio
    subject: { type: "string" },            // email subject
    email: { type: "string" }               // ready-to-send email
  }
};

const SYSTEM = `You are the founder of Elira Living writing a response to a journalist/blogger source request to earn an editorial quote and backlink.

BRAND FACTS (true; use only what's relevant):
- Elira Living: vegan, ECOCERT COSMOS-certified natural skincare & haircare for sensitive skin. Made in the EU; ships to Germany & the Netherlands. 100% vegan, cruelty-free; fragrance-free options. Founder: Zeerak Ata (solo founder / Finnish toiminimi). Site: https://www.eliraliving.com · Contact email: support@eliraliving.com (use this exact address in the email signature — do not invent another).
- Products: Sensitive Moisturizing Cream, Radiant Glow Facial Cleanser, Purifying Toner, Sensitive Scalp Shampoo.

RULES:
- Answer the EXACT question in the first sentence. No preamble, no fluff.
- Be specific, quotable and opinionated. ~120-150 words max for the response.
- Establish credibility ("As the founder of an ECOCERT COSMOS-certified vegan brand…") without selling.
- Mention a product ONLY if the query asks for examples/recommendations.
- NEVER make medical claims (no "treats/cures/heals disease"). Skincare & ingredient education only.
- If Elira Living is NOT a credible fit for the query, set "relevant": false and say so briefly in "headline".
- Write everything in the target language. Output ONLY the JSON object matching the schema.`;

async function draft(query, lang) {
  const model = MODEL();
  const output_config = { format: { type: "json_schema", schema: SCHEMA } };
  const params = {
    model, max_tokens: 4000, output_config, system: SYSTEM,
    messages: [{ role: "user", content: `Target language: ${LANG_NAME[lang]}\n\nReporter request:\n"""\n${query}\n"""` }]
  };
  if (supportsThinking(model)) { params.thinking = { type: "adaptive" }; output_config.effort = "high"; }
  const stream = client.messages.stream(params);
  const msg = await stream.finalMessage();
  const text = (msg.content.find(b => b.type === "text") || {}).text || "";
  return JSON.parse(text);
}

function parseArgs(argv) {
  const o = { lang: "en", save: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--save") o.save = true;
    else if (a === "--lang") o.lang = argv[++i];
    else if (a === "--file") o.file = argv[++i];
    else if (a === "--model") process.env.ELIRA_MODEL = argv[++i];
    else if (!a.startsWith("--") && !o.query) o.query = a;
  }
  return o;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const query = args.file ? fs.readFileSync(path.resolve(args.file), "utf8").trim() : args.query;
  if (!query) { console.error('Usage: node tools/gen-pitch.js "reporter request" [--lang en|de|nl] [--file q.txt] [--save]'); process.exit(1); }
  if (!LANG_NAME[args.lang]) { console.error("--lang must be en, de or nl"); process.exit(1); }

  console.log(`\nDrafting pitch · model=${MODEL()} · lang=${args.lang}\n`);
  let r;
  try { r = await draft(query, args.lang); }
  catch (e) { console.error("✗ " + e.message); process.exit(1); }

  if (!r.relevant) {
    console.log("⚠ Not a strong fit for Elira Living: " + r.headline + "\n(Consider skipping this one.)\n");
    return;
  }

  const block = `ANGLE: ${r.headline}

PULL-QUOTE:
"${r.quote}"

RESPONSE (~${r.response.split(/\s+/).length} words):
${r.response}

BIO:
${r.bio}

--- READY-TO-SEND EMAIL ---
Subject: ${r.subject}

${r.email}
`;
  console.log(block);

  if (args.save) {
    const dir = path.join(ROOT, "marketing", "pitches");
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, new Date().toISOString().replace(/[:.]/g, "-") + "-" + args.lang + ".md");
    fs.writeFileSync(f, "# Pitch draft\n\n**Query:**\n" + query + "\n\n" + block, "utf8");
    console.log("✓ saved " + path.relative(ROOT, f));
  }
})();
