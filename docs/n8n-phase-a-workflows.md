# Phase A — Import & wire the first two workflows

Do this **after** you've created the n8n owner account at https://n8n.eliraliving.com.

Two workflows are ready in `infra/n8n/workflows/`:
- **orders.json** — every paid Stripe order → row in Notion *Orders* DB + Telegram ping
- **kpi-digest.json** — every morning 08:00 → "last 24h orders + revenue" to Telegram

---

## Step 1 — Add 3 credentials in n8n (once)
n8n → **Credentials → New**:

1. **Stripe API** (type: *Stripe API*)
   - Secret key from Stripe → Developers → API keys.
   - A **restricted key** is safest: give it *Read* on Charges + Checkout Sessions, and *Write* on Webhook Endpoints.
   - Name it exactly **`Stripe account`**.
2. **Notion API** (type: *Notion API*)
   - Use your existing integration token (the `ntn_…` secret).
   - Name it exactly **`Notion account`**.
   - ⚠️ In Notion, make sure that integration is shared with the **Orders** database (open Orders DB → ••• → Connections → add your integration).
3. **Telegram API** (type: *Telegram API*)
   - Paste your **bot token** from BotFather.
   - Name it exactly **`Telegram account`**.

> Naming them exactly as above means the imported workflows auto-match the credential.

## Step 2 — Import the workflows
For each file: n8n → **top-right ⋯ menu → Import from File** → pick `orders.json`, then again for `kpi-digest.json`.
(If you can't browse to the file, open it in Notepad, copy all, and use **Import from URL/Clipboard → paste**.)

## Step 3 — Set your Telegram chat id
In **both** workflows, open the **Telegram** node and replace `REPLACE_CHAT_ID` with your numeric chat id
(the one from `…/getUpdates`). Save.

## Step 4 — Activate
- Open **Elira — Orders** → toggle **Active** (top-right). This auto-registers the Stripe webhook for you — nothing to paste in Stripe.
- Open **Elira — Daily KPI digest** → toggle **Active**.

## Step 5 — Test
- **Orders:** Stripe Dashboard → Developers → Webhooks → your n8n endpoint → *Send test event* → `checkout.session.completed`. You should get a Telegram ping and a new row in the Notion **Orders** DB.
- **KPI:** open the digest workflow → **Execute workflow** (manual run) → expect a Telegram message (will show 0/€0 if no charges in 24h — that's fine).

---

## Notes
- This is **independent of the Cloudflare checkout worker**. The worker still handles Klaviyo "Placed Order" emails (once you set `STRIPE_WEBHOOK_SECRET` there). Stripe happily sends to multiple webhook endpoints — no conflict.
- Currency is forced to **EUR** in the Orders row (your store is EUR). If you ever sell in another currency, tell me and I'll extend it.
- Micro-VM friendly: both workflows are tiny (a few nodes, runs in <1s).
- When you confirm both work, I'll mark the Phase A cards **Done** and we move to **Phase B (Revenue)** — abandoned-cart + the rest of the Klaviyo lifecycle.
