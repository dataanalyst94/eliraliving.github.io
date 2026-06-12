# Elira Living — Solo-Founder Automation Roadmap

> Goal: run a private-label skincare brand (DE + NL) as a one-person side hustle
> toward €3k+/mo profit, with Claude (Code + Cowork + MCP) as the operational hub
> and ad spend as the only meaningful recurring cost.
>
> Sourcing: **selfnamed.com** (private label, no inventory, no MOQ, EU + US fulfilment).
> Site: **eliraliving.com** (custom, Claude-built, GitHub Pages + Cloudflare Workers).

---

## Reality checks (the honest constraints)

1. **One Claude Max plan covers the "brain."** Max ($100–200/mo) includes **Claude Code**
   (dev/terminal automation) + **Cowork** (desktop agent for non-technical multi-step
   tasks) + **MCP connectors** (Klaviyo, Meta Ads, Playwright, GitHub, etc.).
2. **Claude can NOT generate photoreal images or UGC video.** Anthropic has no native
   image/video gen by design. Claude writes scripts/storyboards/captions, designs
   HTML/SVG, and *orchestrates + edits* — but the actual video/photo pixels need an
   external engine (free self-hosted FLUX/SD, or a cheap pay-per-use UGC tool).
3. **selfnamed provides an API key + auto order-sync.** Officially Shopify/WooCommerce,
   but the API key may let our custom site forward paid orders directly. Manual dashboard
   entry is the fallback. (Verified in Phase 1.)
4. **Near-zero costs beyond ads:** Cloudflare Workers (free), GitHub Pages (free),
   Klaviyo (free ≤250 contacts), n8n (self-host free / ~€5 VPS), Stripe (per-txn %).

---

## Phase overview

| Phase | Name | Why here | Time once built | Status |
|---|---|---|---|---|
| 1 | Order → Fulfilment automation | Don't drop orders while at day job | ~0 | 🔄 in progress |
| 2 | Brand content engine | Have product photos, no creatives | 1–2 hrs/wk | ⬜ |
| 3 | Social autopilot | Keep accounts alive hands-off | 30 min/wk | ⬜ |
| 4 | Paid ads + email/CRM | The growth engine (ad budget) | 2–3 hrs/wk | ⬜ |
| 5 | n8n orchestration layer | The glue tying it all together | ~0 | ⬜ |
| 6 | Analytics, CS & scaling | Decisions + support automation | 1 hr/wk | ⬜ |

---

## Phase 1 — Order → Fulfilment (the money path)  ⏸ PAUSED — awaiting selfnamed reply
**Goal:** Customer pays → selfnamed receives order → customer gets tracking → founder does nothing.

**Finding (2026-06-12):** selfnamed's "API key" is NOT a public/headless REST API. It is
selfnamed-issued and works only through their official **WooCommerce or Shopify plugin**
(store-pull + plugin model). No documented endpoint for a custom static site. Sources:
help.selfnamed.com WooCommerce integration manual.

**Decision:** Email selfnamed to ask whether direct/headless API access exists for a custom
storefront. Hold the Phase 1 build until they reply, then pick the cleanest path below.

Fulfilment path options:
- **Manual + Cowork** — Stripe order → founder/Cowork places it in selfnamed dashboard (€0, ~2 min/order)
- **Headless WooCommerce bridge** — custom site stays storefront; paid order pushed into hidden
  WooCommerce (well-documented REST API) running the selfnamed plugin → auto-sync (~€5/mo, fully hands-off)
- **Direct selfnamed API** — only if they grant it (email sent — see `docs/selfnamed-api-inquiry.md`)

Build checklist (resumes after reply):
- [ ] Email selfnamed re: headless/custom API access  ← **drafted, awaiting founder to send**
- [ ] "Never-miss-an-order" reliability layer: Stripe webhook → email + Google Sheet queue + customer confirmation
- [ ] Chosen fulfilment path wired (manual/Cowork, WooCommerce bridge, or direct API)
- [ ] Capture tracking → "shipped" email (Klaviyo)
- [ ] Failure alerts to founder email (no silent stuck orders)

**Output:** Hands-off (or semi-hands-off) fulfilment pipeline live BEFORE any ad spend.

**While we wait:** Phase 2 (content engine) has zero dependency on selfnamed and is the biggest
time sink — good candidate to start in parallel.

## Phase 2 — Brand content engine  ⬜
- [ ] Brand kit (voice, color, caption formulas, hook bank, calendar themes)
- [ ] UGC scripts, shot lists, ad storyboards, captions (EN/DE/NL)
- [ ] Pick ONE generation path (free self-host vs ~€20/mo UGC tool)
- [ ] 20–30 launch assets + weekly content system

## Phase 3 — Social autopilot  ⬜
- [ ] Auto-schedule + cross-post (IG/TikTok/Pinterest)
- [ ] Repurpose long content → Reels/Shorts/Pins
- [ ] Driven by n8n + Claude, ~30 min/wk

## Phase 4 — Paid ads + email/CRM  ⬜
- [ ] Meta Ads MCP: launch/monitor/A-B test DE + NL campaigns
- [ ] Klaviyo flows: welcome, abandoned cart, post-purchase, win-back
- [ ] Budget pacing + ROAS guardrails

## Phase 5 — n8n orchestration (full guided build)  ⬜
- [ ] Self-host n8n (VPS or local) — account-by-account setup
- [ ] Central flows: Stripe → selfnamed → Klaviyo → Sheets → alerts → social
- [ ] Error handling + retries + monitoring

## Phase 6 — Analytics, CS & scaling  ⬜
- [ ] Auto-draft customer-service replies
- [ ] KPI dashboard (orders, CAC, margin, ROAS)
- [ ] Weekly "scale vs cut" briefing from Claude

---

## Pending external setup (founder action items, tracked across phases)
- [ ] STRIPE_WEBHOOK_SECRET set on tracking worker (enables post-purchase emails)
- [ ] Rotate shared secrets (Klaviyo private key, GitHub tokens, Anthropic key)
- [ ] Request Search Console indexing for `/` and `/en/` (clear stale SERP)
- [ ] Decide content-generation path (Phase 2)
- [ ] Choose n8n hosting: local machine vs €5 VPS (Phase 5)

_Last updated: 2026-06-12_
