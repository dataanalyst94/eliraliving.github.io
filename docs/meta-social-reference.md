# Meta / Social Posting — Standing Reference (no secrets here)

## Instagram (Instagram Login API — graph.instagram.com)
- Account: **@eliralivingeu** · type: BUSINESS
- **IG user ID (publishing target):** `17841476184618645`
- App: "Elira Living" → Instagram product "Elira Living-IG", Instagram app ID `1723429655454792`
- Permissions granted (Standard Access): `instagram_business_basic`, `instagram_business_content_publish`
- Token: long-lived (~60 days), Instagram User token (`IGAA…`). Stored as n8n credential only — NOT here.
  - Refresh before expiry: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>`
- Publish flow (2 calls):
  1. `POST https://graph.instagram.com/v21.0/17841476184618645/media` with `image_url` (must be PUBLIC) + `caption` → returns `{id}` (creation id)
  2. `POST https://graph.instagram.com/v21.0/17841476184618645/media_publish` with `creation_id` → publishes
- Rate: ~100 posts / 24h (well above our cadence).

## n8n Instagram poster (BUILT, INACTIVE)
- Workflow: **Elira — Instagram poster**, id `dw8ZukQfdaCXOA4L` (INACTIVE — do not activate until user nods)
- IG credential: `Instagram token` (httpQueryAuth, id `7MAxzdkUXpkRXCpo`)
- Schedule: Mon/Wed/Fri 10:00. Walks `posts.json` queue via workflow static data (`igIndex`), 1 post/run.
- Image host: `https://elira-media.elira-living.workers.dev` (media-worker — deploy pending user OK).
- Manifest: `https://elira-media.elira-living.workers.dev/posts.json` (90 posts, interleaved DE/NL/EN).
- TODO before activating: open Telegram confirm node once, pick existing "Telegram account" credential.
- Activation gate: user wants carousels + videos done first, then a nod.

## Facebook Page (BUILT, INACTIVE)
- Page: **Elira Living**, Page ID `674483282422623`, linked to @eliralivingeu
- Meta App ID `2163778501189430` (secret shared in chat → rotate)
- Page token: **PERMANENT** (never expires), scopes incl. `pages_manage_posts`, `pages_read_engagement`.
  Stored as n8n cred `Facebook Page token` (id `Wh6vzIMqfiRvCdVt`). NOT here.
  - Obtained via: short user token → `fb_exchange_token` (long-lived user) → `me/accounts` (permanent page token). Tool: `tools/fb-page-token.js`.
- Workflow: **Elira — Facebook Page poster** id `BfpbLkhZEVlPmf6q` (INACTIVE). Tue/Sat 12:00,
  walks posts.json, POSTs image+caption to /{page}/photos. Activate on go-live nod.

## Pinterest (BUILT, INACTIVE)
- Account: business · App ID `1580853` · Trial access (enough to post to own boards)
- Board: **"Sensitive Skin Care"** id `1144477392746854109`
- Scopes: boards:read/write, pins:read/write
- Token: 30-day access + 60-day refresh (stored as n8n cred `Pinterest token`, id `NlgyQkVlFPZjxe9m`). NOT here.
  - Refresh: `POST https://api.pinterest.com/v5/oauth/token` Basic auth(app_id:secret), body `grant_type=refresh_token&refresh_token=<rt>` → new access token. ⚠️ access token expires in 30 days — build a refresh job before then, or re-auth.
- Workflow: **Elira — Pinterest poster** id `29w1TGa80DK1tU9l` (INACTIVE). Mon/Thu 11:00, walks a 12-pin SEO queue (embedded), pins product images from the media host with keyword-rich titles/descriptions → eliraliving.com.
- ⚠️ App secret was shared in chat → rotate after go-live.

## ⚠️ Blocker before posting: images need PUBLIC URLs
- IG `image_url` must be a publicly reachable HTTPS URL. Our nano images live locally in
  `marketing/social/nano/post/{en,de,nl}/`. They must be hosted publicly first.
- Plan: push the post images to **Cloudflare R2** (or the existing Worker/site) and reference those URLs
  in the scheduler. captions.json maps caption ↔ image slug.

## Token rotation note
- The IG token was shared in plaintext during setup → rotate after the scheduler is live
  (regenerate from Meta dashboard → API setup with Instagram login → Generate token).
