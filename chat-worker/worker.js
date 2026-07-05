/* =========================================================================
   ELIRA LIVING — live-chat relay ("talk to a human" behind Eli).
   Bridges the on-site Eli widget and the founder's Telegram, using only
   free infrastructure (Workers free tier + KV + Telegram Bot API).

   Flow:
     visitor → POST /send            → Telegram message to the founder
     founder → replies in Telegram   → POST /hook/<secret> (Telegram webhook)
                                       → reply stored in KV under the session
     widget  → GET /poll?session=…   → returns queued replies (then deletes)

   Founder replies by using Telegram's REPLY function on the visitor's
   message (the session tag #ab12cd34 in that message routes it), or by
   starting a message with the tag manually: "#ab12cd34 your answer".

   Secrets: TG_TOKEN (from @BotFather), WEBHOOK_SECRET (random string).
   The founder's chat id is captured automatically the first time they
   send /start to the bot — no manual configuration.
   Until TG_TOKEN is set, /send answers 503 and the widget falls back to
   the email contact answer, so the site never breaks.
   ========================================================================= */

const ALLOW_ORIGINS = [
  "https://www.eliraliving.com",
  "https://eliraliving.com",
  "http://localhost:8137",
];

const cors = (origin) => ({
  "Access-Control-Allow-Origin": ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0],
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
});

const ok = (data, origin) => new Response(JSON.stringify(data), { headers: cors(origin) });
const err = (status, msg, origin) => new Response(JSON.stringify({ error: msg }), { status, headers: cors(origin) });

const SESSION_RE = /^[a-z0-9]{8,24}$/;
const TAG_RE = /#([a-z0-9]{8,24})/;
const REPLY_TTL = 6 * 60 * 60;   // replies wait up to 6h for the widget to pick them up
const RATE_MAX = 8;              // visitor messages per session per minute

async function tg(env, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json().catch(() => ({}));
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";

    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    /* ---- visitor sends a message ------------------------------------- */
    if (req.method === "POST" && url.pathname === "/send") {
      if (!env.TG_TOKEN) return err(503, "unconfigured", origin);
      const founder = await env.CHAT.get("founder");
      if (!founder) return err(503, "unconfigured", origin);

      let body;
      try { body = await req.json(); } catch (e) { return err(400, "bad json", origin); }
      const session = String(body.session || "");
      const text = String(body.text || "").trim().slice(0, 600);
      const lang = String(body.lang || "?").slice(0, 5);
      const page = String(body.page || "").slice(0, 120);
      if (!SESSION_RE.test(session) || !text) return err(400, "bad input", origin);

      // Light per-session rate limit (KV minute bucket).
      const bucket = `rl:${session}:${Math.floor(Date.now() / 60000)}`;
      const used = parseInt((await env.CHAT.get(bucket)) || "0", 10);
      if (used >= RATE_MAX) return err(429, "slow down", origin);
      await env.CHAT.put(bucket, String(used + 1), { expirationTtl: 120 });

      const head = `💬 #${session} (${lang}) ${page}`;
      const res = await tg(env, "sendMessage", { chat_id: founder, text: `${head}\n\n${text}` });
      if (!res.ok) return err(502, "telegram failed", origin);
      return ok({ sent: true }, origin);
    }

    /* ---- widget polls for founder replies ----------------------------- */
    if (req.method === "GET" && url.pathname === "/poll") {
      const session = url.searchParams.get("session") || "";
      if (!SESSION_RE.test(session)) return err(400, "bad session", origin);
      const key = `s:${session}`;
      const raw = await env.CHAT.get(key);
      if (!raw) return ok({ messages: [] }, origin);
      await env.CHAT.delete(key);
      let messages = [];
      try { messages = JSON.parse(raw); } catch (e) { /* corrupted → drop */ }
      return ok({ messages }, origin);
    }

    /* ---- Telegram webhook (founder side) ------------------------------ */
    if (req.method === "POST" && url.pathname === `/hook/${env.WEBHOOK_SECRET}`) {
      const update = await req.json().catch(() => null);
      const msg = update && update.message;
      if (!msg || !msg.text) return new Response("ok");
      const from = String(msg.chat.id);
      const founder = await env.CHAT.get("founder");

      // First contact: /start from the (not yet known) founder claims the bot.
      if (!founder) {
        if (/^\/start/.test(msg.text)) {
          await env.CHAT.put("founder", from);
          await tg(env, "sendMessage", { chat_id: from, text: "✅ Eli live chat connected. Customer messages will arrive here — just REPLY to a message to answer, and your reply appears in their chat on the website." });
        }
        return new Response("ok");
      }
      if (from !== founder) return new Response("ok"); // ignore strangers

      // Route the reply to a session: Telegram reply-to (preferred) or leading #tag.
      let session = null;
      const repliedText = msg.reply_to_message && msg.reply_to_message.text || "";
      const m1 = repliedText.match(TAG_RE);
      const m2 = msg.text.match(/^#([a-z0-9]{8,24})\s+/);
      if (m1) session = m1[1];
      else if (m2) session = m2[1];

      if (!session) {
        await tg(env, "sendMessage", { chat_id: from, text: "ℹ️ To answer a customer, use Telegram's REPLY on their message (or start yours with their #tag)." });
        return new Response("ok");
      }

      const text = msg.text.replace(/^#[a-z0-9]{8,24}\s+/, "").slice(0, 1000);
      const key = `s:${session}`;
      let queue = [];
      try { queue = JSON.parse((await env.CHAT.get(key)) || "[]"); } catch (e) {}
      queue.push(text);
      await env.CHAT.put(key, JSON.stringify(queue), { expirationTtl: REPLY_TTL });
      return new Response("ok");
    }

    return err(404, "not found", origin);
  },
};
