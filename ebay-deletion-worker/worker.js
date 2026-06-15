/* =========================================================================
   ELIRA LIVING — eBay Marketplace Account Deletion compliance endpoint.

   eBay requires every Production keyset to either opt out or expose an HTTPS
   endpoint for account-deletion/closure notifications. This Worker satisfies it:

   1) GET  ?challenge_code=XYZ
        Validation handshake. Respond with JSON:
          { "challengeResponse": SHA256_hex(challengeCode + verificationToken + endpoint) }
        where `endpoint` is the EXACT URL eBay calls (origin + path, no query).

   2) POST  (account deletion notification)
        Acknowledge with 200. We store no eBay buyer PII keyed by eBay user id in
        a way that needs per-user erasure here, so we simply log + acknowledge.

   Secret: EBAY_VERIFICATION_TOKEN  (wrangler secret put EBAY_VERIFICATION_TOKEN)
   ========================================================================= */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const endpoint = url.origin + url.pathname; // must match the URL registered in eBay
    const token = env.EBAY_VERIFICATION_TOKEN || "";

    if (request.method === "GET") {
      const code = url.searchParams.get("challenge_code");
      if (!code) return new Response("Elira eBay deletion endpoint: OK", { status: 200 });
      const data = code + token + endpoint;
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
      const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
      return new Response(JSON.stringify({ challengeResponse: hex }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        console.log("eBay account-deletion notification:", JSON.stringify(body?.metadata || body?.notification?.notificationId || body || {}));
      } catch (_) { /* still acknowledge */ }
      return new Response(null, { status: 200 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
