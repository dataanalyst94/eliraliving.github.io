# Elira Living — Full Project Context & Session Handoff

> Paste this into a new chat to bring it fully up to speed. Last updated: 2026-06 session.
> **Secrets are NOT in this file** — only references to where they live. Never paste real
> API keys/tokens into chat; they live in Cloudflare/wrangler secrets, n8n, or gitignored
> local files.

---

## 1. What Elira Living is
- **Brand:** Elira Living — vegan, ECOCERT **COSMOS Natural**-certified natural skincare & haircare. Made in the EU. Fragrance-conscious, sensitive-skin focus.
- **Site:** https://www.eliraliving.com — **trilingual EN / DE / NL**, static site.
- **Markets:** ships to **Germany & Netherlands**. Also sells on **eBay.de**.
- **Owner:** Zeerak Ata — **solo founder** (toiminimi / sole trader, Finland). Business ID (Y-tunnus) 3526013-6. Email support@eliraliving.com.
- **Stage:** newly live, near-zero traffic, social engine built but mostly inactive, ~6 products.

### Products (catalog ids in `assets/data/catalog.js`)
- `sensitive-moisturizing-cream` (€19.90, 50ml)
- `radiant-glow-cleanser` (€25.99)
- `purifying-toner` (€24.00) — contains lavender water
- `sensitive-scalp-shampoo`
- `retinol-alternative-serum` (€29.99, 30ml) — **2% Bidens Pilosa + hyaluronic acid**; targets fine lines/texture/dark spots gently
- `peptide-anti-aging-serum` (€29.99, 30ml) — Hexapeptide-11 + Ginkgo + hyaluronic acid

---

## 2. Architecture & infrastructure

### Two-repo deploy (CRITICAL to understand)
- **`dataanalyst94/elira-living`** = `origin` remote = **DEV repo, now PRIVATE**. All work happens here. Has CI (`.github/workflows/build-site.yml`) that runs `node build.js` and commits built HTML.
- **`dataanalyst94/eliraliving.github.io`** = `elira` remote = **LIVE repo, PUBLIC**. GitHub Pages serves it at www.eliraliving.com. Must stay public (free Pages).
- CI **force-mirrors** dev's built HEAD to the live repo (gated on secret `PAGES_SYNC_TOKEN`). 
- **The freeze gotcha:** if the two histories diverge, a non-force push is rejected and the live site silently freezes. Fixed two ways: (1) CI now uses `git push --force` (force-mirror), (2) a **single-source guard** `if: github.repository == 'dataanalyst94/elira-living'` so the workflow only runs in the dev repo (the mirrored copy on the live repo is inert).
- **Verify deploys via the live repo RAW** (`raw.githubusercontent.com/dataanalyst94/eliraliving.github.io/main/...`), NOT www — www has a GitHub Pages CDN cache (max-age 600) + Pages redeploy lag of several minutes. To see changes on a phone: open `eliraliving.com/?fresh=1` or Incognito.
- **CRLF gotcha:** `.gitattributes` normalizes to LF. Commit **source only** (build.js, assets/data, css, js) — CI regenerates HTML. Local `node build.js` creates untracked HTML in `en/ de/ nl/blog/`; stash with `git stash push -u` before `git pull --rebase`.
- Build uses `ASSET_V = Date.now()` → every build cache-busts all asset URLs via `?v=`.

### Build system
- `node build.js` generates 138 localized pages from shared functions parameterized by language (`renderHome(L)`, `renderProduct(L,p)`, etc.) + shared `assets/css/{app,home}.css` and `assets/js/app.js`. A change in a build function or CSS/JS applies to EN/DE/NL automatically; only the text differs (translation tables in `assets/content/{en,de,nl}.js`).
- **Blog/Journal:** each `assets/data/blog/*.json` = one post → trilingual pages with BlogPosting + FAQPage schema, hreflang×4, breadcrumbs, sitemap. Currently 28 articles.

### Cloudflare Workers (account: support@eliraliving.com, deploy via `wrangler deploy`)
- `elira-ebay-deletion` (`ebay-deletion-worker/`) — eBay Marketplace Account Deletion compliance (SHA-256 challenge). URL `https://elira-ebay-deletion.elira-living.workers.dev/`. Secret: `EBAY_VERIFICATION_TOKEN`.
- `elira-ebay-orders` (`ebay-orders-worker/`) — cron every 6h: eBay.de orders → Notion Finance Ledger (deduped by Order ID). URL `https://elira-ebay-orders.elira-living.workers.dev`. Secrets: `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REFRESH_TOKEN` (now BROAD selling scope), `NOTION_TOKEN`. Refresh uses **no `scope` param** (so it works with the broad grant).
- `checkout-worker`, `tracking-worker`, `media-worker` (elira-media) — checkout, GA4/CAPI tracking, carousel/post media hosting.

### Other systems
- **n8n** — all automation (orders→Notion, social posting workflows (IG+FB built, INACTIVE), Shipped-email, token refresh, planned KPI digest/alerts).
- **Klaviyo** — email flows (templates in `infra/klaviyo/`, correct source). Founder handles Klaviyo.
- **Notion** — connected via MCP. Kanban board (data source `collection://37ea4815-a826-81f7-88da-000bd7d09c13`), Finance Ledger DB `37fa4815-a826-8132-9a84-e8e0defc62be`, Elira Operations page `243a4815-a826-8060-93b6-f2e9a3d90a68`, Orders DB.
- **GA4** — full ecommerce funnel events + Consent Mode v2 (denied default) implemented in code. Account-side config pending (founder).
- **Fulfillment:** supplier **selfnamed has NO API** (Shopify-plugin only). Fulfillment is semi-automated: order→Notion Orders row→founder fulfils manually + pastes tracking→n8n sends Shipped email. **Do not propose a selfnamed API integration.**

---

## 3. Hard rules / constraints
- **Never paste real secrets in chat.** Store in wrangler secrets / n8n / gitignored local files (e.g. `infra/telegram/notify.local.json`).
- **EU Cosmetics Reg. 655/2013:** appearance-based claims only, NO medical/efficacy claims ("treats/cures/heals"); be honest about allergens (e.g. lavender contains linalool).
- **EU Omnibus Directive:** only display/schema genuine reviews. (The 10 reviews ARE genuine — given to founder by phone.)
- **Do not delete either repo.** Do not force-push the live repo without explicit permission (granted once this session for the realign).
- Live site (github.io) must stay public; dev repo is private.

---

## 4. What was done this session (by area)

### Design / front-end
- **Premium polish pass:** layered card shadows + top-edge highlight, pointer-tracked **3D card tilt** + cursor glow (`initCardTilt` in app.js, desktop-only, reduced-motion safe), button gold-sheen sweep, metallic hero wordmark, footer top-edge light.
- **Wet-bottle effect** on the homepage scroll "chapter": SVG condensation beads + running droplets + gloss sweep over the rotating cream bottle (`WET` const in build.js renderHome, CSS in home.css).
- **Mobile bottle bug FIXED:** the scroll-driven `cp-mobile-spin` (CSS `animation-timeline: view()`) rendered upside-down/stuck on mobile → now forced upright/static on `@media (max-width:759px)` (droplets still animate). (User may still see it cached — `?fresh=1`/Incognito.)

### CRO
- Trust-signal row under add-to-cart on product pages (`trustRow(L)`, EU-compliant).
- **Product→Journal internal links:** each product page shows a "From the Journal" section linking the articles whose `related` includes that product (reverse map). CSS `.pdp-guide`.

### Content (SEO)
- 3 new trilingual articles: **hyaluronic-acid**, **lavender-water** (honest linalool caveat), **retinol-alternative-for-sensitive-skin** (concern-led, complements the existing Bidens ingredient explainer). Glycerin already existed (skipped).
- Weekly **scheduled article task** (see §6).

### AI-SEO / entity
- `SAMEAS` const in build.js → Organization schema `sameAs` on every page. Populated with **instagram.com/eliralivingeu, facebook.com/eliralivingeu, tiktok.com/@eliralivingeu**.
- **Footer social icons** added (all langs, `rel="me"`). Site had none before.
- New **Tier 6 (AI/LLM citation)** in `marketing/backlink-directories.md` (Wikidata, Crunchbase, Trustpilot, vegan DBs, listicles, community).
- HARO **pitch bank** (`marketing/haro-pitch-bank.md`) — 6 paste-ready journalist responses.

### eBay (marketplace = EBAY_DE)
- IDs: App ID `ZeerakAt-EliraLiv-PRD-ea92dced9-7be09ce6`, Dev ID `01d3193e-cb8e-40bf-b79c-0f1675c34207`, RuName `Zeerak_Ata-ZeerakAt-EliraL-lpoftkgc`. (Cert ID + refresh token = wrangler secrets only.)
- Deletion-compliance worker (unlocked the keyset) + orders→Ledger worker, both live & tested.
- **Broad OAuth scope granted** (sell.inventory, sell.account, sell.fulfillment, sell.finances, sell.marketing, commerce.identity.readonly) → refresh token updated. So listing create/revise is now possible on command.
- Gotcha: the portal "Get a User Token" button only shows a 2-hour token; the **refresh token** must be obtained via the OAuth authorization-code flow (consent URL → code → exchange).

### Repo / infra
- Made **elira-living private** (verified: Actions still run, CI builds + force-mirrors to public live repo — operationally unaffected).
- Force-mirror + single-source guard (see §2) — freeze class closed.

### Reviews (for AggregateRating schema — pending build)
10 genuine reviews in `assets/data/reviews-content.js`. **Review→product mapping (confirmed by founder):**
- Markus T. → radiant-glow-cleanser
- Daan V. → retinol-alternative-serum
- Sabine K. → retinol-alternative-serum
- Sanne M. → sensitive-moisturizing-cream
- Julia R. → sensitive-moisturizing-cream
- Femke D. → purifying-toner
- Thomas H. → sensitive-scalp-shampoo
- Bram J. → retinol-alternative-serum
- Lena B. → radiant-glow-cleanser
- Lotte S. → retinol-alternative-serum
> Next: add per-product Review + AggregateRating JSON-LD + a VISIBLE per-product reviews block on the PDP (Google requires schema to match visible content). Aggregates: retinol serum 4 reviews ⌀4.25; cream 2 ⌀5.0; cleanser 2 ⌀5.0; toner 1 ⌀5.0; shampoo 1 ⌀4.0.

---

## 5. eBay listings audit (4 active on eBay.de)
Pulled via Trading API `GetMyeBaySelling`/`GetItem` (temp worker endpoints, since removed).

| Listing | Item ID | Price | Title len | Photos | Specifics |
|---|---|---|---|---|---|
| Sensitive Feuchtigkeitscreme 50ml | 147354251499 | €19.90 | 72/80 ✅ | 10 ✅ | 22 ✅ |
| Radiant Glow Gesichtsreiniger 145ml | 147355903667 | €25.99 | 69/80 ⚠️ | 4 ❌ | 16 ⚠️ |
| Klärendes Gesichtswasser 200ml | 147362947382 | €24.00 | 67/80 ✅ | 5 ❌ | 9 ❌ |
| Retinol-Alternatives Serum | 147365337645 | €29.99 | **26/80** ❌ | 4 ❌ | 12 ⚠️ |

**Priority fixes (can be done via API with the broad scope):**
1. Retinol title wastes 54 chars → e.g. `Retinol-Alternative Serum 30ml Vegan Anti-Falten Hyaluron Bidens Elira Living`.
2. Broken specifics: Retinol `Hauptverwendungszweck="Verwendungszweck, Hauptverwendungszweck"` (placeholder); `Inhaltsstoffe=Aloe Vera` only (missing Bidens Pilosa, Hyaluronsäure).
3. Cream & cleanser: `Maßeinheit=10 ml` + `Anzahl der Einheiten=5/14.5` artifact → should be 1 unit.
4. Compliance: Retinol `Besonderheiten=100% natürliche Inhaltsstoffe` overclaims (it's 99% natural origin).
5. Thin photos (3 of 4 have only 4–5; protocol wants up to 12, banner/hero first). No branded banner hero yet.
6. Toner specifics only 9 → fill to ~20+. `Ursprungsland` inconsistent (Lettland vs Finnland) — verify.

**Skill installed:** `ebay-listing-generator` (from github.com/theloniuser/ebay-listing-generator) at `~/.claude/skills/ebay-listing-generator/` with a SKILL.md. Protocol = keyword title ≤80, 12 ordered hi-res photos banner-first, structured benefit-led description (hero → features → specs → use cases → contents → value → shipping/returns → CTA), complete item specifics, precise visual craft.

---

## 6. Automations set up this session
- **Scheduled task `elira-weekly-article`** (Claude Code Scheduled): Mondays ~9 AM → drafts ONE new trilingual article (untapped topic, EU-compliant, FAQ+schema) → pushes branch → opens a **PR via GitHub REST API** (NOT `gh` — gh is not authenticated; uses the stored git credential) → sends a **Telegram** message with the PR link. Never pushes to main. Review/merge from phone.
- **Telegram notify:** single bot for everything (article PRs now; KPI digest/alerts later). Config in **`infra/telegram/notify.local.json`** (gitignored; holds botToken + chatId 5556844215). Use plain ASCII in messages (Windows shell mangles emoji → Telegram 400).
- **GitHub Mobile app** installed by founder for PR notifications (set repo to Watch → All Activity).

---

## 7. Open tasks / who owns what
**Founder (★) — tickets exist on the Kanban board:**
- GA4 account-side: mark purchase/begin_checkout/sign_up as **key events**; link GA4↔Ads & GA4↔GSC; set **internal-traffic exclusion** (so founder's own usage doesn't count); validate in DebugView. *(On the consent prompt "automatically mark data as consented?" → answer **No** — the site already sends Consent Mode signals.)*
- Klaviyo Post-Purchase #1 unsubscribe link (test-send artifact; real flow sends resolve `{% unsubscribe %}`; if set Transactional, drop the marketing-unsubscribe line). The **$77.99** in Klaviyo = a TEST order (ref EL-TESTB1), not a real sale.
- SEO tickets 1–7 (Google Business ✅ done, Trustpilot ✅ `fi.trustpilot.com/review/eliraliving.com`, Wikidata **skipped** per Gemini caution, Crunchbase ✅ `crunchbase.com/organization/elira-living`, vegan dirs deferred (HappyCow login broken), Bing ✅ + Product Hunt launching, LinkedIn ✅ `linkedin.com/company/elira-living`), HARO setup (deferred), TikTok app + Content Posting API.
- Decide to flip social posting Phase A live (IG+FB).

**Claude (🤖) — actionable:**
- Add the URLs founder provided to `SAMEAS` and rebuild: **Trustpilot, Crunchbase, LinkedIn** (NOT Wikidata). *(Pending — do this next.)*
- **Review + AggregateRating schema** + visible PDP reviews (mapping in §4) — UNBLOCKED, ready to build.
- **eBay listing fixes** via API (titles + broken specifics + compliance) — awaiting founder go-ahead on the new titles.
- More content articles (ongoing, also via the weekly task).
- TikTok n8n poster — once founder provides Client Key (carousel images → TikTok photo posts).

---

## 8. Memory files (persisted across chats, in the user's auto-memory)
- `deploy-after-major-changes`, `recalled-items-logging`, `feedback-terminal-commands` (give full PowerShell paths; terminal starts at C:\Users\zeera), `elira-deploy-architecture`, `elira-ebay-integration`, `elira-fulfillment-selfnamed`.

## 9. Environment
- Working dir: `C:\Claude Code` (project at `C:\Claude Code\elira-living`). Windows 11, PowerShell + Bash available. `gh` CLI **not** authenticated (use git credential for API). `wrangler` authenticated as support@eliraliving.com. Notion MCP connected.
