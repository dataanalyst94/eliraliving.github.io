/* =========================================================================
   Elira Living — Stripe checkout integration.
   Works on free static hosting (GitHub Pages). Two supported modes:

   1) "payment_links"  → No backend needed. Set a Stripe Payment Link per
      product in products.js (paymentLink). Best for launching on Pages today.
      (Single-product checkout; multi-item carts redirect line-by-line or use
      mode 2 for a true combined cart.)

   2) "checkout_session" → Full multi-item cart in ONE checkout. Deploy the
      free Cloudflare Worker in /checkout-worker (see README), then paste its
      URL into `checkoutEndpoint` below. Site stays on GitHub Pages.

   See README.md → "Going live with Stripe".
   ========================================================================= */

const STRIPE_CONFIG = {
  // "payment_links" (no backend) or "checkout_session" (free Worker/serverless)
  mode: "checkout_session",

  // Your serverless endpoint that creates a Checkout Session (mode 2).
  // e.g. "https://elira-checkout.<you>.workers.dev"
  checkoutEndpoint: "https://elira-checkout.elira-living.workers.dev",

  // Optional: publishable key (only needed if you later use stripe.js elements)
  publishableKey: "",

  currency: "eur"
};

async function startCheckout() {
  const items = (window.Cart && Cart.items()) || [];
  if (!items.length) return;

  // --- Mode 2: combined cart via serverless Checkout Session -------------
  if (STRIPE_CONFIG.mode === "checkout_session" && STRIPE_CONFIG.checkoutEndpoint) {
    try {
      Cart.setCheckoutLoading(true);
      const res = await fetch(STRIPE_CONFIG.checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: window.I18nState ? I18nState.lang : "en",
          items: items.map(i => ({
            id: i.id, name: i.name, variant: i.variant,
            amount: i.unitPrice, quantity: i.qty,
            priceId: (getProduct(i.id) || {}).priceId || ""
          })),
          successUrl: location.origin + location.pathname.replace(/[^/]*$/, "") + "success.html",
          cancelUrl: location.origin + location.pathname.replace(/[^/]*$/, "") + "cancel.html"
        })
      });
      if (!res.ok) throw new Error("Checkout endpoint error " + res.status);
      const data = await res.json();
      if (data.url) { location.href = data.url; return; }
      throw new Error("No checkout URL returned");
    } catch (err) {
      console.error(err);
      Cart.setCheckoutLoading(false);
      window.showToast && showToast("Checkout is not configured yet — see README.", 4200);
      return;
    }
  }

  // --- Mode 1: per-product Payment Links (no backend) --------------------
  if (STRIPE_CONFIG.mode === "payment_links") {
    const links = items
      .map(i => (getProduct(i.id) || {}).paymentLink)
      .filter(Boolean);
    if (links.length === 1) { location.href = links[0]; return; }
    if (links.length > 1) {
      // Multiple distinct products: open the first, inform the user.
      window.showToast && showToast("Tip: use a Checkout Session for multi-item carts (see README).", 4200);
      location.href = links[0];
      return;
    }
  }

  // --- Not configured: graceful demo message -----------------------------
  window.showToast && showToast("Demo mode — connect Stripe in stripe.js to take real payments.", 4200);
}

window.STRIPE_CONFIG = STRIPE_CONFIG;
window.startCheckout = startCheckout;
