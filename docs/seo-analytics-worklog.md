# SEO / Analytics / Content — Worklog (overnight batch)

Session date: 2026-06-14. Everything below is committed; social posting stays INACTIVE.

## ✅ Shipped this session
1. **12 insight-led v2 carousels** (DE+NL) — queued ahead of the originals; lead is `p3-v2` with Emma (Berlin) 5★ review. Live on Cloudflare.
2. **90 solo-post captions rebuilt** — 5 distinct psychological angles per product (hero=outcome, modelf=problem, modelm=social proof, vanity=ritual, flatlay=authority). Emma review on p3. Deployed.
3. **Full GA4 ecommerce funnel** — added `view_item_list`, `select_item`, `view_cart`, `remove_from_cart`, `sign_up` (newsletter → GA4 + Meta Lead + TikTok). Existing: view_item, add_to_cart, begin_checkout, purchase, + server-side CAPI. Now a complete funnel.
4. **3 ingredient guide pages** (programmatic SEO, quality-first — NOT thin) — Hexapeptide-11, Bidens Pilosa, Ginkgo Biloba. Trilingual, ~27KB each, with `BlogPosting` + `FAQPage` schema, hreflang, breadcrumbs, in sitemap (now 120 URLs) + llms.txt. Built as journal articles so they inherit all SEO scaffolding.
5. **.gitattributes** — LF normalization; stops the rebuild push-conflicts we hit.
6. **GSC verification slot** wired into the generator (commit earlier).

## 🔧 Open tickets (also in `tools/notion-create-tickets.js`)
| Ticket | Owner | Notes |
|--------|-------|-------|
| GSC: verify URL-prefix via GA4/GTM + request indexing | You | You started this — verify ownership using existing GA4 (`G-TCKTDT6E7T`) or GTM (`GTM-NGL5C9TL`), no code needed. |
| Analytics: mark key GA4 events as conversions + dashboards | You (GA4 UI) | In GA4 → Admin → Events, mark `purchase`, `begin_checkout`, `sign_up` as key events; build a funnel exploration. The events now fire — this is GA4-side config. |
| Backlinks: Week-1 directory submissions | You | `marketing/backlink-tracker.md` — needs your accounts. |
| Backlinks: HARO / journalist outreach | You | Snippets ready in `outreach-templates.md`. |
| Content: expand ingredient guides + product→guide internal links | Claude (next) | More actives (glycerin, hyaluronic acid, Lavender) + link product pages to guides. |
| Notion: authorize MCP / store token | You | So Claude can auto-file tickets (see below). |

## 📌 Notion tickets — why they're not auto-filed yet
The Notion MCP needs a one-time browser OAuth (you were asleep) and the script token isn't in my env. **Two ways to file these tickets:**
- **Authorize the Notion MCP** next session and I'll create them directly, **or**
- Run: `$env:NOTION_TOKEN="secret_xxx"; node "C:\Claude Code\elira-living\tools\notion-create-tickets.js"` — idempotent, reads the live board schema, skips duplicates.

## What needs YOU (can't be done autonomously)
- GSC verification + indexing (your Google account)
- GA4 conversions/dashboard config (GA4 UI)
- Backlink submissions + outreach (your accounts/email; outward-facing)
- Notion auth (browser OAuth)
