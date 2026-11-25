(function () {
  const sessionId = new URLSearchParams(location.search).get("session_id");
  if (!sessionId || !/^cs_live_[A-Za-z0-9]+$/.test(sessionId)) return;

  const key = "elira-google-review-optin:" + sessionId;
  try { if (sessionStorage.getItem(key)) return; } catch (_) {}

  fetch("https://elira-checkout.elira-living.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "google-reviews", sessionId })
  })
    .then((response) => response.ok ? response.json() : null)
    .then((order) => {
      if (!order || !order.orderId || !order.email || !order.deliveryCountry || !order.estimatedDeliveryDate) return;

      window.renderOptIn = function () {
        window.gapi.load("surveyoptin", function () {
          window.gapi.surveyoptin.render({
            merchant_id: 5916341725,
            order_id: order.orderId,
            email: order.email,
            delivery_country: order.deliveryCountry,
            estimated_delivery_date: order.estimatedDeliveryDate
          });
          try { sessionStorage.setItem(key, "1"); } catch (_) {}
        });
      };

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      script.async = true;
      document.head.appendChild(script);
    })
    .catch(() => {});
})();
