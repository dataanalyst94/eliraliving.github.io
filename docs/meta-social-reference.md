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

## Facebook Page (pending)
- Page: **Elira Living**, Page ID `674483282422623`, linked to @eliralivingeu
- Still need: add `pages_manage_posts` + `pages_read_engagement` in the "Manage everything on your Page" use case, then grab Page token via Graph API Explorer.

## Pinterest (pending — separate app)
- developers.pinterest.com → create app → get token. Build as second n8n workflow.

## ⚠️ Blocker before posting: images need PUBLIC URLs
- IG `image_url` must be a publicly reachable HTTPS URL. Our nano images live locally in
  `marketing/social/nano/post/{en,de,nl}/`. They must be hosted publicly first.
- Plan: push the post images to **Cloudflare R2** (or the existing Worker/site) and reference those URLs
  in the scheduler. captions.json maps caption ↔ image slug.

## Token rotation note
- The IG token was shared in plaintext during setup → rotate after the scheduler is live
  (regenerate from Meta dashboard → API setup with Instagram login → Generate token).
