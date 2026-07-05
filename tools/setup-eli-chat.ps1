# ============================================================================
# Eli live chat — one-time activation. Run AFTER creating the Telegram bot:
#   1. In Telegram, message @BotFather -> /newbot -> pick a name (e.g. "Elira
#      Support") and a username -> copy the token it gives you.
#   2. Run:  powershell -File "C:\Claude Code\elira-living\tools\setup-eli-chat.ps1" -Token "123456:ABC-your-token"
#   3. Open your new bot in Telegram and press START (this claims it as the
#      founder chat — customer messages will arrive there from then on).
# To answer a customer: use Telegram's REPLY on their message. Your reply
# appears inside Eli on the website within ~4 seconds.
# ============================================================================
param([Parameter(Mandatory = $true)][string]$Token)

$proj = "C:\Claude Code\elira-living"
$secretFile = "$proj\infra\eli-chat-webhook.local.secret"
if (-not (Test-Path $secretFile)) { Write-Error "Webhook secret file missing: $secretFile"; exit 1 }
$hook = (Get-Content $secretFile -Raw).Trim()

# 1) Store the bot token as a Worker secret (never written to disk/repo).
Set-Location "$proj\chat-worker"
$Token | npx wrangler secret put TG_TOKEN
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to set TG_TOKEN"; exit 1 }

# 2) Point the bot's webhook at the worker.
$url = "https://elira-chat.elira-living.workers.dev/hook/$hook"
$r = Invoke-RestMethod -Uri "https://api.telegram.org/bot$Token/setWebhook" -Method Post -Body @{ url = $url; drop_pending_updates = "true" }
if (-not $r.ok) { Write-Error "setWebhook failed: $($r | ConvertTo-Json -Compress)"; exit 1 }

Write-Host ""
Write-Host "Eli live chat is ACTIVE." -ForegroundColor Green
Write-Host "Final step: open your bot in Telegram and press START (claims it as your founder chat)."
Write-Host "Then test: open eliraliving.com -> Eli -> 'Contact a human' -> send a message."
