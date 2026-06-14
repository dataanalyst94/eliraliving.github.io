# Content Roadmap — Backlog

## Carousels (EN/DE/NL) — PLANNED
Educational carousel posts for Instagram/Facebook. Format: 6-card story arc per product.

**Proposed structure per carousel:**
1. Strong hook card (problem statement or bold claim)
2. Product texture / sensory detail shot
3. Key ingredients — what they do (EU-compliant, no medical claims)
4. Who it's for (skin type / concern)
5. COSMOS NATURAL certification + dermatologically tested badge
6. Offer card — CTA to eliraliving.com + discount or value prop

**Scope:** 6 products × 2 languages (DE + NL) = 12 carousels minimum.
Add EN for full trilingual = 18.
Each card: image (from nano library or new gen) + short copy overlay.

**Build method:** n8n → OpenRouter (Gemini 2.5 Flash) generates card copy per product per language → Canvas/Canva or sharp.js compositor overlays text onto product images.

**Status:** PARKED — build after Meta app is connected and social scheduler is live.

## Video Generation — PLANNED
Short-form product videos (Reels / TikTok style). Parked until carousel pipeline is running.

## Social Scheduler — IN PROGRESS
n8n workflow to post captions + images to Meta (IG + FB) and Pinterest on schedule.
Blocked on: Meta Developer app creation (user action needed — see Meta setup guide below).
Captions ready: `marketing/social/captions.json` (90 entries).
Images ready: `marketing/social/nano/post/{en,de,nl}/`.

## Newsletter Auto-Draft — BUILT, INACTIVE
Workflow id: `WdATieH0NWgfxvcl`. Activate in n8n when ready (~$0.01/run on OpenRouter).
