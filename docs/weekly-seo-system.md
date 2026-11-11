# Weekly SEO Article System

## What it does

Every Monday, GitHub Actions:

1. Reads the latest finalized 28 days of Google Search Console query, page, and country data and compares it with the preceding 28 days.
2. Uses GA4 landing-page engagement and key events to distinguish traffic from commercially useful traffic.
3. Optionally expands the strongest first-party opportunities with live Google questions, related searches, and competing results through Serper.
4. Removes branded and support queries, then scores opportunities using impressions, CTR gap, ranking position, and growth.
5. Compares candidates with every existing Journal title and keyword set to avoid duplicate search intent and keyword cannibalization.
6. Selects one people-first content gap with a natural connection to an Elira product.
7. Creates native English, German, Dutch, and Finnish versions.
8. Rejects short copy, duplicate titles, invalid products, unsupported block types, and obvious medical or unsupported claims.
9. Builds the full site as a final validation.
10. Opens a pull request and sends one readable Telegram message with the title, source query, and review link.

The workflow never publishes an article directly. Merging the pull request triggers the existing site build and publication workflow.

## One-time connections

Add these GitHub Actions secrets in **Settings > Secrets and variables > Actions**:

- `GSC_SERVICE_ACCOUNT_JSON`: the complete Google service-account JSON, either raw or base64 encoded.
- `OPENROUTER_API_KEY`: the OpenRouter API key used for strategy, writing, and native localization.
- `SERPER_API_KEY` (recommended): adds live related searches, People Also Ask questions, and competing-result context. Without it, the system still runs from Search Console and GA4.
- `TELEGRAM_BOT_TOKEN`: the Elira Ops Bot token.
- `TELEGRAM_CHAT_ID`: the owner's Telegram chat id.

Optional repository variable:

- `SEO_MODEL`: an OpenRouter model identifier. The workflow default is `openai/gpt-5.1`.
- `GA4_PROPERTY_ID`: the numeric Elira GA4 property id.
- `SEO_AUTOMATION_ENABLED`: set to `true` only after the first successful manual test. Scheduled runs remain safely disabled until then.

In Search Console, add the service account's `client_email` under **Settings > Users and permissions** with permission to read the `sc-domain:eliraliving.com` property. Add the same email as a Viewer on the Elira GA4 property. Enable both the Search Console API and Google Analytics Data API in that Google Cloud project.

## Safety and quality rules

- No article is published without review.
- An existing open weekly article PR blocks the next run, preventing a backlog and duplicate topic selection.
- Search data informs the topic, but the article must solve a real reader problem.
- The generator must not invent studies, statistics, customer experiences, prices, certifications, or clinical claims.
- Each article has one contextual product link, 3-4 FAQs, Article/FAQ/Breadcrumb schema through the existing build, and automatic links to related articles.
- The topic ledger records why each automated article was selected and the Search Console evidence available at selection time.

## Manual test

Analyze the included Search Console fixture without using APIs:

```powershell
node tools/weekly-seo-article.mjs --fixture tools/fixtures/gsc-sample.json --analyze-only
```

Run a full proposal manually from GitHub under **Actions > Weekly SEO article proposal > Run workflow** after all secrets are connected.
