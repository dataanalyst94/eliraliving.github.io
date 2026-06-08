/* =========================================================================
   ELIRA LIVING — Analytics layer.
   Pushes GA4 e-commerce events to the dataLayer (consumed by GTM → GA4, Meta
   Pixel, TikTok Pixel, Google Ads) and mirrors purchase/add-to-cart to the
   server-side tracking Worker (Meta CAPI + GA4 MP) with shared event_id dedup.

   Consent Mode v2: marketing/analytics storage default to DENIED. Call
   EliraConsent.update({analytics:true, ads:true}) from your cookie banner.
   On localhost (DEBUG), consent is auto-granted so you can verify events.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.ELIRA_TRACKING || {};
  const CAT = window.CATALOG, C = window.CONTENT, LANG = window.LANG || "en";
  const CURRENCY = CFG.currency || "EUR";
  const DEBUG = CFG.DEBUG === null || CFG.DEBUG === undefined
    ? /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
    : !!CFG.DEBUG;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  const dl = (obj) => window.dataLayer.push(obj);
  const log = (...a) => { if (DEBUG) console.log("%c[Elira Analytics]", "color:#C8A24E;font-weight:bold", ...a); };

  function uuid() {
    return (crypto && crypto.randomUUID) ? crypto.randomUUID()
      : "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  }
  function cookie(name) { const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"); return m ? m.pop() : ""; }
  function gaClientId() { const m = cookie("_ga"); return m ? m.split(".").slice(-2).join(".") : ""; }

  /* ---- Consent Mode v2 ------------------------------------------------- */
  const Consent = {
    update(state) {
      const s = state || {};
      gtag("consent", "update", {
        analytics_storage: s.analytics ? "granted" : "denied",
        ad_storage: s.ads ? "granted" : "denied",
        ad_user_data: s.ads ? "granted" : "denied",
        ad_personalization: s.ads ? "granted" : "denied"
      });
      try { localStorage.setItem("elira_consent", JSON.stringify(s)); } catch (e) {}
      log("consent updated", s);
    },
    load() {
      if (DEBUG) { this.update({ analytics: true, ads: true }); return; }
      try { const s = JSON.parse(localStorage.getItem("elira_consent")); if (s) this.update(s); } catch (e) {}
    }
  };
  window.EliraConsent = Consent;

  /* ---- Item helpers --------------------------------------------------- */
  function product(id) { return CAT ? CAT.getProduct(id) : null; }
  function pname(id) { return (C && C.products[id] && C.products[id].name) || id; }
  function catLabel(p) { return (C && C.ui["cat." + p.category]) || p.category; }
  function item(id, qty) {
    const p = product(id); if (!p) return { item_id: id, quantity: qty || 1 };
    return { item_id: p.sku || p.id, item_name: pname(id), item_category: catLabel(p), price: +(p.price / 100).toFixed(2), quantity: qty || 1 };
  }
  const valueOf = (items) => +items.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0).toFixed(2);

  /* ---- dataLayer push (GA4 ecommerce) --------------------------------- */
  function ecom(event, items, value, extra) {
    dl({ ecommerce: null });                       // clear previous ecommerce object
    const payload = { event, ecommerce: Object.assign({ currency: CURRENCY, value: value, items: items }, extra || {}), event_id: (extra && extra.event_id) || uuid() };
    dl(payload);
    log(event, payload.ecommerce, "event_id=" + payload.event_id);
    return payload.event_id;
  }

  /* ---- Server-side mirror (Meta CAPI + GA4 MP via Worker) ------------- */
  function server(name, eventId, value, items, extra) {
    if (!CFG.TRACKING_ENDPOINT) return;
    const body = {
      event_name: name, event_id: eventId, event_time: Math.floor(Date.now() / 1000),
      event_source_url: location.href, currency: CURRENCY, value: value,
      contents: items.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      content_ids: items.map(i => i.item_id), content_name: items.map(i => i.item_name).join(", "),
      client_id: gaClientId(), fbp: cookie("_fbp"), fbc: cookie("_fbc"),
      language: LANG, page_location: location.href
    };
    Object.assign(body, extra || {});
    try {
      fetch(CFG.TRACKING_ENDPOINT.replace(/\/$/, "") + "/collect", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true
      }).then(() => log("→ server", name, eventId)).catch(() => {});
    } catch (e) {}
  }

  /* ---- Public events -------------------------------------------------- */
  const A = {
    viewItem(id) { const it = [item(id, 1)]; ecom("view_item", it, valueOf(it)); },
    addToCart(id, qty, variant) {
      const it = [item(id, qty || 1)]; const v = valueOf(it);
      const eid = ecom("add_to_cart", it, v);
      server("AddToCart", eid, v, it);
    },
    beginCheckout(items, value) {
      const eid = ecom("begin_checkout", items, value);
      try { localStorage.setItem("elira_pending", JSON.stringify({ event_id: eid, items, value, ts: Date.now() })); } catch (e) {}
      server("InitiateCheckout", eid, value, items);
    },
    purchase(transactionId, items, value) {
      const eid = transactionId || uuid(); // session id doubles as event_id → dedupes with the Worker's Stripe webhook
      ecom("purchase", items, value, { transaction_id: transactionId || eid, event_id: eid });
      server("Purchase", eid, value, items, { transaction_id: transactionId || eid });
    }
  };
  window.EliraAnalytics = A;

  /* ---- Auto-fire per page --------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    Consent.load();
    const page = document.body.getAttribute("data-page");
    if (window.ELIRA_PAGE && window.ELIRA_PAGE.type === "product") A.viewItem(window.ELIRA_PAGE.id);
    if (page === "success") {
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem("elira_pending")); } catch (e) {}
      const sessionId = new URLSearchParams(location.search).get("session_id");
      if (pending && pending.items) {
        A.purchase(sessionId || pending.event_id, pending.items, pending.value);
        try { localStorage.removeItem("elira_pending"); } catch (e) {}
      } else {
        log("success page: no pending purchase snapshot found");
      }
    }
  });

  log("loaded · DEBUG=" + DEBUG + " · GTM=" + (CFG.GTM_ID || "(not set)") + " · server=" + (CFG.TRACKING_ENDPOINT || "(not set)"));
})();
