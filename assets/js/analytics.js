/* =========================================================================
   ELIRA LIVING — Analytics layer.
   • Pushes GA4 e-commerce events to dataLayer (for GTM).
   • Fires GA4 + Meta Pixel + TikTok Pixel + Google Ads DIRECTLY when each
     platform's `fire` mode is "direct" (works without GTM tag config).
   • Mirrors events to the server-side Worker (Meta CAPI + GA4 MP).
   • Shared event_id de-duplicates browser pixel ↔ server events.
   • GDPR: Consent Mode v2 default DENIED. Meta/TikTok load only after ads
     consent. Call EliraConsent.update({analytics:true, ads:true}) from a CMP.
     On localhost (DEBUG) consent is auto-granted for testing.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.ELIRA_TRACKING || {};
  const CAT = window.CATALOG, C = window.CONTENT, LANG = window.LANG || "en";
  const CUR = CFG.currency || "EUR";
  const FIRE = CFG.fire || {};
  const KLAVIYO = CFG.KLAVIYO || null;
  const DEBUG = (CFG.DEBUG === null || CFG.DEBUG === undefined)
    ? /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) : !!CFG.DEBUG;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  const dl = (o) => window.dataLayer.push(o);
  const log = (...a) => { if (DEBUG) console.log("%c[Elira Analytics]", "color:#C8A24E;font-weight:bold", ...a); };
  const uuid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID()
    : "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  const cookie = (n) => { const m = document.cookie.match("(^|;)\\s*" + n + "\\s*=\\s*([^;]+)"); return m ? m.pop() : ""; };
  const gaClientId = () => { const m = cookie("_ga"); return m ? m.split(".").slice(-2).join(".") : ""; };
  const loadScript = (src, cb) => { const s = document.createElement("script"); s.async = true; s.src = src; if (cb) s.onload = cb; document.head.appendChild(s); return s; };

  /* ---- platform loaders (idempotent) ---------------------------------- */
  const loaded = { ga4: false, ads: false, meta: false, tiktok: false, klaviyo: false };

  function loadGoogle() {
    if (loaded.ga4) return;
    const id = CFG.GA4_MEASUREMENT_ID, ads = CFG.GOOGLE_ADS_ID;
    if (FIRE.ga4 !== "direct" && FIRE.googleAds !== "direct") return;
    if (!id && !ads) return;
    loaded.ga4 = true;
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + (id || ads));
    gtag("js", new Date());
    if (id && FIRE.ga4 === "direct") gtag("config", id);                 // GA4
    if (ads && FIRE.googleAds === "direct") gtag("config", ads);          // Google Ads
    log("Google tag loaded", id, ads);
  }
  function loadMeta() {
    if (loaded.meta || FIRE.meta !== "direct" || !CFG.META_PIXEL_ID) return;
    loaded.meta = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CFG.META_PIXEL_ID);
    window.fbq("track", "PageView");
    log("Meta Pixel loaded", CFG.META_PIXEL_ID);
  }
  function loadTikTok() {
    if (loaded.tiktok || FIRE.tiktok !== "direct" || !CFG.TIKTOK_PIXEL_ID) return;
    loaded.tiktok = true;
    !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"]; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e }; ttq.load = function (e, n) { var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {}; n = document.createElement("script"); n.type = "text/javascript"; n.async = !0; n.src = r + "?sdkid=" + e + "&lib=" + t; e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e) }; ttq.load(CFG.TIKTOK_PIXEL_ID); ttq.page(); }(window, document, "ttq");
    log("TikTok Pixel loaded", CFG.TIKTOK_PIXEL_ID);
  }
  function loadAdPixels() { loadMeta(); loadTikTok(); }
  // Klaviyo onsite tracking (cookie-based → consent-gated). Enables anonymous
  // "Started Checkout" + later identity-stitching for the abandoned-cart flow.
  function loadKlaviyo() {
    if (loaded.klaviyo || !KLAVIYO || !KLAVIYO.SITE_ID) return;
    loaded.klaviyo = true;
    window.klaviyo = window.klaviyo || [];
    loadScript("https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=" + encodeURIComponent(KLAVIYO.SITE_ID));
    log("Klaviyo onsite loaded", KLAVIYO.SITE_ID);
  }

  /* ---- Consent Mode v2 ------------------------------------------------- */
  const CONSENT_VERSION = 1;
  const Consent = {
    update(state, persist) {
      const s = state || {};
      gtag("consent", "update", {
        analytics_storage: s.analytics ? "granted" : "denied",
        ad_storage: s.ads ? "granted" : "denied",
        ad_user_data: s.ads ? "granted" : "denied",
        ad_personalization: s.ads ? "granted" : "denied"
      });
      if (persist !== false) { try { localStorage.setItem("elira_consent", JSON.stringify({ analytics: !!s.analytics, ads: !!s.ads, v: CONSENT_VERSION, ts: Date.now() })); } catch (e) {} }
      if (s.analytics) loadGoogle();
      if (s.ads) loadAdPixels();
      if (s.analytics || s.ads) loadKlaviyo();
      log("consent updated", s, persist === false ? "(not persisted)" : "");
    },
    saved() { try { const s = JSON.parse(localStorage.getItem("elira_consent")); return (s && s.v === CONSENT_VERSION) ? s : null; } catch (e) { return null; } },
    load() {
      loadGoogle(); // Google tag uses Consent Mode (safe to load; cookies gated by consent)
      if (DEBUG) { this.update({ analytics: true, ads: true }, false); return; } // grant for dev, but keep the banner visible
      const s = this.saved(); if (s) this.update(s, false);
    },
    open() { /* replaced by the consent banner once loaded */ }
  };
  window.EliraConsent = Consent;

  /* ---- item helpers --------------------------------------------------- */
  const product = (id) => CAT ? CAT.getProduct(id) : null;
  const pname = (id) => (C && C.products[id] && C.products[id].name) || id;
  const catLabel = (p) => (C && C.ui["cat." + p.category]) || p.category;
  function item(id, qty) {
    const p = product(id); if (!p) return { item_id: id, quantity: qty || 1 };
    return { item_id: p.sku || p.id, item_name: pname(id), item_category: catLabel(p), price: +(p.price / 100).toFixed(2), quantity: qty || 1 };
  }
  const valueOf = (items) => +items.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0).toFixed(2);
  const contentIds = (items) => items.map(i => i.item_id);
  const metaContents = (items) => items.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price }));
  const ttContents = (items) => items.map(i => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity, price: i.price }));

  /* ---- platform fire -------------------------------------------------- */
  function fireGA4(name, value, items, txid) {
    if (FIRE.ga4 !== "direct" || !window.gtag || !CFG.GA4_MEASUREMENT_ID) return;
    const params = { currency: CUR, value: value, items: items, send_to: CFG.GA4_MEASUREMENT_ID };
    if (txid) params.transaction_id = txid;
    window.gtag("event", name, params);
  }
  function fireMeta(metaName, value, items, eventId) {
    if (FIRE.meta !== "direct" || !window.fbq) return;
    window.fbq("track", metaName, { value: value, currency: CUR, content_type: "product", content_ids: contentIds(items), contents: metaContents(items), content_name: items.map(i => i.item_name).join(", ") }, { eventID: eventId });
  }
  function fireTikTok(ttName, value, items) {
    if (FIRE.tiktok !== "direct" || !window.ttq) return;
    window.ttq.track(ttName, { value: value, currency: CUR, content_type: "product", contents: ttContents(items) });
  }
  function fireAdsConversion(value, txid) {
    if (FIRE.googleAds !== "direct" || !window.gtag || !CFG.GOOGLE_ADS_ID || !CFG.GOOGLE_ADS_PURCHASE_LABEL) return;
    window.gtag("event", "conversion", { send_to: CFG.GOOGLE_ADS_ID + "/" + CFG.GOOGLE_ADS_PURCHASE_LABEL, value: value, currency: CUR, transaction_id: txid || "" });
  }

  /* ---- dataLayer (GTM) ------------------------------------------------- */
  function ecom(event, items, value, extra) {
    dl({ ecommerce: null });
    const eid = (extra && extra.event_id) || uuid();
    dl({ event, ecommerce: Object.assign({ currency: CUR, value, items }, extra || {}), event_id: eid });
    log(event, { value, items, event_id: eid });
    return eid;
  }

  /* ---- server mirror (Meta CAPI + GA4 MP via Worker) ----------------- */
  function server(name, eventId, value, items, extra) {
    if (!CFG.TRACKING_ENDPOINT) return;
    const body = Object.assign({
      event_name: name, event_id: eventId, event_time: Math.floor(Date.now() / 1000),
      event_source_url: location.href, currency: CUR, value,
      contents: metaContents(items), content_ids: contentIds(items), content_name: items.map(i => i.item_name).join(", "),
      client_id: gaClientId(), fbp: cookie("_fbp"), fbc: cookie("_fbc"), language: LANG
    }, extra || {});
    try { fetch(CFG.TRACKING_ENDPOINT.replace(/\/$/, "") + "/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).then(() => log("→ server", name)).catch(() => {}); } catch (e) {}
  }

  const NAMES = {
    view_item: { meta: "ViewContent", tt: "ViewContent" },
    add_to_cart: { meta: "AddToCart", tt: "AddToCart" },
    begin_checkout: { meta: "InitiateCheckout", tt: "InitiateCheckout" },
    purchase: { meta: "Purchase", tt: "CompletePayment" }
  };

  function track(ga4Event, items, value, extra) {
    const eid = ecom(ga4Event, items, value, extra);
    const txid = extra && extra.transaction_id;
    fireGA4(ga4Event, value, items, txid);
    fireMeta(NAMES[ga4Event].meta, value, items, eid);
    fireTikTok(NAMES[ga4Event].tt, value, items);
    if (ga4Event === "purchase") fireAdsConversion(value, txid);
    server(NAMES[ga4Event].meta, eid, value, items, txid ? { transaction_id: txid } : null);
    return eid;
  }

  /* ---- Klaviyo "Started Checkout" (abandoned-cart trigger) ------------ */
  function klaviyoCartProps(cartItems, valueCents) {
    const origin = location.origin, v = +(valueCents / 100).toFixed(2);
    const items = (cartItems || []).map(i => {
      const p = product(i.id) || {};
      return {
        product_name: i.name || pname(i.id),
        quantity: i.qty || 1,
        price: ((i.unitPrice || 0) / 100).toFixed(2),
        url: origin + "/" + LANG + "/products/" + i.id + ".html",
        image_url: p.image ? origin + p.image : ""
      };
    });
    return { "$value": v, value: v, CheckoutURL: origin + "/" + LANG + "/cart.html", ItemNames: items.map(i => i.product_name), items: items };
  }
  function klaviyoTrack(metric, props, email) {
    if (!KLAVIYO || !KLAVIYO.SITE_ID) return;
    // Onsite (anonymous, cookie-stitched) — fires only if consent loaded klaviyo.js
    if (window.klaviyo && typeof window.klaviyo.push === "function") {
      if (email) window.klaviyo.push(["identify", { "$email": email }]);
      window.klaviyo.push(["track", metric, props]);
    }
    // With a volunteered email, also send via the public client API so the event
    // reliably attaches to that profile (works even without cookie consent).
    if (email) {
      const body = { data: { type: "event", attributes: {
        metric: { data: { type: "metric", attributes: { name: metric } } },
        profile: { data: { type: "profile", attributes: { email: email } } },
        value: props.value, properties: props
      } } };
      try {
        fetch("https://a.klaviyo.com/client/events/?company_id=" + encodeURIComponent(KLAVIYO.SITE_ID), {
          method: "POST", headers: { "Content-Type": "application/json", revision: KLAVIYO.REVISION || "2025-01-15" },
          body: JSON.stringify(body), keepalive: true
        }).catch(() => {});
      } catch (e) {}
    }
    log("Klaviyo", metric, email ? "(email)" : "(onsite)");
  }

  /* ---- public API ----------------------------------------------------- */
  const A = {
    viewItem(id) { const it = [item(id, 1)]; track("view_item", it, valueOf(it)); },
    addToCart(id, qty) { const it = [item(id, qty || 1)]; track("add_to_cart", it, valueOf(it)); },
    beginCheckout(items, value) {
      const eid = track("begin_checkout", items, value);
      try { localStorage.setItem("elira_pending", JSON.stringify({ event_id: eid, items, value, ts: Date.now() })); } catch (e) {}
    },
    // Klaviyo abandoned-cart trigger. cartItems = raw cart lines; valueCents = total in cents.
    startedCheckout(cartItems, valueCents, email) { try { klaviyoTrack("Started Checkout", klaviyoCartProps(cartItems, valueCents), email || ""); } catch (e) {} },
    identifyEmail(email) { try { if (email && window.klaviyo && typeof window.klaviyo.push === "function") window.klaviyo.push(["identify", { "$email": email }]); } catch (e) {} },
    purchase(transactionId, items, value) { track("purchase", items, value, { transaction_id: transactionId, event_id: transactionId }); }
  };
  window.EliraAnalytics = A;

  /* ---- auto-fire per page --------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    Consent.load();
    if (window.ELIRA_PAGE && window.ELIRA_PAGE.type === "product") A.viewItem(window.ELIRA_PAGE.id);
    if (document.body.getAttribute("data-page") === "success") {
      let pending = null; try { pending = JSON.parse(localStorage.getItem("elira_pending")); } catch (e) {}
      const sid = new URLSearchParams(location.search).get("session_id");
      if (pending && pending.items) { A.purchase(sid || pending.event_id, pending.items, pending.value); try { localStorage.removeItem("elira_pending"); } catch (e) {} }
      else log("success: no pending purchase snapshot");
    }
  });

  log("loaded · DEBUG=" + DEBUG + " · GTM=" + (CFG.GTM_ID || "(off)") + " · fire=" + JSON.stringify(FIRE) + " · server=" + (CFG.TRACKING_ENDPOINT || "(off)"));
})();
