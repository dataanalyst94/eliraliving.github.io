# Elira Living — SEO Content Engine (Phase 1)

Generate full, on-brand, trilingual SEO blog posts with the Claude API. Posts are
saved as JSON in `assets/data/blog/`, then `build.js` renders them into static
`/en /de /nl` pages — each with `Article` + `FAQPage` + `BreadcrumbList` JSON-LD,
internal links to the relevant product pages, hreflang, and a sitemap entry.

## How it fits together

```
tools/gen-blog.js  ──writes──▶  assets/data/blog/<slug>.json
                                        │
assets/data/blog-content.js  ──loads──▶ POSTS (newest first) + BLOG_UI labels
                                        │
build.js  ──renders──▶  /en/blog/, /de/blog/, /nl/blog/ + each post page
```

Hand-written seed posts already live in `assets/data/blog/`. The generator just
drops more JSON files — no source files are rewritten.

## One-time setup

```bash
npm install                              # installs @anthropic-ai/sdk
# PowerShell:
$env:ANTHROPIC_API_KEY = "sk-ant-..."
# cmd.exe:
set ANTHROPIC_API_KEY=sk-ant-...
```

Your API key is the **only** input the generator needs from you.

## Generate posts

```bash
# one post
node tools/gen-blog.js "How to layer a vegan skincare routine" --category skincare --related purifying-toner,sensitive-moisturizing-cream

# 20 posts from the ready-made seed list (each becomes EN + DE + NL)
node tools/gen-blog.js --batch tools/blog-topics.json

# preview a post without writing it
node tools/gen-blog.js "Salicylic acid for oily skin" --dry

# then build the site
node build.js
```

## Options

| Flag | Default | Meaning |
|------|---------|---------|
| `--category` | `skincare` | `skincare` or `haircare` (chooses default image + product hints) |
| `--related` | auto from category | comma-separated product ids to internally link |
| `--image` | category image | hero image path under `/assets/img/` |
| `--slug` | from EN title | custom URL slug |
| `--langs` | `en,de,nl` | which languages to generate |
| `--model` | `claude-opus-4-8` | model id (`ELIRA_MODEL` env also works) |
| `--batch` | – | a JSON file of topics (objects or plain strings) |
| `--dry` | off | print result, don't write |
| `--force` | off | overwrite an existing post with the same slug |

## Model & cost

Default is **`claude-opus-4-8`** (best quality). For bulk runs you can trade some
quality for cost:

```bash
node tools/gen-blog.js --batch tools/blog-topics.json --model claude-sonnet-4-6
# or, cheapest:
node tools/gen-blog.js --batch tools/blog-topics.json --model claude-haiku-4-5
```

EN is generated first as structured JSON, then localised (not literally
translated) into native DE and NL keeping the exact body structure and product
links — so all three languages stay in sync.

## Editing posts by hand

Each `assets/data/blog/<slug>.json` is a plain post object. Body block types:
`p`, `h2`, `h3`, `ul`, `ol`, `quote`, and `product` (`{"type":"product","id":"purifying-toner"}`).
Edit a file, then run `node build.js`.
