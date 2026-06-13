# Klaviyo email copy — EN / DE / NL

Brand voice: calm, reassuring, proof over adjectives. Promise: **results without irritation**.
Only substantiated claims (Reg. 655/2013). Allowed everywhere: *vegan · cruelty-free · COSMOS Natural · made in the EU*.
Free shipping line: use **only** for the Peptide Anti-Aging Serum (the only free-shipping product) or carts over the free-shipping threshold.

**Klaviyo merge tags used:** `{{ first_name|default:'there' }}`, `{{ event.RecoveryUrl }}` (abandoned cart),
`{{ event.Items }}`, `{{ event.OrderId }}`. Buttons link to `https://www.eliraliving.com/` unless noted.

Tone tip: keep paragraphs short. One clear button per email.

---

# 1) WELCOME flow — trigger: subscribed to Email List

## Email 1 — immediate
**EN**
- Subject: Welcome to Elira Living 🌿
- Preview: Clean skincare that actually respects your skin.
- Body:
  Hi {{ first_name|default:'there' }},
  Welcome — we're so glad you're here.
  Elira Living makes vegan, COSMOS Natural skincare and haircare for people whose skin reacts to everything. The idea is simple: **real results, without the irritation.**
  Every formula is cruelty-free, made in the EU, and free from the things sensitive skin doesn't need.
  Take a look — your skin's calmer routine starts here.
- Button: Shop the range →
- Sign-off: With care, The Elira Living team

**DE**
- Subject: Willkommen bei Elira Living 🌿
- Preview: Klare Hautpflege, die deine Haut wirklich respektiert.
- Body:
  Hallo {{ first_name|default:'du' }},
  willkommen – schön, dass du da bist.
  Elira Living macht vegane, COSMOS-Natural-Haut- und -Haarpflege für alle, deren Haut auf alles reagiert. Die Idee ist einfach: **echte Ergebnisse, ohne Reizungen.**
  Jede Formel ist tierversuchsfrei, in der EU hergestellt und frei von allem, was empfindliche Haut nicht braucht.
  Schau dich um – die ruhigere Routine für deine Haut beginnt hier.
- Button: Zur Kollektion →
- Sign-off: Herzlich, dein Elira-Living-Team

**NL**
- Subject: Welkom bij Elira Living 🌿
- Preview: Pure huidverzorging die je huid écht respecteert.
- Body:
  Hoi {{ first_name|default:'daar' }},
  welkom – fijn dat je er bent.
  Elira Living maakt veganistische, COSMOS Natural huid- en haarverzorging voor mensen met een huid die op alles reageert. Het idee is simpel: **echte resultaten, zonder irritatie.**
  Elke formule is dierproefvrij, gemaakt in de EU en vrij van wat de gevoelige huid niet nodig heeft.
  Kijk gerust rond – de rustigere routine voor je huid begint hier.
- Button: Bekijk de collectie →
- Sign-off: Met zorg, het Elira Living-team

## Email 2 — ~3 days later (the proof)
**EN**
- Subject: Why gentle doesn't mean weak
- Preview: The ingredients doing the quiet work.
- Body:
  Strong actives often come with stinging, redness, peeling. We don't think they should.
  Our serums use proven, plant-based actives — like Hexapeptide-11 and a natural Bidens Pilosa retinol alternative — chosen to visibly smooth and refine **without** the irritation harsher formulas cause.
  Fragrance-free where it matters. Dermatologically tested where it counts.
- Button: See what's inside →

**DE**
- Subject: Warum sanft nicht schwach bedeutet
- Preview: Die Wirkstoffe, die leise arbeiten.
- Body:
  Starke Wirkstoffe bringen oft Brennen, Rötungen, Schuppung mit sich. Wir finden: muss nicht sein.
  Unsere Seren setzen auf bewährte, pflanzliche Wirkstoffe – wie Hexapeptid-11 und eine natürliche Bidens-Pilosa-Retinol-Alternative – die sichtbar glätten und verfeinern, **ohne** die Reizungen aggressiverer Formeln.
  Parfümfrei, wo es zählt. Dermatologisch getestet, wo es wichtig ist.
- Button: Blick in die Formel →

**NL**
- Subject: Waarom zacht niet zwak betekent
- Preview: De ingrediënten die rustig hun werk doen.
- Body:
  Sterke actieve stoffen geven vaak een branderig gevoel, roodheid of vervelling. Wij vinden van niet.
  Onze serums gebruiken bewezen, plantaardige actieve stoffen – zoals Hexapeptide-11 en een natuurlijk Bidens Pilosa retinol-alternatief – die zichtbaar gladmaken en verfijnen, **zonder** de irritatie van hardere formules.
  Parfumvrij waar het telt. Dermatologisch getest waar het ertoe doet.
- Button: Bekijk de formule →

---

# 2) ABANDONED CART flow — trigger: Started Checkout (no Placed Order)

## Email 1 — short delay (0–1h)
**EN**
- Subject: You left something behind 🌿
- Preview: Your cart is saved — pick up where you left off.
- Body:
  Hi {{ first_name|default:'there' }},
  Your skin's calmer routine is one step away. We saved your cart:
  **{{ event.Items }}**
  Vegan, cruelty-free, COSMOS Natural — and ready when you are.
- Button (links to `{{ event.RecoveryUrl }}`): Complete my order →
- PS: Questions about which product suits your skin? Just reply — a real person answers.

**DE**
- Subject: Du hast etwas vergessen 🌿
- Preview: Dein Warenkorb ist gespeichert – mach einfach weiter.
- Body:
  Hallo {{ first_name|default:'du' }},
  die ruhigere Routine für deine Haut ist nur einen Schritt entfernt. Wir haben deinen Warenkorb gespeichert:
  **{{ event.Items }}**
  Vegan, tierversuchsfrei, COSMOS Natural – bereit, wenn du es bist.
- Button (`{{ event.RecoveryUrl }}`): Bestellung abschließen →
- PS: Fragen, welches Produkt zu deiner Haut passt? Antworte einfach – ein echter Mensch antwortet.

**NL**
- Subject: Je bent iets vergeten 🌿
- Preview: Je winkelmandje is bewaard – ga verder waar je was.
- Body:
  Hoi {{ first_name|default:'daar' }},
  de rustigere routine voor je huid is nog één stap weg. We hebben je mandje bewaard:
  **{{ event.Items }}**
  Veganistisch, dierproefvrij, COSMOS Natural – klaar wanneer jij dat bent.
- Button (`{{ event.RecoveryUrl }}`): Bestelling afronden →
- PS: Vragen welk product bij je huid past? Reageer gewoon – een echt mens antwoordt.

## Email 2 — ~22h later (optional gentle nudge)
**EN** — Subject: Still thinking it over? / Body: No pressure — your cart's still here whenever you're ready. Vegan, gentle, made in the EU. / Button (`{{ event.RecoveryUrl }}`): Return to my cart →
**DE** — Subject: Noch am Überlegen? / Body: Kein Druck – dein Warenkorb wartet, wann immer du bereit bist. Vegan, sanft, in der EU hergestellt. / Button: Zurück zum Warenkorb →
**NL** — Subject: Nog aan het twijfelen? / Body: Geen druk – je mandje staat klaar wanneer jij wilt. Veganistisch, zacht, gemaakt in de EU. / Button: Terug naar mijn mandje →

---

# 3) POST PURCHASE flow — trigger: Placed Order

## Email 1 — immediate (brand thank-you; Stripe sends the receipt separately)
**EN**
- Subject: Thank you — your order is in 🌿
- Preview: Here's what happens next.
- Body:
  Hi {{ first_name|default:'there' }},
  Thank you for your order ({{ event.OrderId }}) — it means a lot to a small EU brand like ours.
  We're preparing it now and you'll get tracking by email as soon as it ships.
  Your order: **{{ event.Items }}**
- Button: Track your order status →  (link: https://www.eliraliving.com/)
- Sign-off: With care, The Elira Living team

**DE**
- Subject: Danke – deine Bestellung ist da 🌿
- Preview: So geht es jetzt weiter.
- Body:
  Hallo {{ first_name|default:'du' }},
  danke für deine Bestellung ({{ event.OrderId }}) – für eine kleine EU-Marke wie uns bedeutet das viel.
  Wir bereiten sie gerade vor; sobald sie verschickt wird, bekommst du die Sendungsverfolgung per E-Mail.
  Deine Bestellung: **{{ event.Items }}**
- Button: Bestellstatus ansehen →
- Sign-off: Herzlich, dein Elira-Living-Team

**NL**
- Subject: Bedankt – je bestelling is binnen 🌿
- Preview: Dit gebeurt er nu.
- Body:
  Hoi {{ first_name|default:'daar' }},
  bedankt voor je bestelling ({{ event.OrderId }}) – voor een klein EU-merk als wij betekent dat veel.
  We maken ’m nu klaar; zodra ’m verzonden is, ontvang je de tracking per e-mail.
  Je bestelling: **{{ event.Items }}**
- Button: Bekijk je bestelstatus →
- Sign-off: Met zorg, het Elira Living-team

## Email 2 — ~14 days later (how-to + review request)
**EN**
- Subject: How's your skin settling in?
- Preview: A little tip — and a small favour.
- Body:
  Give your routine a couple of weeks of consistency — gentle actives reward patience.
  If you're happy so far, a short review helps other sensitive-skin folks find us. It takes a minute and means the world.
- Button: Leave a quick review →

**DE**
- Subject: Wie fühlt sich deine Haut an?
- Preview: Ein kleiner Tipp – und eine kleine Bitte.
- Body:
  Gib deiner Routine ein paar Wochen Konstanz – sanfte Wirkstoffe belohnen Geduld.
  Wenn du bisher zufrieden bist, hilft eine kurze Bewertung anderen mit empfindlicher Haut, uns zu finden. Eine Minute, die viel bedeutet.
- Button: Kurz bewerten →

**NL**
- Subject: Hoe bevalt je huid het tot nu toe?
- Preview: Een kleine tip – en een klein verzoek.
- Body:
  Geef je routine een paar weken consistentie – zachte actieve stoffen belonen geduld.
  Ben je tot nu toe tevreden? Een korte review helpt anderen met een gevoelige huid ons te vinden. Eén minuut, en het betekent veel.
- Button: Schrijf snel een review →

---

# 4) WIN-BACK flow — trigger: lapsed (no purchase in ~60–90 days)

**EN**
- Subject: We saved your spot 🌿
- Preview: Your calmer routine is still here.
- Body:
  Hi {{ first_name|default:'there' }},
  It's been a while — your skin's calmer routine is still right here when you want it.
  Still vegan, still gentle, still made in the EU. New favourites have arrived since you last visited.
- Button: See what's new →

**DE**
- Subject: Dein Platz ist noch frei 🌿
- Preview: Deine ruhigere Routine ist weiterhin da.
- Body:
  Hallo {{ first_name|default:'du' }},
  ist eine Weile her – die ruhigere Routine für deine Haut ist immer noch da, wenn du möchtest.
  Weiterhin vegan, weiterhin sanft, weiterhin in der EU hergestellt. Seit deinem letzten Besuch gibt es neue Lieblinge.
- Button: Neuheiten entdecken →

**NL**
- Subject: We hebben je plek bewaard 🌿
- Preview: Je rustigere routine staat nog klaar.
- Body:
  Hoi {{ first_name|default:'daar' }},
  het is alweer even geleden – je rustigere routine staat nog steeds klaar wanneer je wilt.
  Nog steeds veganistisch, nog steeds zacht, nog steeds gemaakt in de EU. Sinds je laatste bezoek zijn er nieuwe favorieten bij.
- Button: Ontdek wat nieuw is →

---

## Setup notes (Klaviyo UI)
- Each flow has multiple language versions: simplest is **conditional split by `person.Locale`/country**, or one email with all 3 stacked (less ideal). Cleanest: duplicate the email per language and add a trigger/profile-property split (DE → German, NL → Dutch, else English).
- Abandoned-cart button **must** link to `{{ event.RecoveryUrl }}` — that's the one-click Stripe resume link.
- Add a clear unsubscribe footer (Klaviyo adds one by default — keep it; required by law).
- Sender: support@eliraliving.com (already set).
</content>
