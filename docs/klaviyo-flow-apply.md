# Klaviyo flows — apply trilingual (EN/DE/NL) templates

All 7 flow emails now have ready trilingual templates in **Content → Templates**.
Each shows German to German customers, Dutch to Dutch, English to everyone else — automatically,
based on the `Locale` profile property (set by n8n on orders/abandoned-cart).

## How to apply each (one-time, per email)
1. **Content → Templates** → open the matching "(ready)" template → **Edit** → click into the code →
   **Ctrl+A**, **Ctrl+C** (copy all).
2. **Flows** → open the flow → click the email → **Edit** → switch to **HTML/code** view →
   **Ctrl+A**, paste, **Save**.
3. Paste the matching **subject** + **preview text** below into that email's fields.

| Flow | Email | Ready template |
|---|---|---|
| Abandoned Cart | Email #1 | Abandoned Cart — EN/DE/NL (ready) ✅ done |
| Welcome Email | Email #1 WELCOME | Welcome #1 — EN/DE/NL (ready) |
| Welcome Email | Email #2 Day 2 | Welcome #2 — EN/DE/NL (ready) |
| Welcome Email | Email #3 Day 5 | Welcome #3 — EN/DE/NL (ready) |
| Post Purchase | Email #1 | Post Purchase #1 — EN/DE/NL (ready) |
| Post Purchase | Email #2 | Post Purchase #2 & #3 — EN/DE/NL (ready) |
| Post Purchase | Email #3 | Post Purchase #2 & #3 — EN/DE/NL (ready) |

---

## Subject + preview text (paste into each email's fields)

### Abandoned Cart — Email #1  *(already applied)*
Subject:
`{% if person.Locale == 'de' %}Du hast etwas vergessen 🌿{% elif person.Locale == 'nl' %}Je bent iets vergeten 🌿{% else %}You left something behind 🌿{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Dein Warenkorb ist gespeichert – mach einfach weiter.{% elif person.Locale == 'nl' %}Je mandje is bewaard – ga verder waar je was.{% else %}Your cart is saved — pick up where you left off.{% endif %}`

### Welcome — Email #1
Subject:
`{% if person.Locale == 'de' %}Willkommen bei Elira Living 🌿{% elif person.Locale == 'nl' %}Welkom bij Elira Living 🌿{% else %}Welcome to Elira Living 🌿{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Dein 10%-Willkommenscode ist drin.{% elif person.Locale == 'nl' %}Je welkomstcode van 10% zit erin.{% else %}Your 10% welcome code is inside.{% endif %}`

### Welcome — Email #2 (Day 2)
Subject:
`{% if person.Locale == 'de' %}Was "sauber" bei Elira wirklich bedeutet{% elif person.Locale == 'nl' %}Wat "clean" echt betekent bij Elira{% else %}What "clean" really means at Elira{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Vegan, parfümfrei, zertifiziert – kein Greenwashing.{% elif person.Locale == 'nl' %}Veganistisch, parfumvrij, gecertificeerd – geen greenwashing.{% else %}Vegan, fragrance-free, certified — no greenwashing.{% endif %}`

### Welcome — Email #3 (Day 5)
Subject:
`{% if person.Locale == 'de' %}Wo du mit Elira anfängst{% elif person.Locale == 'nl' %}Waar je begint met Elira{% else %}Where to start with Elira{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Neu bei Naturkosmetik? Ein einfacher Anfang.{% elif person.Locale == 'nl' %}Nieuw bij natuurlijke verzorging? Een simpel begin.{% else %}New to natural skincare? A simple place to start.{% endif %}`

### Post Purchase — Email #1
Subject:
`{% if person.Locale == 'de' %}Danke für deine Bestellung 🌿{% elif person.Locale == 'nl' %}Bedankt voor je bestelling 🌿{% else %}Thank you for your order 🌿{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Deine Bestellung ist unterwegs – so holst du das Beste heraus.{% elif person.Locale == 'nl' %}Je bestelling is onderweg – zo haal je er het meeste uit.{% else %}Your order is on its way — here's how to get the best from it.{% endif %}`

### Post Purchase — Email #2 and Email #3 (same)
Subject:
`{% if person.Locale == 'de' %}Wie fühlt sich deine Haut an?{% elif person.Locale == 'nl' %}Hoe voelt je huid?{% else %}How's your skin feeling?{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Zwei Minuten – und ein Dankeschön für dich.{% elif person.Locale == 'nl' %}Twee minuten – en een bedankje voor jou.{% else %}Two minutes — and a thank-you inside.{% endif %}`

---

### Browse Abandonment — NEW flow (create it)
Template ready: **"Browse Abandonment — EN/DE/NL (ready)"**. This flow doesn't exist yet — create it:
1. Klaviyo → **Flows → Create flow → Browse Abandonment** (or blank flow, trigger = **Viewed Product**).
2. Recommended: add a **time delay** (~4 h) and a flow filter "**has not** Placed Order since starting" so buyers don't get it.
3. Add an email → paste the "Browse Abandonment — EN/DE/NL (ready)" HTML → set subject/preview below.
4. Onsite tracking already fires Viewed Product (consent-gated), so the trigger works once live.

Subject:
`{% if person.Locale == 'de' %}Noch am Überlegen? 🌿{% elif person.Locale == 'nl' %}Twijfel je nog? 🌿{% else %}Still thinking it over? 🌿{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Die Produkte, die dir gefallen haben, sind gespeichert.{% elif person.Locale == 'nl' %}De producten die je bekeek, staan voor je klaar.{% else %}The products you viewed are saved for you.{% endif %}`

---

### Shipped notification — NEW flow (create it)
Template ready: **"Shipped — EN/DE/NL (ready)"**. Closes the fulfilment loop.
1. Klaviyo → **Flows → Create flow → blank → trigger = metric "Fulfilled Order"**.
2. Add an email → paste "Shipped — EN/DE/NL (ready)" → set subject/preview below.
   The "track your parcel" button uses `{{ event.Tracking }}` automatically.

Subject:
`{% if person.Locale == 'de' %}Deine Bestellung ist unterwegs 🌿{% elif person.Locale == 'nl' %}Je bestelling is onderweg 🌿{% else %}Your order is on its way 🌿{% endif %}`
Preview:
`{% if person.Locale == 'de' %}Gute Nachrichten – verfolge dein Paket hier.{% elif person.Locale == 'nl' %}Goed nieuws – volg je pakket hier.{% else %}Good news — track your parcel here.{% endif %}`

**How fulfilment works now (semi-automated):**
1. Order arrives → Notion **Orders** row created automatically.
2. You fulfil via selfnamed, then in the Notion row: paste the **Tracking** URL and set **Fulfilment → Shipped**.
3. Within 15 min, n8n ("Shipped notify") sends the customer the **Shipped** email in their language with the tracking link, and ticks **Notified**.
   (Emails only start once you've created the "Fulfilled Order" flow above.)

---

## Language routing — what's automatic vs. what's pending
- **Abandoned Cart + Post Purchase:** `Locale` is set automatically by n8n from the shipping country
  (DE→de, NL→nl, else en). ✅ Works now.
- **Welcome:** depends on knowing the subscriber's language **at signup**. Until the signup form passes
  a language, welcome emails fall back to **English**. To enable DE/NL welcome routing, the newsletter
  signup needs to set `Locale` (small site tweak — pending). ⏳

## Testing
- See any language instantly: open a "(ready)" template → **Preview** → pick profile
  `de-preview@eliraliving.com` (German) / `nl-preview@eliraliving.com` (Dutch).
