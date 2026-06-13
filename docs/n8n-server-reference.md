# n8n Server — Standing Reference (Phase A)

**Source of truth for the live n8n install. No secrets in this file.**

## Live instance
- URL: **https://n8n.eliraliving.com**
- Host: Oracle Cloud Always-Free, Home region **Germany Central (Frankfurt)**
- Instance name: `elira-n8n`
- Shape: **VM.Standard.E2.1.Micro** (AMD, ~1 GB RAM) · AD: `EU-FRANKFURT-1-AD-1`
- Image: Ubuntu 24.04
- Public IPv4: **158.180.56.222**
- ⚠️ **TODO (later):** migrate to **VM.Standard.A1.Flex** (1 OCPU / 6 GB) when capacity returns. A1 was out-of-capacity in all ADs at setup.

## Networking (created manually — VCN wizard was unavailable)
- VCN: `elira-vcn` `10.0.0.0/16`, DNS label `eliravcn`
- Public subnet: `elira-public-subnet` `10.0.0.0/24`, DNS label `elirapublic`
- Internet Gateway + default route `0.0.0.0/0` → IGW
- Oracle Security List ingress open: **22, 80, 443**. Port **5678 stays closed** (internal only).

## DNS (GoDaddy, NOT Cloudflare)
- A record: `n8n` → `158.180.56.222`, TTL ½ hr → **n8n.eliraliving.com**

## SSH (from Windows PowerShell only)
- Private key: `C:\Users\zeera\Desktop\oracle-ssh\elira-n8n.key` (never commit)
- Public key: `C:\Users\zeera\Desktop\oracle-ssh\elira-n8n.pub.key`
- Connect: `ssh -i "C:\Users\zeera\Desktop\oracle-ssh\elira-n8n.key" ubuntu@158.180.56.222`
- When prompt shows `ubuntu@elira-n8n:~/n8n$` you are already inside — do NOT re-run the ssh command.

## Server layout (`~/n8n` on the VM)
- `docker-compose.yml`, `Caddyfile`, `.env` (created directly on server)
- Data volumes: `n8n_data/`, `caddy_data/`, `caddy_config/`
- 2 GB swap added (micro VM has little RAM)
- Docker installed + enabled; two containers: **n8n** (internal :5678) + **Caddy** (public :80/:443, HTTPS + reverse proxy)

## Secrets (keep private — never commit / never paste in chat)
- Oracle SSH private key
- n8n owner login password
- `N8N_ENCRYPTION_KEY` (in server `~/n8n/.env`) — required to restore/migrate saved credentials
- Future: Stripe, Notion, Klaviyo, Telegram, selfnamed creds

## Fix applied during setup (for reference)
- Symptom: HTTP 502, Caddy `connection refused :5678`, n8n `EACCES open /home/node/.n8n/config`
- Fix: `docker compose down` → `sudo chown -R 1000:1000 ./n8n_data` → `sudo chmod -R u+rwX ./n8n_data` → `docker compose up -d`

## Migration plan (when moving to A1.Flex)
1. New A1.Flex VM, install Docker + swap.
2. Copy whole `~/n8n` folder (compose, Caddyfile, **.env**, n8n_data, caddy_data, caddy_config).
3. Update GoDaddy A record `n8n` → new IP.
4. Domain stays the same → webhook URLs unchanged.

## Notion IDs (for n8n nodes)
- Integration token: stored privately (the `ntn_…` secret)
- Parent page: `243a4815-a826-8060-93b6-f2e9a3d90a68`
- Operations Board DB: `37ea4815-a826-81cb-9ee9-e60372973062`
- Content Library (Photoreal) DB: `37ea4815-a826-8169-86d5-c1b59ba62110`
- Orders DB: `37ea4815-a826-81eb-ab38-f65e104a0a83`

## Project folders (note the split)
- Claude's working repo: `C:\Claude Code\elira-living`
- Desktop project: `C:\Users\zeera\Desktop\elira-worker`
- These differ — n8n infra files Claude generates live in the Claude repo.

## Live n8n objects (created via public API)
- Workflow **Elira — Orders**: id `OlJrQ9gznLbuEY3R` (active) — Stripe webhook → Notion Orders + Telegram
- Workflow **Elira — Daily KPI digest**: id `HSKNVu60mxa42WWG` (active) — 08:00 daily → Telegram
- Credentials: `Stripe account` (stripeApi), `Notion account` (notionApi), `Telegram account` (telegramApi)
- Telegram bot: **@elira_ops_alert_bot**, chat id `5556844215`
- Stripe webhook auto-registered: `https://n8n.eliraliving.com/webhook/d54e74b3-…/webhook` (checkout.session.completed)
- Provision scripts: `tools/n8n-provision.js`, `tools/n8n-fix-telegram.js` (read secrets from env)

### Phase B/C workflows (added later)
- **Elira — Abandoned checkout** (active) — `checkout.session.expired` → Klaviyo "Started Checkout" + recovery URL + Locale
- **Elira — Shipped notify** (active, id `GeaRH4PMdlKgdFev`) — polls Orders (Fulfilment=Shipped, Notified=false) every 15 min → Klaviyo "Fulfilled Order" event → ticks Notified
- **Elira — Newsletter draft (weekly)** (INACTIVE, id `WdATieH0NWgfxvcl`) — Mon 09:00 → OpenRouter draft → Telegram. Activate later (costs ~$0.01/run).
- Extra credential: **OpenRouter** (httpHeaderAuth, id `NX7bSaRvgqeOrNno`), **Klaviyo** (httpHeaderAuth, id `F0YMOpS35y5d8Y7c`)
- Orders DB extra props: Address, Phone, Notified (checkbox)

### Klaviyo "(ready)" library templates (EN/DE/NL, routed by person.Locale)
Abandoned Cart · Welcome #1/#2/#3 · Post Purchase #1 · Post Purchase #2 & #3 · Browse Abandonment · Shipped.
Apply guide: `docs/klaviyo-flow-apply.md`. Locale set by n8n (orders/abandoned) + signup form (welcome).

## n8n public API note (for future automation)
- Auth header: `X-N8N-API-KEY`. Base: `https://n8n.eliraliving.com/api/v1`
- Credential `data` uses conditional-if schemas: for stripeApi/notionApi send
  `allowedHttpRequestDomains:"all"`, omit `allowedDomains`; stripeApi also needs `notice:""`.
- Update workflow = `PUT /workflows/{id}`; activate = `POST /workflows/{id}/activate`.

## Current status — Phase A COMPLETE ✅
- n8n live + HTTPS, owner account created
- Orders + KPI digest workflows live and active
- Telegram alerts working
- Next: **Phase B (Revenue)** — Klaviyo abandoned-cart + lifecycle flows.
