# Elira Living — How to edit your website (no developer needed)

Your site rebuilds and republishes itself. To make a change you just edit one
small file **on github.com in your browser** and click **Commit** — about a
minute later it's live on www.eliraliving.com. No installs, no terminal.

> Repository: **github.com/dataanalyst94/eliraliving.github.io**
> Sign in with your GitHub account to edit.

---

## The golden rule
You only ever edit **content/data files**. You never touch the generated pages
(the `.html` files, `sitemap.xml`, etc.) — a robot regenerates those for you
every time you save. After you Commit, watch the **“Actions”** tab in the repo:
a green ✓ means it published successfully.

## The only files you'll edit

| To change… | Edit this file |
|---|---|
| **Prices**, SKUs, product photos, categories, badges | `assets/data/catalog.js` |
| Product **names / descriptions / ingredients** & page wording (English) | `assets/content/en.js` |
| Same, in German | `assets/content/de.js` |
| Same, in Dutch | `assets/content/nl.js` |

Prices are written in **cents**: `1990` = €19.90, `2400` = €24.00.

---

## How to edit a file on github.com
1. Open the repo, click into the file (e.g. `assets/data/catalog.js`).
2. Click the **pencil ✏️ icon** (top-right) to edit.
3. Make your change.
4. Scroll down, click the green **“Commit changes”** button.
5. Wait ~1 minute. Check the **Actions** tab for a green ✓. Done — it's live.

---

## Common tasks

### ① Change a price
1. Edit `assets/data/catalog.js`.
2. Find the product and change its `price:` number (in cents). Example — toner €24 → €26:
   ```js
   id: "purifying-toner",
   ...
   price: 2400,   // change to 2600
   ```
3. Commit. ✅ That's it — the website **and** the Stripe checkout both update
   automatically (the checkout reads the new price within ~5 minutes). You do
   **not** need to touch anything else.

### ② Change a product name or description
1. Edit `assets/content/en.js` (and `de.js` / `nl.js` for the other languages).
2. Find the product under `"products"` and edit `name`, `desc`, or `ingredients`:
   ```js
   "purifying-toner": {
     "name": "Purifying Toner",
     "desc": "A purifying toner that clears pores…",
     ...
   }
   ```
3. Commit each file you changed.

### ③ Swap a product photo
1. In the repo, open the `assets/img/` folder.
2. Upload a new image, or replace one (keep the **same file name** to make it
   easy, e.g. `toner.jpg`). github.com → “Add file → Upload files”.
3. Commit.

### ④ Add a brand-new product (the only multi-step task)
You'll edit a few files; the **`id` must be spelled identically** in all of them.
1. **`assets/data/catalog.js`** — copy an existing product block inside
   `PRODUCTS` and change: `id` (unique, lowercase-with-dashes), `sku`, `price`,
   `category` (`"skincare"` or `"haircare"`), `image`, `featureKeys`.
2. **`assets/content/en.js`, `de.js`, `nl.js`** — add a block under `"products"`
   using the same `id`, with `name`, `desc`, `ingredients`.
3. **`assets/img/`** — upload the product photo and point `image:` at it.
4. Commit everything. The new product appears in the shop, gets its own page,
   sitemap entry, and works in checkout automatically.

> Optional: to give the new product a FAQ / “how to use” section, add it in
> `assets/data/faq-content.js` (same `id`). If you skip this, the page simply
> won't show those extra sections — nothing breaks.

---

## What happens automatically (you don't do these)
- Rebuilding all 100+ pages in English, German & Dutch.
- Updating the sitemap, `llms.txt`, and the prices the checkout charges.
- Publishing to www.eliraliving.com.

## Things that still need a developer / me (rare)
- Changing the **design/layout**, adding a new **page type**, or editing the
  checkout/tracking logic (the `*-worker` folders).
- Adding a **blog post** by hand (or running the blog generator). Blog posts
  live in `assets/data/blog/` as `.json` files — you *can* add one by copying an
  existing file, but it's fiddlier than the tasks above.

## If something looks wrong
- Open the repo's **Actions** tab. A red ✗ means the last build failed (usually
  a typo — e.g. a missing comma or quote in the file you edited). Click the
  failed run to see the error, then fix the file and commit again. The live site
  keeps showing the last good version until a build succeeds.
- Changes not showing? Hard-refresh the page (Ctrl/Cmd+Shift+R) — your browser
  may be caching the old version for a minute.

---

### One-time setup note (already handled, for reference)
The auto-publish robot lives in `.github/workflows/build-site.yml`. The checkout
worker reads prices from `assets/data/prices.json` (auto-generated). After the
worker code was updated to single-source pricing, it was deployed once with
`wrangler deploy` from the `checkout-worker/` folder — you won't need to repeat
that for normal price/content changes.
