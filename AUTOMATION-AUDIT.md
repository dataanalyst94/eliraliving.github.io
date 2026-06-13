# Elira Living — Full Business Automation Audit (June 2026)

**Context:** Solo founder (Finnish *toiminimi*). Custom Claude-built static site (EN/DE/NL),
Stripe checkout via Cloudflare Worker, Klaviyo email, selfnamed.com fulfilment (manual for now).
Goal: automate *everything* possible, free, running 24/7 via self-hosted **n8n on Oracle Cloud Always Free**.

Legend: ✅ done · 🟡 partial · ⬜ not started · 🚫 can't be fully automated (human/legal/paid gate)

---

## 0. The automation backbone
- **Host:** n8n self-hosted on Oracle Cloud "Always Free" VM (Docker). Free forever, unlimited
  executions, 24/7 with your PC off. ⬜ to set up.
- **Brain:** n8n + the OpenRouter/Gemini + Claude keys we already use for AI steps.
- **Data hub:** Notion (already holds Ops board + Content Library). Acts as the free "database/CRM/CMS".
- **Messaging to you:** a free **Telegram bot** = your control panel + alerts (better than email for ops).

---

## 1. Storefront & catalog
| Item | Status | Notes |
|---|---|---|
| Trilingual site live | ✅ | EN/DE/NL, 6 products |
| Product catalog source of truth | 🟡 | Lives in `catalog.js` + content files; edited by hand/Claude |
| Auto price/stock sync | ⬜ | No live inventory feed yet (selfnamed API paused) |
| **Automatable:** Notion "Products" DB → n8n → regenerate catalog JSON + redeploy on change. |
| **Can't yet:** real-time stock (needs selfnamed API or manual stock field). |

## 2. Payments & checkout
| Item | Status | Notes |
|---|---|---|
| Stripe checkout | ✅ | Worker + payment links |
| Stripe webhook → events | 🟡 | **STRIPE_WEBHOOK_SECRET not set** → "Placed Order" emails & order logging blocked |
| **Next:** set webhook secret → unlocks order automation (§3, §5). One-time, free. |

## 3. Order management & fulfilment
| Item | Status | Notes |
|---|---|---|
| Order capture | 🟡 | Stripe has it; not yet flowing into Notion |
| Order log / dashboard | ⬜ | Build Notion "Orders" DB, n8n writes each paid order |
| Customer alert (you) | ⬜ | Telegram ping on every sale |
| Fulfilment to selfnamed | 🚫→🟡 | API is plugin-only today → **manual**. n8n can auto-create a fulfilment checklist + pre-filled order details so it's 2-min copy-paste until their API answer |
| Tracking → customer email | 🟡 | Auto once tracking number entered (manual entry until API) |
| **Can't be done now:** hands-off fulfilment — blocked on selfnamed API (pending their reply). |

## 4. Customer service / support
| Item | Status | Notes |
|---|---|---|
| Support inbox | ⬜ | Set one free shared mailbox (e.g. hello@) |
| AI first-draft replies | ⬜ | n8n + Claude drafts answer from a Notion FAQ/knowledge base, **you approve in Telegram** (human-in-loop) |
| Order-status auto-answer | 🟡 | Possible once orders are in Notion |
| Auto-send without review | 🚫 (by choice) | Cosmetics = no medical/skin-condition claims; keep human approval to stay EU-compliant |
| **Automatable:** ~80% of tickets drafted instantly; you click ✅ to send. |

## 5. Email & CRM / lifecycle (Klaviyo)
| Flow | Status | Priority (industry data: 20–40% more email revenue) |
|---|---|---|
| List + signup | ✅ | Klaviyo Site ID + List live |
| Welcome series | 🟡 | Verify it's switched on |
| Abandoned cart | ⬜ | **Highest-ROI flow** — needs Stripe/checkout events → Klaviyo |
| Browse abandonment | ⬜ | Needs on-site tracking events |
| Post-purchase / cross-sell | ⬜ | Triggers off "Placed Order" |
| Winback (lapsed buyers) | ⬜ | Time-based, easy |
| **Automatable:** all of it, free on Klaviyo's free tier (up to 250 contacts / 500 sends mo — upgrade later). n8n fills gaps Klaviyo can't see (custom site). |

## 6. Newsletter / broadcast content
| Item | Status | Notes |
|---|---|---|
| Newsletter design | ⬜ | Reusable Klaviyo template (brand kit colors/fonts) |
| Auto-draft content | ⬜ | n8n weekly: Claude drafts EN/DE/NL newsletter from a "topics" Notion DB + product of the week |
| Send | 🚫 (by choice) | You approve before send (brand + legal safety) |
| **Automatable:** draft generated for you weekly; one click to schedule. |

## 7. Social media — organic posting
| Item | Status | Notes |
|---|---|---|
| Content library (images) | ✅ | 90 trilingual photoreal posts in Notion |
| Captions + hashtags | 🟡 | Brand kit has formulas; not yet generated per-post |
| Scheduling/auto-post | ⬜ | n8n picks from Notion → posts on schedule |
| Instagram + Facebook | 🟡 | **Free** via Meta Graph API — but needs a Business/Creator IG account + free Meta app (1-time approval). Fully automatable after that |
| TikTok | 🚫→🟡 | Content Posting API needs app review; harder. Fallback: n8n drafts + reminds you to post |
| Pinterest | 🟡 | Free API, good for skincare discovery, easy to automate |
| **Reality:** IG/FB/Pinterest = full auto (free). TikTok = assisted. Social = 60% of product discovery in 2026, so this is high value. |

## 8. Paid ads
| Item | Status | Notes |
|---|---|---|
| Ad creative | ✅ source | Reuse the 90 images + brand kit |
| Campaign setup | 🚫 (by choice) | You launch/own budget; spend decisions stay human |
| Auto reporting | ⬜ | n8n pulls Meta/Google spend → daily digest |
| Auto-pause bad ads | 🟡 | Possible later via Meta API rules |
| **Note:** ads are your one expected cash expense — automate *reporting*, not *spending*. |

## 9. SEO (classic)
| Item | Status | Notes |
|---|---|---|
| On-page meta / structured data | 🟡 | Verify Product/Offer schema on all PDPs |
| Sitemap + robots | 🟡 | Confirm submitted |
| Search Console indexing | ⬜ | **Request indexing** of `/` and `/en/` (pending) |
| Content/blog engine | ⬜ | n8n + Claude: weekly SEO article (EN/DE/NL) → site, targeting buyer keywords |
| Rank tracking | ⬜ | Free-tier tools or n8n + SERP scrape |
| **Automatable:** content production + monitoring. Indexing is 1 manual click. |

## 10. GEO / AIEO — getting cited by ChatGPT/Perplexity/Google AI/Claude
*(New in 2026: ChatGPT referrals convert ~31% higher; AI-cited sources now overlap <20% with Google top results — separate discipline.)*
| Item | Status | Notes |
|---|---|---|
| AI-friendly structured content | ⬜ | FAQ pages, clear Q&A headings, comparison tables, ingredient explainers |
| Freshness | ⬜ | Content updated <30 days gets 3.2× more AI citations → automate a refresh cadence |
| `llms.txt` + clean schema | ⬜ | Quick wins to add |
| Presence on sources AI reads | ⬜ | Reddit/forums/review sites, structured product data |
| Monitor AI mentions | ⬜ | n8n periodically asks the AI engines about your category, logs whether you're cited |
| **Automatable:** content generation, freshness refresh, citation monitoring. |

## 11. Content production (images / video / copy)
| Item | Status | Notes |
|---|---|---|
| Product/social images | ✅ | Nano-Banana pipeline (90 done, repeatable) |
| Copy / captions (EN/DE/NL) | 🟡 | Pipeline exists; wire to auto-caption every asset |
| Video / UGC | ⏸️ | **Deferred by you** |
| **Automatable:** images + copy on demand; video later. |

## 12. Analytics & reporting
| Item | Status | Notes |
|---|---|---|
| Web analytics | 🟡 | Confirm a privacy-friendly analytics (e.g. Cloudflare Web Analytics — free) |
| Sales/revenue dashboard | ⬜ | n8n aggregates Stripe → Notion + daily Telegram digest |
| KPI digest (orders, revenue, CAC, top product) | ⬜ | Morning summary, fully automatable |
| **Automatable:** near-total. Single daily "state of the business" message. |

## 13. Inventory & supply chain
| Item | Status | Notes |
|---|---|---|
| Stock levels | 🚫→🟡 | Manual until selfnamed API; track in Notion meanwhile |
| Low-stock / reorder alert | ⬜ | n8n watches Notion stock field → alerts you to reorder |
| **Can't be done now:** live stock sync (selfnamed). Workaround: manual stock field + alerts. |

## 14. Finance / accounting / tax
| Item | Status | Notes |
|---|---|---|
| Sales record | ⬜ | n8n logs every Stripe payout/sale → Notion/Sheet ledger |
| Invoices/receipts | 🟡 | Stripe issues receipts; archive automatically |
| **EU VAT (OSS)** | 🚫 | B2C into DE/NL → once over €10k/yr you must register for **VAT OSS** in Finland. Filing is human/accountant. n8n can *prepare* the numbers, not file |
| Bookkeeping | 🟡 | Auto-categorize via n8n; **filing stays human** |
| **Can't be automated:** tax filing, accountant sign-off. Automate the data prep only. |

## 15. Legal & compliance (the non-negotiables)
| Item | Status | Notes |
|---|---|---|
| GDPR (privacy policy, cookie consent, data reqs) | 🟡 | Verify consent banner + DPA with processors |
| **EU Cosmetics Regulation 1223/2009** | 🚫 | Each product needs a **Responsible Person (EU)**, a **Product Information File (PIF)**, and **CPNP notification** before sale. Usually the manufacturer (selfnamed?) holds these — **must confirm in writing** |
| Claims compliance (Reg. 655/2013) | ✅ | We already constrain all marketing copy to substantiated claims |
| Imprint/Impressum (DE), terms, returns | 🟡 | Confirm DE *Impressum* + 14-day EU withdrawal rights present |
| **Can't be automated:** CPNP/PIF/Responsible Person, legal review. **Highest business risk — must verify selfnamed covers it.** |

---

## What's genuinely impossible / human-only (be clear-eyed)
1. **Hands-off fulfilment** — blocked on selfnamed API (pending).
2. **Tax filing & accountant sign-off** — prep only.
3. **Cosmetics legal (CPNP/PIF/Responsible Person)** — must be held by you or selfnamed; verify now.
4. **Ad spend & budget decisions** — automate reporting, not spending.
5. **Final send on customer emails / public replies** — keep human approval (brand + medical-claim safety).
6. **TikTok auto-posting** — assisted, not fully auto (API gate).

## What's 100% automatable for free, now
Order logging + alerts · fulfilment checklists · AI-drafted support replies · all Klaviyo lifecycle flows ·
newsletter drafts · IG/FB/Pinterest scheduled posting · per-post captions (EN/DE/NL) · SEO + GEO content
generation + freshness · AI-citation monitoring · daily KPI digest · low-stock alerts · finance data prep.

---

## Recommended n8n build order (each = one workflow)
**Phase A — Foundation (today/this week)**
1. Oracle VM + n8n + Telegram bot + Notion connection
2. Set Stripe webhook secret → **Orders workflow** (log to Notion + Telegram alert + receipt archive)
3. **Daily KPI digest** (Stripe → Telegram every morning)

**Phase B — Revenue**
4. Klaviyo lifecycle: abandoned cart → welcome → post-purchase → winback
5. Fulfilment-checklist workflow (selfnamed manual bridge)
6. AI support-draft workflow (human-approve in Telegram)

**Phase C — Growth**
7. Social scheduler (Notion library → IG/FB/Pinterest) + auto-captions
8. SEO/GEO content engine (weekly EN/DE/NL articles + freshness refresh)
9. AI-citation + rank monitoring
10. Newsletter draft engine

**Phase D — Ops hygiene**
11. Low-stock alerts · finance ledger prep · weekly review digest

---

## Immediate human to-dos (only you can do)
- [ ] Set **STRIPE_WEBHOOK_SECRET** (unblocks order automation)
- [ ] Confirm **selfnamed** holds Responsible Person + CPNP/PIF for all 6 products (legal)
- [ ] Request **Search Console** indexing of `/` and `/en/`
- [ ] Create free **Oracle Cloud** account (I guide the rest)
- [ ] Create a free **Telegram bot** (BotFather) — 2 min
- [ ] Decide whether to register **VAT OSS** (check if near €10k threshold)
</content>
