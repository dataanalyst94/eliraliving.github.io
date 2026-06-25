#!/usr/bin/env python3
# Elira Living — Telegram notifier.
# Sends a message to the founder's Telegram via the existing bot.
# Reads credentials from infra/telegram/notify.local.json (gitignored) or env
# TG_BOT_TOKEN / TG_CHAT_ID. Never crashes the caller — prints status and exits 0
# on send, 1 on failure, so automations can call it without aborting on a TG hiccup.
#
# Usage:  python tools/notify-telegram.py "Your message (Markdown ok)"
import os, sys, json

def load_creds():
    tok = os.environ.get("TG_BOT_TOKEN")
    cid = os.environ.get("TG_CHAT_ID")
    if tok and cid:
        return tok, cid
    here = os.path.dirname(os.path.abspath(__file__))
    cfg = os.path.join(here, "..", "infra", "telegram", "notify.local.json")
    with open(cfg, encoding="utf-8") as f:
        d = json.load(f)
    return d["botToken"], d["chatId"]

def send(text):
    import requests
    tok, cid = load_creds()
    r = requests.post(
        f"https://api.telegram.org/bot{tok}/sendMessage",
        json={"chat_id": cid, "text": text, "parse_mode": "Markdown",
              "disable_web_page_preview": False},
        timeout=20,
    )
    return r

if __name__ == "__main__":
    msg = " ".join(sys.argv[1:]).strip() or "(empty notification)"
    try:
        r = send(msg)
        if r.status_code == 200 and r.json().get("ok"):
            print("notify-telegram: sent")
            sys.exit(0)
        print("notify-telegram: FAILED", r.status_code, r.text[:200])
    except Exception as e:
        print("notify-telegram: ERROR", repr(e))
    sys.exit(1)
