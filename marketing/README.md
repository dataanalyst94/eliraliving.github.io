# Elira Living — Backlink & PR Toolkit (Phase 4)

Everything you need to start earning backlinks, reviews and press for
eliraliving.com — no paid tools required. Work the playbook below in order.

## What's in here
| File | Use it for |
|---|---|
| `backlink-directories.md` | Curated DE/NL/EU/vegan directories to list the brand in, with a tracking table. Start here. |
| `outreach-templates.md` | Copy-paste email templates (EN/DE/NL): influencer gifting, listicle inclusion, guest posts, broken-link, podcasts. |
| `press-kit.md` | Boilerplate, founder bio, fast facts, story angles (EN/DE/NL) for journalists, directories & author bios. |
| `haro-sources.md` | The "be a source, get quoted, get a link" workflow + where the requests live now (HARO is dead). |
| `../tools/gen-pitch.js` | Claude-API drafter: paste a reporter request → get a quotable response + email. |
| `social/` | (Phase 5) caption packs from `../tools/gen-social.js`. |

## The 30-day playbook (≈30–45 min/day)

**Week 1 — Foundations (citations + trust).**
- Set up Google Business Profile, Bing Places, Trustpilot, LinkedIn & Pinterest business profiles.
- Submit the Tier 1 + Tier 4 directories in `backlink-directories.md` with the **canonical NAP**.
- Evaluate Trusted Shops (paid, but the trust signal that converts DE/NL shoppers).

**Week 2 — Topical authority (vegan/clean-beauty fit).**
- Submit every Tier 2/3 directory (PETA Beauty Without Bunnies, Vegan Society, ProVeg, Vegan.nl, Cruelty-Free Kitty, ECOCERT listing).
- Launch on Product Hunt; create the Crunchbase profile.

**Week 3 — Outreach (links from real sites).**
- Build a list of 20–30 vegan/clean-beauty bloggers & "best vegan skincare" roundups (DE/NL/EN).
- Send gifting + listicle-inclusion emails from `outreach-templates.md`. Personalise every one. Track sends; follow up once after 5 days.

**Week 4 — Digital PR (editorial links).**
- Sign up to Qwoted + Featured + SourceBottle (`haro-sources.md`); set the keyword filters.
- Answer 3–5 relevant queries with `node tools/gen-pitch.js`. Pitch 2–3 guest posts using the new blog articles as proof of writing quality.

**Ongoing.**
- Each new blog post (`tools/gen-blog.js`) is a fresh outreach asset and an internal-link target — pitch it into a roundup.
- Generate a social caption pack per post (`tools/gen-social.js`) to drive social signals.
- Keep the tracking tables current; re-pitch the best prospects monthly.

## Principles
- **Relevance > volume.** Ten vegan/beauty links beat a hundred generic ones.
- **Consistency.** Identical NAP everywhere; canonical URL `https://www.eliraliving.com/`.
- **Earn, don't buy.** No link schemes/PBNs — they're a Google penalty risk. Directories, reviews, gifting, source-requests and guest posts are all white-hat.
- **Honesty.** Disclose gifting (EU/DE/NL law). Never make medical claims.
- **Patience.** A steady, natural pace of new links is the goal — not a spike.

## Quick commands
```bash
# draft a journalist-query response (EN/DE/NL)
node tools/gen-pitch.js "Looking for experts on sensitive-skin routines" --lang en --save

# turn a blog post into platform-ready captions
node tools/gen-social.js --post gentle-routine-for-sensitive-skin

# write more SEO articles to use as outreach assets
node tools/gen-blog.js --batch tools/blog-topics.json --model claude-haiku-4-5
```
