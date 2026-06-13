# Email to selfnamed — headless / custom API access inquiry

Sent: ____________   |   Reply received: ____________

**To:** selfnamed support (in-app chat / support@selfnamed.com)
**Subject:** API access for a custom (headless) storefront — order fulfilment integration

---

Hi selfnamed team,

I run a private-label skincare brand (Elira Living, selling into Germany and the
Netherlands) and I source through your dropshipping service. My storefront is a
**custom-built website** — it is **not** on Shopify or WooCommerce — and I'd like to
automate order fulfilment to you without manual dashboard entry.

Could you help me understand my options:

1. **Direct API** — Do you offer a REST API (or similar) that a custom/headless store can
   call directly to **create dropshipping orders** programmatically using my account API
   key? If so, where can I find the API documentation and the base endpoint URLs?

2. **Order payload** — If a direct API exists, what fields are required to create an order
   (product/variant IDs, quantities, customer shipping address, etc.)?

3. **Tracking & status** — Do you provide **webhooks** or an endpoint to pull back order
   status and tracking numbers once an order ships, so I can notify my customer
   automatically?

4. **If no direct API** — Is the only supported automation path your Shopify/WooCommerce
   plugin? Would you recommend I run a headless WooCommerce instance purely as a fulfilment
   bridge, or is there a Zapier/Make/n8n connector I can use instead?

I'm a solo founder keeping volumes modest at first but planning to scale, so I want to set
up the cleanest hands-off fulfilment from the start.

Thanks very much for your help!

Best regards,
[Your name]
Elira Living — eliraliving.com
[Your selfnamed account email]

---

## What to do with each possible answer

- **"Yes, here are the API docs"** → best case. I wire your Stripe webhook (Cloudflare
  Worker or n8n) → selfnamed order-create API → store tracking → Klaviyo "shipped" email.
  Fully hands-off, €0 extra.
- **"Only via the plugins"** → we build the headless WooCommerce bridge (~€5/mo) OR start
  with manual/Cowork fulfilment and add the bridge at volume.
- **"Use Zapier/Make"** → we replicate that flow in n8n (free self-host) in Phase 5.
- **No reply in ~3–4 days** → proceed with the reliability layer + manual/Cowork fulfilment
  so launch isn't blocked; revisit automation later.

---
## Notion board (internal reference)
Database ID: 37ea4815-a826-81cb-9ee9-e60372973062
Parent page: 243a4815-a826-8060-93b6-f2e9a3d90a68
API version: 2022-06-28
(Token is a Notion secret — kept out of the repo. Update tasks via Notion API.)
