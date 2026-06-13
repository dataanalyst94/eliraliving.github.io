# Phase A — Stand up free 24/7 n8n on Oracle Cloud

Goal: n8n running forever, free, with your computer off, reachable at
`https://n8n.eliraliving.com`. ~45–60 min, one time. You do the clicks; commands are copy-paste.

---

## 0. What you need first
- A credit/debit card (Oracle uses it for identity check only — Always-Free is never charged).
- Access to your Cloudflare DNS for eliraliving.com (to add one subdomain).
- ~1 hour.

---

## 1. Create the Oracle Cloud account
1. Go to **oracle.com/cloud/free** → *Start for free*.
2. Sign up (pick your Home Region close to the EU, e.g. *Germany Central (Frankfurt)* or *Netherlands NW (Amsterdam)*). **The region can't be changed later.**
3. Verify card. You land in the Oracle Cloud Console.

## 2. Create the server (VM)
1. Console → **Menu ☰ → Compute → Instances → Create instance**.
2. Name: `elira-n8n`.
3. **Image & shape → Edit**:
   - Image: **Canonical Ubuntu 22.04**.
   - Shape: try **Ampere / VM.Standard.A1.Flex** (ARM) with **1 OCPU + 6 GB RAM** (always-free).
     If it says "out of capacity", use **VM.Standard.E2.1.Micro** (AMD, 1 GB) — also always-free; our config runs fine on it with swap (step 5).
4. **Add SSH keys**: choose *Generate a key pair for me* → **download both keys**. Keep the **private** key safe.
5. Leave networking default (it creates a VCN with a public IP). Click **Create**. Wait until *Running*.
6. Copy the instance's **Public IP address**.

## 3. Open the firewall (two layers)
**a) Oracle security list (cloud firewall):**
- Instance page → *Primary VNIC* → click the **subnet** → **Security Lists** → the default list → **Add Ingress Rules**:
  - Rule 1: Source `0.0.0.0/0`, IP Protocol TCP, Dest port **80**.
  - Rule 2: Source `0.0.0.0/0`, IP Protocol TCP, Dest port **443**.

**b) The OS firewall** — done in step 5's commands.

## 4. Point the subdomain at the server (Cloudflare)
1. Cloudflare → eliraliving.com → **DNS → Add record**:
   - Type **A**, Name **n8n**, IPv4 = your VM public IP.
   - **Proxy status: DNS only (grey cloud)** — required so Caddy can issue the TLS cert.
2. Save. (You can switch to proxied/orange later if you want; start grey.)

## 5. Connect and install
From your machine (PowerShell), SSH in (replace path + IP):
```powershell
ssh -i C:\path\to\private-key.key ubuntu@YOUR_VM_IP
```
Then on the server, paste this whole block:
```bash
# system + swap (helps the 1GB micro VM)
sudo apt-get update && sudo apt-get -y upgrade
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# open the OS firewall for web traffic
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```
Log out and back in (`exit`, then SSH again) so docker works without sudo.

## 6. Deploy n8n
On the server:
```bash
mkdir -p ~/n8n && cd ~/n8n
# create the two config files
curl -fsSL https://raw.githubusercontent.com/REPLACE_WITH_YOUR_REPO/main/infra/n8n/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/REPLACE_WITH_YOUR_REPO/main/infra/n8n/Caddyfile -o Caddyfile
```
> If your repo is private, just paste the file contents manually with `nano docker-compose.yml` and `nano Caddyfile` (contents are in `infra/n8n/`).

Create the `.env`:
```bash
cat > .env <<EOF
DOMAIN=n8n.eliraliving.com
TZ=Europe/Helsinki
N8N_ENCRYPTION_KEY=$(openssl rand -hex 24)
EOF
cat .env   # copy the encryption key into your password manager
```
Launch:
```bash
docker compose up -d
docker compose logs -f caddy   # watch it get the TLS cert, then Ctrl-C
```

## 7. First login
- Open **https://n8n.eliraliving.com**.
- n8n asks you to **create the owner account** (your email + a strong password). This is your login — done.

## 8. Create your Telegram control bot (2 min)
1. In Telegram, message **@BotFather** → `/newbot` → name it (e.g. `Elira Ops`) → get the **bot token**.
2. Message your new bot once (say "hi") so it can message you back.
3. Get your **chat id**: open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser → find `"chat":{"id":...}`.
4. Keep the **token** + **chat id** — we'll add them as an n8n credential next.

---

## ✅ Done with Phase A foundation when:
- [ ] `https://n8n.eliraliving.com` loads with a valid padlock
- [ ] You created the n8n owner account
- [ ] Encryption key saved in your password manager
- [ ] Telegram bot token + chat id saved

**Then tell me** — I'll hand you the importable **Orders workflow** and **Daily KPI digest** JSON, and the exact Stripe webhook + Notion steps to finish Phase A.

---

### Notes / honesty
- Oracle reclaims *idle* always-free Ampere VMs; ours runs a 24/7 container so it stays active.
- Keep the server updated monthly: `sudo apt update && sudo apt -y upgrade && docker compose pull && docker compose up -d`.
- If you'd rather not manage a server at all, the Make.com free fallback is in `AUTOMATION-AUDIT.md` — but it caps at 1,000 ops/month.
</content>
