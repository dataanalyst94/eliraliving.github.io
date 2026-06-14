# Finance Dashboard — how it works

**Source of truth:** Notion **Finance Ledger** DB (`37fa4815-a826-8132-9a84-e8e0defc62be`).
One row per transaction. `Net profit` and `Month` are auto-formulas.

## What's automated
- **Website sales (live):** n8n "Elira — Finance ledger (website)" (`2aJKYkXPFVgsFUOG`, ACTIVE).
  On every Stripe `checkout.session.completed` it writes a **Sale** row with:
  - **Gross** = amount paid
  - **Fees** = real Stripe processing fee (pulled from the charge's balance transaction)
  - **COGS** = landed cost per item (base + 25.5% VAT + €6.75 shipping), summed by quantity
  - **Channel** = Website (or **Social** if the checkout carries `metadata.channel=social` / a social `utm_source`)
  - **Net profit** = Gross − Fees − COGS (formula)
- **eBay sales:** pending — wire once eBay API keys exist (see below).

### COGS table (all-in landed cost per unit)
| Product | Base | +25.5% VAT +€6.75 ship = COGS |
|---|---|---|
| Peptide Serum | €12.80 | **€22.81** |
| Retinol Alternative | €11.90 | **€21.68** |
| Sensitive Cream | €11.50 | **€21.18** |
| Radiant Cleanser | €11.20 | **€20.81** |
| Purifying Toner | €8.90 | **€17.92** |
| Scalp Shampoo | €11.20 | **€20.81** |

Update these in the workflow's "Build finance row" Code node if selfnamed's prices change.

## Set up the dashboard views (one-time, in Notion UI — charts can't be made via API)
Open the Finance Ledger DB → **+ Add view** for each:
1. **Profit by month** — Chart → Bar · X-axis = `Month` · Y = Sum of `Net profit`.
2. **Revenue by month** — Chart → Bar · X = `Month` · Y = Sum of `Gross`.
3. **By channel** — Chart → Donut · Group = `Channel` · Value = Sum of `Gross` (and a 2nd for `Net profit`).
4. **Cost breakdown** — Chart · Group = `Type` · Value = Sum of (Fees + COGS + Other cost), or just view the table grouped by Type.
5. **Table (all)** — default table, sorted by `Date` desc, with a sum row on Gross / Fees / COGS / Net profit (click the bottom of each column → Sum).

Put these on a Notion page as a linked database to get a single "Dashboard" screen.

## Adding costs that aren't sales
For subscriptions, ads, refunds, extra shipping — add a row manually:
- **Type** = Subscription / Ad spend / Other cost / Refund
- Put the amount in **Other cost** (positive number) — it subtracts from profit automatically.
- Leave Gross/Fees/COGS at **0** (don't leave blank — the formula expects a number).
- (Optional later: I can build a monthly n8n job that auto-adds your fixed subscriptions —
  send me the list: name + €/month, e.g. Klaviyo €X, domain €Y.)

## eBay (pending your API keys)
Once you create eBay production keys (developer.ebay.com → Application Keys) and a seller
user token, I add an n8n workflow that polls the eBay Sell/Fulfillment API for completed
orders and writes **Channel=eBay** Sale rows (gross, eBay fees, COGS) — same shape as website.
