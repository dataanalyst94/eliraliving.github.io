# Elira Living — Go-Live Checklist

Single source of truth for flipping everything from "built & paused" to "live."
Work top to bottom. Nothing social posts until **Section 3** is deliberately switched on.

---

## 0. Current automation state (snapshot)

**🟢 Already ACTIVE (commerce backbone — leave running):**
| Workflow | id | What it does |
|---|---|---|
| Orders | `OlJrQ9gznLbuEY3R` | Stripe order → Notion + Telegram |
| Finance ledger (website) | `2aJKYkXPFVgsFUOG` | Stripe sale → Finance Ledger row |
| Monthly fixed costs | `y8kIYg6S7QmdIjSd` | 1st of month → cost rows |
| Abandoned checkout | `60n7rUA5sayRd8nl` | Recovery nudge |
| Shipped notify | `GeaRH4PMdlKgdFev` | Fulfilment → customer email |
| Daily KPI digest | `HSKNVu60mxa42WWG` | Daily metrics → Telegram |
| Weekly review | `KBbvZ0thQ2Ag7Tho` | Weekly summary |

**⚪ Built & INACTIVE (the go-live switches):**
| Workflow | id | Activate when |
|---|---|---|
| Instagram poster | `dw8ZukQfdaCXOA4L` | Section 3 |
| Instagram carousel poster | `Z5dLwRfJe7KHRZEZ` | Section 3 |
| Facebook Page poster | `BfpbLkhZEVlPmf6q` | Section 3 |
| Pinterest poster | `29w1TGa80DK1tU9l` | Section 3 — **only after Standard access approved** |
| Instagram token refresh | `WeiMADMOSmO74t4U` | Section 3 (with IG posters) |
| Pinterest token refresh | `XIUCpvlzLI5imaA6` | Section 3 — **after seeding refresh_token** |
| Error alerts | `jcQCuY0xNk5myDU3` | Section 1 — turn on NOW, it's infra safety |
| Newsletter draft (weekly) | `WdATieH0NWgfxvcl` | Whenever you want weekly drafts |

---

## 1. Pre-flight (do these regardless of social go-live)

- [ ] **Activate Error alerts** (`jcQCuY0xNk5myDU3`) — catches any failing workflow. No reason to keep this off.
- [ ] **Confirm Stripe is in LIVE mode** (not test) and the Orders + Finance workflows are pointed at live keys.
- [ ] **Place one real test order** (smallest product, real card, then refund) → confirm:
  - [ ] Order appears in Notion Operations
  - [ ] Telegram order ping fires
  - [ ] Finance Ledger gets a row with correct Profit
- [ ] **eBay integration** — connect eBay sales into the Finance Ledger (separate task, in progress).
- [ ] **Shipping/fulfilment** path tested end-to-end (order → ship → Shipped notify email).

---

## 2. Social accounts — readiness

- [ ] **Instagram** @eliralivingeu — bio, link-in-bio (eliraliving.com), profile pic, highlights set.
- [ ] **Facebook Page** Elira Living — About, link, profile + cover image set.
- [ ] **Pinterest** — Standard access **approved** (video submitted; awaiting review). Until approved, leave Pinterest poster OFF.
- [ ] **Seed Pinterest refresh token** (one-time, needed for auto-refresh):
  ```powershell
  cd 'C:\Claude Code\elira-living'
  $env:N8N_API_KEY="<n8n-api-key>"
  node 'C:\Claude Code\elira-living\tools\set-pinterest-rt.js' <refresh_token>
  ```
- [ ] **Media host check** — open these in a browser, both must load:
  - https://elira-media.elira-living.workers.dev/posts.json
  - https://elira-media.elira-living.workers.dev/carousels.json

---

## 3. THE GO-LIVE SWITCH (flip these to activate posting)

Activate in n8n UI (open workflow → toggle **Active**), or tell Claude "go live" and it activates via API.

**Phase A — Instagram + Facebook (do first, watch for 1 week):**
- [ ] Instagram poster (`dw8ZukQfdaCXOA4L`) — Mon/Wed/Fri 10:00
- [ ] Instagram carousel poster (`Z5dLwRfJe7KHRZEZ`) — Tue/Fri 11:00
- [ ] Instagram token refresh (`WeiMADMOSmO74t4U`) — keeps the token alive
- [ ] Facebook Page poster (`BfpbLkhZEVlPmf6q`) — Tue/Sat 12:00

**Phase B — Pinterest (only after Standard access approved):**
- [ ] Pinterest poster (`29w1TGa80DK1tU9l`) — Mon/Thu 11:00
- [ ] Pinterest token refresh (`XIUCpvlzLI5imaA6`) — 20th monthly

**First-run smoke test (per workflow, once active):**
- [ ] Use n8n "Execute workflow" once manually → confirm the post actually lands on the platform + Telegram confirm fires.
- [ ] Check the post looks right (image, caption, hashtags, link).

---

## 4. First week — watch & tune

- [ ] Each Telegram confirm = a post went out. Spot-check the live posts.
- [ ] Organic-first: let posts run ~2 weeks, then boost the top ~20% by saves/shares (see `docs/social-caption-playbook.md`).
- [ ] Watch the Daily KPI digest for traffic/sales lift.

---

## 5. Post-launch hygiene (when convenient)

- [ ] **Rotate secrets** shared in chat during setup (logged as done/deferred in Notion — low risk for solo ops, do when on an untrusted device or sharing access). List: n8n API key, OpenRouter, Notion, Telegram, Stripe, Cloudflare, IG token, Meta app secret, Pinterest app secret, Klaviyo.
- [ ] **Oracle A1.Flex migration** — when capacity is available (logged in Notion).
- [ ] **TikTok / video** — deferred; revisit when ready.

---

### Quick "go live now" command (Claude runs it)
> Just say **"go live phase A"** or **"go live phase B"** and Claude activates the right workflows via the n8n API and runs the smoke tests.
