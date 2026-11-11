#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = path.join(ROOT, "assets", "data", "blog");
const LEDGER_FILE = path.join(ROOT, "assets", "data", "seo-topic-ledger.json");
const CAT = require(path.join(ROOT, "assets", "data", "catalog.js"));
const CONTENT = {
  en: require(path.join(ROOT, "assets", "content", "en.js")),
  de: require(path.join(ROOT, "assets", "content", "de.js")),
  nl: require(path.join(ROOT, "assets", "content", "nl.js")),
  fi: require(path.join(ROOT, "assets", "content", "fi.js")),
};

const LANGS = ["en", "de", "nl", "fi"];
const LANGUAGE_NAMES = {
  en: "English for an EU audience",
  de: "native German for Germany",
  nl: "native Dutch for the Netherlands",
  fi: "native Finnish for Finland",
};
const MODEL = process.env.SEO_MODEL || "openai/gpt-5.1";
const SITE_URL = process.env.GSC_SITE_URL || "sc-domain:eliraliving.com";
const PRODUCT_IDS = new Set(CAT.PRODUCTS.map(product => product.id));
const BRAND_QUERY = /\b(elira|elvira|elira living)\b/i;
const EXCLUDED_QUERY = /\b(login|tracking|support|contact|privacy|terms|invoice|refund)\b/i;

function parseArgs(argv) {
  const out = { fixture: "", analyzeOnly: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fixture") out.fixture = argv[++i] || "";
    else if (argv[i] === "--analyze-only") out.analyzeOnly = true;
  }
  return out;
}

function isoDate(date) { return date.toISOString().slice(0, 10); }
function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}
function slugify(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72);
}
function cleanTitle(value) {
  return String(value || "").replace(/(?:\s*\|\s*Elira Living)+\s*$/i, "").trim();
}
function readJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function blogInventory() {
  return fs.readdirSync(BLOG_DIR).filter(file => file.endsWith(".json")).map(file => {
    const post = readJSON(path.join(BLOG_DIR, file), {});
    return {
      slug: post.slug,
      category: post.category,
      related: post.related || [],
      titles: Object.fromEntries(Object.entries(post.i18n || {}).map(([lang, copy]) => [lang, cleanTitle(copy.title)])),
      keywords: Object.fromEntries(Object.entries(post.i18n || {}).map(([lang, copy]) => [lang, copy.keywords || ""])),
    };
  });
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function parseServiceAccount(raw) {
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON is not configured.");
  try { return JSON.parse(raw); }
  catch {
    try { return JSON.parse(Buffer.from(raw, "base64").toString("utf8")); }
    catch { throw new Error("GSC_SERVICE_ACCOUNT_JSON is neither valid JSON nor base64-encoded JSON."); }
  }
}
async function googleAccessToken() {
  const account = parseServiceAccount(process.env.GSC_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly",
    aud: account.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), account.private_key);
  const assertion = `${unsigned}.${base64url(signature)}`;
  const response = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status}): ${await response.text()}`);
  return (await response.json()).access_token;
}
async function querySeoDataGateway(source, payload = {}) {
  const url = process.env.SEO_DATA_URL;
  const gatewayToken = process.env.SEO_DATA_TOKEN;
  if (!url) return null;
  if (!gatewayToken) throw new Error("SEO_DATA_TOKEN is required when SEO_DATA_URL is configured.");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Elira-SEO-Token": gatewayToken,
    },
    body: JSON.stringify({ source, ...payload }),
  });
  if (!response.ok) throw new Error(`SEO data gateway failed (${response.status}): ${await response.text()}`);
  return response.json();
}
async function querySearchConsole(token, startDate, endDate) {
  const gateway = await querySeoDataGateway("gsc", { startDate, endDate });
  if (gateway) return gateway.rows || [];
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query", "page", "country"],
      type: "web",
      dataState: "final",
      rowLimit: 25000,
      startRow: 0,
    }),
  });
  if (!response.ok) throw new Error(`Search Console query failed (${response.status}): ${await response.text()}`);
  return (await response.json()).rows || [];
}

async function queryGa4(token) {
  const gateway = await querySeoDataGateway("ga4");
  if (gateway) {
    return (gateway.rows || []).map(row => ({
      landingPage: row.dimensionValues?.[0]?.value || "",
      sessions: Number(row.metricValues?.[0]?.value || 0),
      engagedSessions: Number(row.metricValues?.[1]?.value || 0),
      keyEvents: Number(row.metricValues?.[2]?.value || 0),
    })).filter(row => row.landingPage);
  }
  if (!process.env.GA4_PROPERTY_ID) return [];
  const property = String(process.env.GA4_PROPERTY_ID).replace(/^properties\//, "");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: "30daysAgo", endDate: "3daysAgo" }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }],
      limit: "500",
    }),
  });
  if (!response.ok) throw new Error(`GA4 query failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  return (payload.rows || []).map(row => ({
    landingPage: row.dimensionValues?.[0]?.value || "",
    sessions: Number(row.metricValues?.[0]?.value || 0),
    engagedSessions: Number(row.metricValues?.[1]?.value || 0),
    keyEvents: Number(row.metricValues?.[2]?.value || 0),
  })).filter(row => row.landingPage);
}

function serperLocale(countries) {
  const country = countries?.[0] || "";
  if (country === "deu") return { gl: "de", hl: "de" };
  if (country === "nld") return { gl: "nl", hl: "nl" };
  if (country === "fin") return { gl: "fi", hl: "fi" };
  if (country === "gbr" || country === "irl") return { gl: country === "irl" ? "ie" : "uk", hl: "en" };
  return { gl: "de", hl: "en" };
}
async function researchPotentialQueries(opportunities) {
  if (!process.env.SERPER_API_KEY) return [];
  const results = [];
  for (const opportunity of opportunities.slice(0, 6)) {
    const locale = serperLocale(opportunity.countries);
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: opportunity.query, gl: locale.gl, hl: locale.hl, num: 10 }),
    });
    if (!response.ok) throw new Error(`SERP research failed (${response.status}): ${await response.text()}`);
    const payload = await response.json();
    results.push({
      seedQuery: opportunity.query,
      peopleAlsoAsk: (payload.peopleAlsoAsk || []).map(item => item.question).filter(Boolean).slice(0, 8),
      relatedSearches: (payload.relatedSearches || []).map(item => item.query).filter(Boolean).slice(0, 8),
      competingResults: (payload.organic || []).slice(0, 8).map(item => ({ title: item.title, link: item.link, snippet: item.snippet })),
    });
  }
  return results;
}

function ctrBenchmark(position) {
  if (position <= 1.5) return 0.28;
  if (position <= 3) return 0.16;
  if (position <= 5) return 0.09;
  if (position <= 10) return 0.045;
  if (position <= 20) return 0.02;
  return 0.008;
}
function aggregateQueries(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const [query = "", page = "", country = ""] = row.keys || [];
    const key = query.trim().toLowerCase();
    if (!key || key.length < 4) continue;
    const item = map.get(key) || { query: key, clicks: 0, impressions: 0, weightedPosition: 0, pages: new Set(), countries: new Set() };
    item.clicks += Number(row.clicks || 0);
    item.impressions += Number(row.impressions || 0);
    item.weightedPosition += Number(row.position || 0) * Number(row.impressions || 0);
    if (page) item.pages.add(page);
    if (country) item.countries.add(country);
    map.set(key, item);
  }
  return [...map.values()].map(item => ({
    query: item.query,
    clicks: item.clicks,
    impressions: item.impressions,
    ctr: item.impressions ? item.clicks / item.impressions : 0,
    position: item.impressions ? item.weightedPosition / item.impressions : 100,
    pages: [...item.pages].slice(0, 4),
    countries: [...item.countries].slice(0, 8),
  }));
}
function rankOpportunities(currentRows, previousRows) {
  const previous = new Map(aggregateQueries(previousRows).map(row => [row.query, row]));
  return aggregateQueries(currentRows).filter(row => {
    return row.impressions >= 5 && !BRAND_QUERY.test(row.query) && !EXCLUDED_QUERY.test(row.query);
  }).map(row => {
    const old = previous.get(row.query);
    const growth = old && old.impressions ? (row.impressions - old.impressions) / old.impressions : (row.impressions >= 10 ? 0.5 : 0);
    const ctrGap = Math.max(0.005, ctrBenchmark(row.position) - row.ctr);
    const rankWeight = row.position >= 3 && row.position <= 20 ? 1.5 : row.position <= 40 ? 1 : 0.55;
    const score = row.impressions * ctrGap * rankWeight * (1 + Math.max(-0.4, Math.min(1.5, growth)));
    return { ...row, growth, score };
  }).sort((a, b) => b.score - a.score).slice(0, 100);
}

async function openRouterJSON(system, user, maxTokens = 9000) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured.");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://www.eliraliving.com",
      "X-Title": "Elira Living weekly SEO article",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  const raw = payload.choices?.[0]?.message?.content || "";
  try { return JSON.parse(raw); }
  catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error("The writing model did not return valid JSON.");
  }
}

function productContext() {
  return CAT.PRODUCTS.map(product => ({
    id: product.id,
    category: product.category,
    name: CONTENT.en.products[product.id].name,
    description: CONTENT.en.products[product.id].desc,
    image: product.image,
  }));
}
function topicSystem() {
  return `You are the senior SEO editor for Elira Living, a Finnish EU skincare business. Select one genuinely useful new weekly article from first-party Google Search Console evidence.

Rules:
- Choose a distinct content gap, not a rewrite of an existing article and not a second page targeting the same intent.
- Prefer non-brand queries with meaningful impressions, weak CTR, positions 4-30, growth, clear skincare or haircare intent, and a natural connection to one Elira product.
- A query already served by a strong existing article may inspire an adjacent question, but must not cause keyword cannibalization.
- Prioritize a reader's real problem. SEO is evidence, not the purpose of the article.
- Avoid medical/YMYL topics, diagnoses, treatment promises, invented studies, and unsupported efficacy claims.
- Return JSON only with: primaryQuery, sourceLanguage, englishWorkingTitle, searchIntent, contentAngle, category, relatedProductIds, supportingQueries, localizedQueries, rationale.
- category is skincare or haircare. relatedProductIds contains 1-2 exact product ids.
- localizedQueries has en, de, nl and fi strings that sound natural, not literal translations.`;
}
async function chooseTopic(opportunities, inventory, ledger, ga4LandingPages, serpResearch) {
  const prompt = {
    searchConsoleOpportunities: opportunities,
    ga4LandingPageEngagementAndKeyEvents: ga4LandingPages,
    externalSearchQuestionsAndCompetingResults: serpResearch,
    existingArticles: inventory,
    previousAutomatedChoices: ledger,
    products: productContext(),
  };
  const brief = await openRouterJSON(topicSystem(), JSON.stringify(prompt), 5000);
  if (!brief.primaryQuery || !brief.englishWorkingTitle || !["skincare", "haircare"].includes(brief.category)) {
    throw new Error("Topic strategist returned an incomplete brief.");
  }
  brief.relatedProductIds = (brief.relatedProductIds || []).filter(id => PRODUCT_IDS.has(id)).slice(0, 2);
  if (!brief.relatedProductIds.length) throw new Error("Topic strategist did not choose a valid related product.");
  return brief;
}

function articleSystem() {
  return `You are Elira Living's senior skincare editor. Write people-first, accurate, calm and practical editorial content for EU shoppers.

Return one JSON object with exactly these fields: title, description, keywords, excerpt, readMins, body, faq.
body is an array of blocks. Allowed blocks are {"type":"p|h2|h3|quote","text":"..."}, {"type":"ul|ol","items":["..."]}, and {"type":"product","id":"exact-product-id"}.

Editorial requirements:
- 900-1400 useful words. Open with 1-2 short paragraphs, then descriptive H2 sections.
- Answer the search intent early. Include practical choices, cautions and a concise conclusion.
- Use the target query naturally; never stuff keywords.
- Include exactly one relevant product block in context. Never invent products, prices, certifications, percentages or results.
- Use only facts present in the supplied product context or stable general cosmetic knowledge.
- Never invent research, quotes, statistics, personal testing or customer experiences.
- Cosmetic guidance only: no diagnosing, curing or treating conditions; advise professional help for persistent or severe symptoms when relevant.
- title has no brand suffix. description is compelling and roughly 120-160 characters. faq has 3-4 useful questions.
- Output JSON only.`;
}
async function writeEnglish(brief) {
  return openRouterJSON(articleSystem(), JSON.stringify({
    assignment: brief,
    targetLanguage: LANGUAGE_NAMES.en,
    products: productContext().filter(product => brief.relatedProductIds.includes(product.id)),
  }), 12000);
}
async function localizeArticle(lang, english, brief) {
  const system = `${articleSystem()}\n\nLocalize the supplied English article into ${LANGUAGE_NAMES[lang]}. This must read as native editorial writing, not a literal translation. Preserve the body block order and every product id. Use this market's target query naturally: ${brief.localizedQueries?.[lang] || "derive a natural local equivalent"}.`;
  return openRouterJSON(system, JSON.stringify({ englishArticle: english, assignment: brief }), 12000);
}

function wordsInArticle(article) {
  const body = (article.body || []).flatMap(block => block.items || block.text || []).join(" ");
  return body.trim().split(/\s+/).filter(Boolean).length;
}
function titleTokens(value) {
  return new Set(cleanTitle(value).toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/g, " ").split(/\s+/).filter(word => word.length > 2));
}
function titleSimilarity(a, b) {
  const aa = titleTokens(a), bb = titleTokens(b);
  const intersection = [...aa].filter(token => bb.has(token)).length;
  const union = new Set([...aa, ...bb]).size;
  return union ? intersection / union : 0;
}
function validateArticle(lang, article, inventory, relatedIds) {
  const required = ["title", "description", "keywords", "excerpt", "body", "faq"];
  for (const key of required) if (!article?.[key]) throw new Error(`${lang}: missing ${key}.`);
  article.title = cleanTitle(article.title);
  if (!Array.isArray(article.body) || article.body.length < 12) throw new Error(`${lang}: article body is too short.`);
  if (!Array.isArray(article.faq) || article.faq.length < 3) throw new Error(`${lang}: at least three FAQs are required.`);
  const wordCount = wordsInArticle(article);
  if (wordCount < (lang === "en" ? 750 : 600)) throw new Error(`${lang}: only ${wordCount} words.`);
  if (article.description.length < 90 || article.description.length > 175) throw new Error(`${lang}: meta description length is ${article.description.length}.`);
  const productBlocks = article.body.filter(block => block.type === "product");
  if (productBlocks.length !== 1 || !relatedIds.includes(productBlocks[0].id)) throw new Error(`${lang}: exactly one approved product block is required.`);
  const allowedTypes = new Set(["p", "h2", "h3", "quote", "ul", "ol", "product"]);
  if (article.body.some(block => !allowedTypes.has(block.type))) throw new Error(`${lang}: unsupported body block.`);
  const text = JSON.stringify(article).toLowerCase();
  const prohibited = ["clinically proven", "guaranteed results", "cures acne", "treats eczema", "heilt akne", "behandelt ekzem", "geneest acne", "parantaa aknen"];
  if (prohibited.some(term => text.includes(term))) throw new Error(`${lang}: prohibited medical or unsupported claim detected.`);
  if (lang === "en") {
    const closest = inventory.map(post => ({ slug: post.slug, score: titleSimilarity(article.title, post.titles.en || "") })).sort((a, b) => b.score - a.score)[0];
    if (closest && closest.score >= 0.72) throw new Error(`New title is too similar to existing article ${closest.slug} (${closest.score.toFixed(2)}).`);
  }
  article.readMins = Math.max(4, Math.min(12, Math.round(wordCount / 210)));
  article.faq = article.faq.slice(0, 4);
  return article;
}

function writeOutputs(post, brief, opportunities, dateRange) {
  const articleFile = path.join(BLOG_DIR, `${post.slug}.json`);
  if (fs.existsSync(articleFile)) throw new Error(`Article already exists: ${post.slug}`);
  fs.writeFileSync(articleFile, JSON.stringify(post, null, 2) + "\n", "utf8");

  const ledger = readJSON(LEDGER_FILE, []);
  ledger.push({
    date: post.date,
    slug: post.slug,
    primaryQuery: brief.primaryQuery,
    supportingQueries: brief.supportingQueries || [],
    rationale: brief.rationale,
    searchConsoleRange: dateRange,
    evidence: opportunities.slice(0, 10).map(({ query, clicks, impressions, ctr, position, growth }) => ({ query, clicks, impressions, ctr, position, growth })),
  });
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2) + "\n", "utf8");

  const summaryPath = process.env.SEO_SUMMARY_PATH || path.join(ROOT, "weekly-seo-summary.md");
  const summary = `# Weekly SEO article\n\n- **Title:** ${post.i18n.en.title}\n- **Primary query:** ${brief.primaryQuery}\n- **Intent:** ${brief.searchIntent}\n- **Why this topic:** ${brief.rationale}\n- **Products:** ${post.related.join(", ")}\n- **Languages:** ${Object.keys(post.i18n).join(", ")}\n- **Search Console window:** ${dateRange.current.startDate} to ${dateRange.current.endDate}\n\n## Top evidence\n\n${opportunities.slice(0, 8).map(row => `- ${row.query}: ${row.impressions} impressions, ${(row.ctr * 100).toFixed(1)}% CTR, position ${row.position.toFixed(1)}`).join("\n")}\n`;
  fs.writeFileSync(summaryPath, summary, "utf8");

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${post.slug}\ntitle=${post.i18n.en.title.replace(/\r?\n/g, " ")}\nquery=${brief.primaryQuery.replace(/\r?\n/g, " ")}\n`);
  }
  console.log(JSON.stringify({ articleFile, ledgerFile: LEDGER_FILE, summaryPath, slug: post.slug, title: post.i18n.en.title }, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let currentRows, previousRows, dateRange, ga4LandingPages = [];
  if (args.fixture) {
    const fixture = readJSON(path.resolve(args.fixture), {});
    currentRows = fixture.current || [];
    previousRows = fixture.previous || [];
    dateRange = fixture.dateRange || { current: { startDate: "fixture", endDate: "fixture" }, previous: { startDate: "fixture", endDate: "fixture" } };
  } else {
    const currentEnd = daysAgo(3);
    const currentStart = daysAgo(30);
    const previousEnd = daysAgo(31);
    const previousStart = daysAgo(58);
    dateRange = {
      current: { startDate: isoDate(currentStart), endDate: isoDate(currentEnd) },
      previous: { startDate: isoDate(previousStart), endDate: isoDate(previousEnd) },
    };
    const token = process.env.SEO_DATA_URL ? "" : await googleAccessToken();
    [currentRows, previousRows, ga4LandingPages] = await Promise.all([
      querySearchConsole(token, dateRange.current.startDate, dateRange.current.endDate),
      querySearchConsole(token, dateRange.previous.startDate, dateRange.previous.endDate),
      queryGa4(token),
    ]);
  }

  const opportunities = rankOpportunities(currentRows, previousRows);
  if (!opportunities.length) throw new Error("No non-brand Search Console opportunities met the minimum threshold.");
  if (args.analyzeOnly) {
    console.log(JSON.stringify(opportunities.slice(0, 25), null, 2));
    return;
  }

  const inventory = blogInventory();
  const ledger = readJSON(LEDGER_FILE, []);
  const serpResearch = await researchPotentialQueries(opportunities);
  const brief = await chooseTopic(opportunities, inventory, ledger, ga4LandingPages, serpResearch);
  const i18n = {};
  i18n.en = validateArticle("en", await writeEnglish(brief), inventory, brief.relatedProductIds);
  for (const lang of LANGS.filter(lang => lang !== "en")) {
    i18n[lang] = validateArticle(lang, await localizeArticle(lang, i18n.en, brief), inventory, brief.relatedProductIds);
  }
  const slug = slugify(i18n.en.title);
  const product = CAT.PRODUCTS.find(item => item.id === brief.relatedProductIds[0]);
  const post = {
    slug,
    category: brief.category,
    image: product?.image || (brief.category === "haircare" ? "/assets/img/shampoo.jpg" : "/assets/img/cream.jpg"),
    date: isoDate(new Date()),
    related: brief.relatedProductIds,
    seoEvidence: { primaryQuery: brief.primaryQuery, sourceLanguage: brief.sourceLanguage, rationale: brief.rationale },
    i18n,
  };
  writeOutputs(post, brief, opportunities, dateRange);
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
