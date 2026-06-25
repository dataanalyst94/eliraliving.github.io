#!/usr/bin/env python3
# Elira Living — outreach email sender (Zoho SMTP).
# Reads credentials from infra/email/zoho.local.json (gitignored) or env
# (ZOHO_USER, ZOHO_APP_PASSWORD, ZOHO_FROM, ZOHO_FROM_NAME, ZOHO_HOST, ZOHO_PORT).
# Sends ONE email. Used for Lane-2/Lane-3 backlink outreach from support@eliraliving.com.
#
# Usage:
#   python tools/send-email.py --to NAME@site.com --subject "..." --body-file path.txt
#   python tools/send-email.py --to a@b.com --subject "Hi" --body "Inline body" --reply-to x@y.com
#
# SAFETY: this sends a real email to a real person. Only call after the recipient list and
# copy have been approved. One send per invocation; no bulk loop here by design.
import os, sys, json, argparse, smtplib, ssl
from email.message import EmailMessage

def load_cfg():
    here = os.path.dirname(os.path.abspath(__file__))
    cfg = os.path.join(here, "..", "infra", "email", "zoho.local.json")
    d = {}
    if os.path.exists(cfg):
        with open(cfg, encoding="utf-8") as f:
            d = json.load(f)
    return {
        "host": os.environ.get("ZOHO_HOST", d.get("host", "smtp.zoho.eu")),
        "port": int(os.environ.get("ZOHO_PORT", d.get("port", 465))),
        "user": os.environ.get("ZOHO_USER", d.get("user", "")),
        "password": os.environ.get("ZOHO_APP_PASSWORD", d.get("appPassword", "")),
        "from": os.environ.get("ZOHO_FROM", d.get("from", d.get("user", ""))),
        "fromName": os.environ.get("ZOHO_FROM_NAME", d.get("fromName", "Zeerak — Elira Living")),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--to", required=True)
    ap.add_argument("--subject", required=True)
    ap.add_argument("--body")
    ap.add_argument("--body-file")
    ap.add_argument("--reply-to")
    ap.add_argument("--cc")
    a = ap.parse_args()

    body = a.body
    if a.body_file:
        with open(a.body_file, encoding="utf-8") as f:
            body = f.read()
    if not body:
        print("send-email: no body"); sys.exit(2)

    c = load_cfg()
    if not c["user"] or not c["password"]:
        print("send-email: MISSING credentials. Create infra/email/zoho.local.json "
              "with user + appPassword (see .example)."); sys.exit(2)

    msg = EmailMessage()
    msg["From"] = f'{c["fromName"]} <{c["from"]}>'
    msg["To"] = a.to
    if a.cc: msg["Cc"] = a.cc
    if a.reply_to: msg["Reply-To"] = a.reply_to
    msg["Subject"] = a.subject
    msg.set_content(body)

    try:
        ctx = ssl.create_default_context()
        if c["port"] == 465:
            with smtplib.SMTP_SSL(c["host"], c["port"], context=ctx, timeout=30) as s:
                s.login(c["user"], c["password"]); s.send_message(msg)
        else:
            with smtplib.SMTP(c["host"], c["port"], timeout=30) as s:
                s.starttls(context=ctx); s.login(c["user"], c["password"]); s.send_message(msg)
        print(f"send-email: SENT to {a.to}")
        sys.exit(0)
    except Exception as e:
        print("send-email: ERROR", repr(e)); sys.exit(1)

if __name__ == "__main__":
    main()
