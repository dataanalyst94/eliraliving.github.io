# Elira Living — Full Website Audit & Growth Roadmap
*Prepared as a grounded audit of the live site + codebase, with an expert DTC ecommerce / brand-design critique.*

---

## PART 1 — WHAT'S BUILT (inventory)

### Storefront & design
- Trilingual static site (EN/DE/NL), **114 pages**, generated from a central catalog + per-language content by `build.js`.
- Premium **dark "nature-luxe" design system**: Bodoni Moda + Jost, deep green-black `#0F120D`, cream `#ECE7DB`, gold `#C8A24E`, film-grain texture, GSAP + Lenis motion, backdrop-blur header. Genuinely top-tier visual foundation.
- Pages: Home, Shop (filter + sort), 4 Product pages, About, Ingredients (AIEO), Journal (blog) index + 22 posts, Cart, Success/Cancel, Impressum/Privacy/Terms/Withdrawal.
- Accessibility baseline is strong: `lang` set, all images have `alt`, single H1/page, labelled inputs, button text/aria.

### Commerce
- Cart engine (localStorage), drawer + cart page, free-shipping progress bar, quantity, single size variant.
- **Stripe checkout** via Cloudflare Worker (`elira-checkout`) — server-side re-pricing (tamper-proof), ships DE+NL, free shipping ≥ €39.
- **Single-source pricing**: worker reads `prices.json` (auto-generated from `catalog.js`) — one edit changes display + charge.

### Tracking & analytics
- GTM + GA4 e-commerce dataLayer (view_item → add_to_cart → begin_checkout → purchase), Meta Pixel, TikTok Pixel, Google Ads conversion.
- Server-side worker (`elira-tracking`): Meta CAPI + GA4 Measurement Protocol + Stripe webhook, event_id de-duplication.
- **GDPR**: Consent Mode v2 (default denied), trilingual cookie banner (accept/reject/preferences), pixels load only post-consent.

### Marketing & retention
- **Klaviyo**: newsletter → list subscribe (double opt-in); server-side "Placed Order" (post-purchase) + client "Started Checkout" (abandoned cart) events both LIVE; cart email-capture; 6 designed flow emails (welcome ×3, post-purchase ×2, abandoned cart) with lifestyle imagery.
- **SEO/AIEO**: per-page meta, OG/Twitter, hreflang, JSON-LD (Organization, WebSite, Product, Breadcrumb, FAQPage, BlogPosting), sitemap, `llms.txt`, ingredients page, robots.txt.
- **Content engine**: `tools/gen-blog.js` (22 posts generated via Claude API), `gen-social.js` (captions), `gen-pitch.js` (PR/HARO).
- **Backlink/PR toolkit** (`marketing/`): directory list, outreach templates, press kit, HARO workflow.

### Infrastructure / ops
- **Auto-deploy**: GitHub Action rebuilds + publishes on any content edit (no terminal/Claude needed).
- **MAINTENANCE.md** owner guide for prices/products/copy/images.

### Phase status
| Phase | Status |
|---|---|
| 1 SEO content engine | ✅ live |
| 2 Klaviyo email | ✅ live (flows to be assembled in Klaviyo UI) |
| 4 Backlink/PR toolkit | ✅ built |
| 5 Content/social tools | ✅ core built |
| 6 AIEO | ✅ live |
| **3 n8n ops automation (Railway)** | ⬜ not started (needs accounts) |

### Open owner-side to-dos
Build the 3 Klaviyo flows in the UI · create `WELCOME10`/`THANKYOU10` coupons · add Trustpilot link to review email · rotate the secrets shared in chat · (optional) DE/NL email versions.

---

## PART 2 — WHAT'S LACKING TO BE "BEST OF THE BEST"
*The design foundation is already top ~5%. The gaps are about TRUST, MERCHANDISING, and CONTENT DEPTH — what turns a beautiful site into a high-converting brand.*

### 🔴 P0 — Highest ROI (do first)

**1. Customer reviews & social proof (the single biggest gap).**
There are **zero reviews** anywhere — no star ratings on product pages, no testimonials on the home page, no `aggregateRating` schema (so no star snippets in Google). A first-time visitor gets no third-party validation, which is the #1 conversion lever for a new skincare brand.
→ Integrate a reviews app (Judge.me, Okendo, Stamped, or Trustpilot product reviews). Collect via the **post-purchase review email you already have**, display on PDP + home, and add `aggregateRating`/`review` to Product schema → star snippets in search → higher CTR. This closes a loop that's already half-built.

**2. Product page imagery & merchandising.**
Each PDP has **one image** — no gallery, no zoom, no texture/swatch/model shots — even though you uploaded 14+ toner photos (they're not committed/wired). For cosmetics, imagery *is* the sell.
→ Multi-image gallery + zoom (the catalog already has an `images[]` field — wire it; commit the extra photos). Add macro/texture + in-use shots.

**3. Announcement / USP bar.** The copy already exists in your content (`announce.1–3`: free shipping over €39, climate-neutral delivery, vegan & cruelty-free) but **isn't rendered anywhere**. A sticky top bar with rotating USPs is a proven trust + AOV nudge — and it's a ~30-min build of content you already wrote.

**4. Surface the blog on the home page.** You built a 22-post content engine, but the home page never links to it (no "From the Journal" teaser). That wastes engagement + internal-linking SEO. → Add a 3-latest-posts band on home.

**5. Canonical domain consistency.** Canonicals, hreflang, OG, and sitemap all use the **apex** `eliraliving.com`, but the site serves from **`www.`** — so every canonical is a redirect. → Set `baseUrl` to `https://www.eliraliving.com` and rebuild (one-line change) to consolidate SEO signals cleanly.

### 🟠 P1 — High impact (next)

**6. Average-order-value levers.**
- **Routine bundles / sets** ("The Complete Routine" = cleanser + toner + cream at a small bundle discount). Skincare buyers think in routines; bundles lift AOV and simplify choice.
- **In-cart cross-sell** ("Complete your ritual — add the Scalp Shampoo"). Currently the cart has no upsell.
- **Subscribe & Save / refills** — skincare is consumable & repeat-purchase; a subscribe-and-save option (even a simple "remind me to reorder" via Klaviyo) is the biggest LTV driver you're missing.

**7. Data capture for the personalization you already built.** Newsletter + cart capture collect **email only**, but the emails use `{{ first_name }}` — so every email falls back to a generic greeting. → Add an optional first-name field. Small change, real personalization payoff.

**8. Home-page trust band.** Add a testimonials/reviews section (feeds from P0-1), plus ECOCERT/vegan **certification badge images** (not just text) and, once active, your **social/Instagram** presence.

**9. Footer social + brand presence.** Footer has **no social links** at all. A premium brand needs linked Instagram/TikTok/Pinterest (Pinterest is excellent for beauty SEO/referral). Set up the handles and link them.

**10. Branded 404 page.** A wrong URL currently shows GitHub's default 404 — jarring and off-brand. → Add a styled `404.html`.

### 🟡 P2 — Polish & scale

**11. Brand depth / content.** Short hero **video** loop + a how-to clip; a richer **founder/brand-story page** (About is thin); lifestyle + ingredient-macro photography; press/"as featured in" once earned.
**12. Discovery beyond SEO.** **Google Merchant Center product feed** → free Google Shopping listings + Performance Max eligibility (you have none today). Add GTIN/MPN to products if they have barcodes.
**13. Technical polish.** Web manifest + `apple-touch-icon` (PWA/iOS bookmark); compress the 255 KB hero image and preload the LCP image; re-check Core Web Vitals with the GSAP/Lenis payload on home.
**14. Operations (Phase 3).** Build the n8n automations (order → fulfilment + confirmation, low-stock alert, eBay sync, weekly Monday sales report). A self-serve **returns/exchange** portal as volume grows (today returns are only the legal withdrawal page).
**15. Merchandising signals.** Honest stock/scarcity cues, "bestseller"/"new" badges already exist — extend with "pairs well with," recently-viewed, and a size/format guide.

---

## Suggested sequencing
1. **Reviews system end-to-end** (collect → display → schema) — unlocks the most conversion + SERP CTR.
2. **PDP gallery + announcement bar + blog teaser + canonical fix** — fast, high-visibility wins from assets/copy you already have.
3. **Bundles + in-cart cross-sell + subscribe & save** — the AOV/LTV engine.
4. **First-name capture, footer social, cert badges, branded 404, testimonials band** — trust + polish.
5. **Video, founder story, Merchant feed, Phase 3 ops** — depth + scale.

*Most of P0/P1 I can build autonomously (no new accounts) except: the reviews app (needs an account), social handles, Google Merchant, and Phase 3 (need credentials).*
