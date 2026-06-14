/* Exchange a short-lived FB user token for a long-lived one, then extract the
   permanent Page token. Run: FB_USER_TOKEN=... node tools/fb-page-token.js */
const APP = "2163778501189430", SEC = "7bd7d3c9369ac43cb245e8568a647211";
const U = process.env.FB_USER_TOKEN;
const PAGE_ID = "674483282422623";
(async () => {
  const ex = await (await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP}&client_secret=${SEC}&fb_exchange_token=${U}`)).json();
  if (!ex.access_token) { console.log("exchange failed:", JSON.stringify(ex)); process.exit(1); }
  console.log("✓ long-lived user token obtained");
  const acc = await (await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,id,access_token&access_token=${ex.access_token}`)).json();
  if (!acc.data) { console.log("me/accounts failed:", JSON.stringify(acc)); process.exit(1); }
  const pg = acc.data.find(p => p.id === PAGE_ID) || acc.data[0];
  console.log("✓ Page:", pg.name, `(${pg.id})`);
  const dbg = await (await fetch(`https://graph.facebook.com/debug_token?input_token=${pg.access_token}&access_token=${APP}|${SEC}`)).json();
  console.log("  page token expires:", dbg.data.expires_at === 0 ? "NEVER (permanent) ✓" : new Date(dbg.data.expires_at * 1000).toISOString());
  require("fs").writeFileSync(require("path").join(require("os").tmpdir(), "fbpagetoken.txt"), pg.access_token);
  console.log("  PAGE_TOKEN:", pg.access_token.slice(0, 20) + "…(saved to temp)");
})();
