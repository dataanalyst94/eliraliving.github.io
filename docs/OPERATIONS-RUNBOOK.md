# Elira Living — Operations Runbook (portable)

**Purpose:** everything needed to *run, fix, and maintain* this business without the
person who built it. Written to be pasted into any AI assistant (Claude, ChatGPT,
Gemini) or handed to a freelance developer. Pair it with `docs/PROJECT-CONTEXT.md`
(the "what everything is" overview); this file is the "how to operate it" half.

> **Secrets are NOT in this file** — only their *names* and *where they live*. Never
> paste real API keys/tokens into a chat. They live in Cloudflare (wrangler secrets),
> n8n's encrypted store, Klaviyo, or a gitignored local file — described below.

---

## 0. How to use this with another AI

Paste this whole file and say: *"You are my ops engineer for Elira Living. Here is
the runbook. Help me [do X]."* Then tell it:
- **Working folder:** `C:\Claude Code\elira-living` (Windows). Also `C:\Claude Code\x-geopolitics` is a separate project — ignore it here.
- **GitHub:** the `gh` CLI is NOT logged in on this machine. For GitHub API calls, read the saved token with:
  `printf "protocol=https\nhost=github.com\n\n" | git credential fill` (the `password=` line is the token).
- **Cloudflare:** `npx wrangler` is logged in as `support@eliraliving.com`.
- **Deploy = 3 steps** (see §3). Never trust "it looks live" — verify bytes.

---

## 1. System map (what runs, and who keeps it alive)

| System | Purpose | Lives on | Survives without Claude/dev? |
|---|---|---|---|
| Website | The storefront | GitHub Pages (public repo) | ✅ yes |
| CI build + deploy | Rebuild site on every change | GitHub Actions | ⚠️ builds yes; live-mirror needs a token (see §3) |
| `elira-checkout` | Stripe/iDEAL/Klarna checkout | Cloudflare Worker | ✅ yes |
| `elira-ebay-orders` | eBay.de orders → Notion ledger (every 6h) | Cloudflare Worker (cron) | ✅ yes (until token expires — §5) |
| `elira-ebay-deletion` | eBay account-deletion compliance | Cloudflare Worker | ✅ yes |
| `elira-tracking` | Server-side GA4 + Meta CAPI | Cloudflare Worker | ✅ yes |
| `elira-media` | Hosts social/carousel images | Cloudflare Worker | ✅ yes |
| Fulfillment loop | Order → Notion → Shipped email | n8n + Notion | ✅ yes (you paste tracking) |
| Klaviyo flows | Lifecycle emails | Klaviyo | ✅ yes (some need switching on) |
| Analytics | GA4 + Pixels + CAPI | Browser + Worker | ✅ yes |
| Weekly article | Drafts article → PR → Telegram | **Claude Code scheduled task** | 🔴 no — needs Claude |
| IG/FB auto-post | Social posting | n8n | ⏸️ built but paused by owner |

**Plain answer to "do I need Claude?"** The store keeps *running* without it. You need
Claude (or a developer) to **fix breakages, rotate expiring tokens, and build/change
things** — and for the weekly content engine specifically.

---

## 2. The two GitHub repos (critical to understand)

- **`dataanalyst94/elira-living`** — DEV repo (PRIVATE). Git remote name: `origin`. All
  work happens here. Has the CI that runs `node build.js`.
- **`dataanalyst94/eliraliving.github.io`** — LIVE repo (PUBLIC). Remote name: `elira`.
  GitHub Pages serves it at `www.eliraliving.com`. **Must stay public** (free Pages).
- CI **force-mirrors** dev's built output to the live repo. Never delete either repo.

---

## 3. DEPLOY PROCEDURE (do this after any site change)

Local build + commit source only (CI regenerates HTML):
```
cd "C:\Claude Code\elira-living"
node build.js                      # regenerate pages locally to check
git add <source files>             # e.g. assets/data, assets/css, assets/js, build.js
git commit -m "..."
git stash push -u                  # set aside locally-built HTML (untracked)
git pull --rebase origin main
git push origin main               # → triggers CI
```
**✅ Auto-publish is LIVE (set up 2026-07-05).** For a normal change (content, images,
articles, prices, CSS/JS) you now just `git push origin main` and **CI builds + mirrors
to the live site automatically** — no manual mirror. Give it ~1–2 min, then optionally
byte-verify: `curl -s -o /dev/null -w "%{size_download}" "https://www.eliraliving.com/<path>?cb=<random>"` should match your local file.

**The ONE exception — editing the CI workflow file itself** (`.github/workflows/build-site.yml`):
the `PAGES_SYNC_TOKEN` is a Contents-only token and GitHub refuses to let it push *workflow-file*
changes. So after editing the workflow, the auto-forward will fail once. Fix: run a single manual
mirror with a workflow-scoped token (your normal git credential has it):
`git fetch origin && git push elira origin/main:main --force`. After that, content pushes
auto-publish again. (You rarely touch this file.)

> **If www still won't update** after a normal push (rare — GitHub Pages build stuck/errored):
> re-request the build — `POST https://api.github.com/repos/dataanalyst94/eliraliving.github.io/pages/builds`
> with the GitHub token (§0). Separate issue from mirroring; see the flaky-Pages note above.

> **⚠️ GitHub Pages is flaky** (3 stuck/failed builds in July 2026). If www won't update
> and step 3 shows `errored` or is stuck in `building`: **re-request a build** —
> `POST https://api.github.com/repos/dataanalyst94/eliraliving.github.io/pages/builds`
> with the GitHub token. This has fixed it every time. `.nojekyll` is already present, so
> it's GitHub-side flakiness, not a Jekyll problem.

---

## 4. Cloudflare Workers (deploy/fix)

All under Cloudflare account **support@eliraliving.com**. Deploy any worker:
```
cd "C:\Claude Code\elira-living\<worker-folder>"
npx wrangler deploy
```
Set/rotate a secret (paste value at the prompt — never in a file):
```
npx wrangler secret put <SECRET_NAME>
```

| Worker | Folder | URL / trigger | Secrets it needs |
|---|---|---|---|
| `elira-checkout` | `checkout-worker/` | called by the site | `STRIPE_SECRET_KEY`, `ALLOW_ORIGIN` |
| `elira-ebay-orders` | `ebay-orders-worker/` | cron `0 */6 * * *`; `GET https://elira-ebay-orders.elira-living.workers.dev/` = health/manual-trigger | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REFRESH_TOKEN`, `NOTION_TOKEN` |
| `elira-ebay-deletion` | `ebay-deletion-worker/` | eBay pings it | `EBAY_VERIFICATION_TOKEN` |
| `elira-tracking` | `tracking-worker/` | called by the site | `META_PIXEL_ID`, `META_CAPI_TOKEN`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `ALLOW_ORIGIN` |
| `elira-media` | `media-worker/` | serves images publicly | — |

Non-secret config lives in each `wrangler.toml` (e.g. `elira-ebay-orders` has
`NOTION_FINANCE_DB`, `EBAY_MARKETPLACE=EBAY_DE`, `LOOKBACK_DAYS=7`).

**Health check the eBay sync:** open `https://elira-ebay-orders.elira-living.workers.dev/`
in a browser. `{"ok":true,...}` = healthy. `{"ok":false,"error":"eBay token ..."}` =
the refresh token expired → see §5.

---

## 5. Maintenance calendar (things that WILL need attention)

| When | What | Action |
|---|---|---|
| **~every 18 months** (next ≈ **late 2027**) | eBay `EBAY_REFRESH_TOKEN` expires → orders stop syncing | Re-run the eBay OAuth consent flow to get a new refresh token, then `npx wrangler secret put EBAY_REFRESH_TOKEN` in `ebay-orders-worker/` and redeploy. (The consent-URL + code-exchange steps are in `docs/` and prior Claude chats.) |
| **by 12 Aug 2026** | Verpact (NL packaging EPR) registration + Dutch Authorized Rep | Email selfnamed to act as your Authorized Representative; register at verpact.nl. (Ticket + reminder already set.) |
| If a token ever leaks | Any Cloudflare/Notion/Klaviyo/eBay/Zoho key | Rotate it in the provider's dashboard, then `wrangler secret put` the new value + redeploy. |
| Ongoing | GitHub Pages stuck build | Re-request build (§3). |

---

## 6. Fulfillment — the one daily manual step

selfnamed (your supplier) has **no API** — this is by design, not broken.
1. Order comes in → a row auto-appears in the **Notion "Orders"** database.
2. **You** fulfil it on selfnamed's own site (manual).
3. In the Notion Orders row: paste the **tracking URL** and set **Fulfilment → Shipped**.
4. Within ~15 min, n8n auto-emails the customer their **Shipped** notice (in their
   language) with the tracking link, and ticks **Notified**.

**Manual fallback if n8n is down:** just email the customer the tracking link yourself.

---

## 7. Common breakages → fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Site changes not showing on www | Pages build stuck/errored, or not mirrored | §3: confirm mirror happened, check Pages build status, re-request build |
| eBay orders not appearing in ledger | Refresh token expired | §5 (re-consent + update secret + redeploy) |
| A worker returns errors | Bad deploy or expired secret | `GET` its health URL; `npx wrangler deploy` to redeploy; check the secret |
| Shipped emails not sending | n8n workflow off, or Notion row missing tracking/Shipped | Check n8n workflow is active; check the Notion row |
| Klaviyo shows fake revenue | A test order (e.g. `EL-TESTB1`) polluted data | Ignore/delete the test event in Klaviyo — not a real sale |
| Weekly article didn't run | Claude Code app was closed at run time | Open Claude Code; the task runs on next launch (needs Claude login) |

---

## 8. Where the config/IDs live (all non-secret, safe to share)

- **Analytics/marketing IDs:** `assets/data/analytics-config.js` — GTM `GTM-NGL5C9TL`,
  GA4 `G-TCKTDT6E7T`, Meta Pixel `2382778145481273`, TikTok `D8JB7MJC77U2SBB696UG`,
  Google Ads `AW-18223383471`. Klaviyo public: SITE_ID `V2dqim`, LIST_ID `WKcxya`.
- **Notion:** Finance Ledger DB `37fa4815-a826-8132-9a84-e8e0defc62be`; Kanban board
  data source `37ea4815-a826-81f7-88da-000bd7d09c13`; plus the Orders DB.
- **Telegram bot** (notifications): config in `infra/telegram/notify.local.json`
  (gitignored — holds botToken + chatId). Used to ping you when the weekly article PR opens.
- **Products/prices/content:** `assets/data/catalog.js` (prices, SKUs, images),
  `assets/content/{en,de,nl}.js` (names/descriptions), `assets/data/blog/*.json` (articles).
- **Email templates:** `infra/klaviyo/` (apply steps in `docs/klaviyo-flow-apply.md`).
- **n8n reference:** `docs/n8n-server-reference.md`, `docs/n8n-phase-a-workflows.md`.

---

## 9. Claude-dependent pieces (what you lose if you stop Claude)

- **Weekly Journal article** — runs as a Claude Code scheduled task (`elira-weekly-article`,
  Mondays ~9am). Needs Claude Code open + logged in. Without it, no new auto-content
  (the existing 28 articles stay live).
- **The Verpact reminder** (one-time, Jul 11) — same mechanism.
- **All development, fixes, SEO/listing work, image edits, deploy-unsticking** — currently
  done by Claude on request. A freelance developer can do these too, using this runbook.

Everything else in §1 keeps running on its own.

---

## 10. Handing off to a developer (if you ever replace Claude)

Give them: this file + `docs/PROJECT-CONTEXT.md` + collaborator access to both GitHub
repos + the Cloudflare, Notion, Klaviyo, and n8n logins. They'll need ~a day to get
oriented. The whole stack is standard (static site, Cloudflare Workers, n8n, GitHub
Actions) — nothing exotic or locked to Claude.
