/* =========================================================================
   ELIRA LIVING — Analytics configuration (THE place to paste your IDs).
   After editing, rebuild:  node build.js
   ---------------------------------------------------------------------------
   "fire" controls WHERE each platform's tags fire:
     "direct" → fired by the site (works immediately, no GTM tag needed)
     "gtm"    → you've built the tag inside GTM; the site stays silent for it
                (switch to "gtm" once you create that platform's tags in GTM,
                 to avoid double-counting). The dataLayer always pushes either way.
   ========================================================================= */
(function (root, factory) {
  const d = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = d;
  if (typeof window !== "undefined") window.ELIRA_TRACKING = d;
})(this, function () {
  return {
    GTM_ID: "GTM-NGL5C9TL",

    // Google Search Console verification. EASIEST: in Search Console add a
    // URL-prefix property for https://www.eliraliving.com and verify via the
    // "Google Analytics" or "Google Tag Manager" method (both already live) —
    // no code change needed. Only paste a token here if you pick the "HTML tag"
    // method instead (the content value only, not the whole <meta> tag).
    GSC_VERIFICATION: "",

    GA4_MEASUREMENT_ID: "G-TCKTDT6E7T",
    META_PIXEL_ID: "2382778145481273",
    TIKTOK_PIXEL_ID: "D8JB7MJC77U2SBB696UG",
    GOOGLE_ADS_ID: "AW-18223383471",
    GOOGLE_ADS_PURCHASE_LABEL: "RwObCOePgrscEK-Hy_FD",

    // Server-side backup (Meta CAPI + GA4 Measurement Protocol)
    TRACKING_ENDPOINT: "https://elira-tracking.elira-living.workers.dev",

    // Klaviyo — PUBLIC values only (safe to ship). The private pk_ key lives
    // ONLY as a Worker secret (KLAVIYO_API_KEY), never here.
    KLAVIYO: {
      SITE_ID: "V2dqim",      // public company / Site ID
      LIST_ID: "WKcxya",      // "Email List" — newsletter signups land here
      REVISION: "2025-01-15"  // Klaviyo API revision pinned for the client endpoint
    },

    fire: { ga4: "direct", meta: "direct", tiktok: "direct", googleAds: "direct" },

    currency: "EUR",
    DEBUG: null                 // null = auto (verbose console on localhost). true/false to force.
  };
});
