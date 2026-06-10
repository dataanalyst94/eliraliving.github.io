# Elira Living — Journalist-Query (HARO-style) Workflow

Answering reporter/blogger source requests is one of the fastest ways to earn
high-authority editorial backlinks. This is the "be a source, get quoted, get a
link" play.

> ⚠️ **HARO is gone.** "Help a Reporter Out" became Cision **Connectively** and
> was **shut down at the end of 2024**. Don't chase HARO — use the live
> services below.

## Where the requests are now (sign up, set keyword filters)

| Service | URL | Region | Notes |
|---|---|---|---|
| **Qwoted** | qwoted.com | Global | Strong HARO replacement; sources & journalists. Free tier. |
| **Featured** (was Terkel) | featured.com | Global | Answer expert questions → published as articles with a backlink + author bio. Great fit for a founder voice. |
| **SourceBottle** | sourcebottle.com | Global/AU/UK | Free email alerts by category (Health & Beauty). |
| **Help a B2B Writer** | helpab2bwriter.com | Global | B2B angle (e-commerce, small business, EU trade). |
| **ResponseSource** | responsesource.com | UK/EU | Paid; quality UK/EU media requests. |
| **JournoLink** | journolink.com | UK | SMB-focused PR + requests. |
| **X / Bluesky hashtags** | search live | Global incl. DE/NL | `#journorequest` `#PRrequest` `#bloggerswanted` `#prowig`. Works for German/Dutch journalists too. Set a saved search. |

**Beauty/skincare categories to opt into:** Health & Beauty · Lifestyle ·
Sustainability/Environment · Small Business/Entrepreneurship · Retail/E-commerce.

## Keyword watchlist (filter incoming requests on these)

```
skincare, vegan skincare, natural skincare, clean beauty, cruelty-free,
sensitive skin, fragrance-free, ingredients, INCI, moisturiser/moisturizer,
toner, cleanser, salicylic acid, sustainability, sustainable beauty,
ECOCERT, COSMOS, certification, scalp, sensitive scalp, shampoo, sulfate,
small business, solo founder, Etsy/eBay seller, EU e-commerce, Germany,
Netherlands, cross-border, female founder, bootstrapped brand
```

## The workflow (repeatable, ~5 min per pitch)

1. **Subscribe** to Qwoted + Featured + SourceBottle with the categories above.
2. **Triage** incoming queries against the keyword watchlist. Only answer ones you can speak to credibly.
3. **Draft fast** — reporters work on deadline; first useful, quotable answer often wins. Use the tool:
   ```bash
   # paste the reporter's request into a file, then:
   node tools/gen-pitch.js --file path/to/query.txt --lang en
   # or inline:
   node tools/gen-pitch.js "Looking for skincare experts on why fragrance-free matters for sensitive skin" --lang en
   ```
   It returns a concise, quotable response + a one-line bio + a ready-to-send email.
4. **Edit & humanise** — add a specific detail, keep it under ~150 words, no marketing fluff. Reporters cut hype.
5. **Send** before the deadline. Include the founder bio (Zeerak Ata, Elira Living) and the link only where the outlet allows.
6. **Track** in the table below. When published, log the live URL.

## What makes a response get used
- **Answer the exact question** in the first sentence. No preamble.
- **Be specific and quotable** — a crisp, opinionated line beats three vague paragraphs.
- **Credibility marker** — "As the founder of an ECOCERT COSMOS-certified vegan brand…".
- **No selling.** Mention a product only if the query explicitly asks for examples.
- **Plain claims only** — never medical claims ("treats/cures"). Skin & ingredient education only.

## Tracking table

| Date | Service | Query topic | Pitch sent | Outlet | Published URL | Link earned? |
|---|---|---|---|---|---|---|
|  |  |  | ☐ |  |  | ☐ |
|  |  |  | ☐ |  |  | ☐ |
|  |  |  | ☐ |  |  | ☐ |
