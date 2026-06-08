/* =========================================================================
   ELIRA LIVING — Analytics configuration (THE place to paste your IDs).
   After editing, rebuild:  node build.js
   ---------------------------------------------------------------------------
   GTM_ID            → baked into every page (Google Tag Manager loader).
   TRACKING_ENDPOINT → your server-side tracking Worker URL (Meta CAPI + GA4 MP).
   The pixel IDs themselves (GA4, Meta, TikTok, Google Ads) are entered INSIDE
   the GTM UI — see ANALYTICS.md. Server-side keys live in the Worker secrets.
   ========================================================================= */
(function (root, factory) {
  const d = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = d;
  if (typeof window !== "undefined") window.ELIRA_TRACKING = d;
})(this, function () {
  return {
    // ---- REQUIRED for client-side tracking (paste, then `node build.js`) ----
    GTM_ID: "",                 // e.g. "GTM-XXXXXXX"

    // ---- Server-side backup (deploy tracking-worker, then paste its URL) ----
    TRACKING_ENDPOINT: "",      // e.g. "https://elira-tracking.<you>.workers.dev"

    // ---- Behaviour ----------------------------------------------------------
    currency: "EUR",
    DEBUG: null                 // null = auto (verbose console on localhost). true/false to force.
  };
});
