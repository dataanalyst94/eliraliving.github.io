/* =========================================================================
   ELIRA LIVING — Legal page content (EN / DE / NL).
   Build-time only (consumed by build.js). Edit text here, then: node build.js
   {{withdrawalUrl}} is replaced per-language by the generator.
   NOTE: templates, not legal advice — have a professional review before launch.
   ========================================================================= */
const A = 'class="link-underline"';
const ODR = `<a href="https://ec.europa.eu/consumers/odr/" ${A} target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr/</a>`;
const MAIL = `<a href="mailto:support@eliraliving.com" ${A}>support@eliraliving.com</a>`;
const STRIPE = `<a href="https://stripe.com/privacy" ${A} target="_blank" rel="noopener">Stripe</a>`;
const TIETO = `<a href="https://tietosuoja.fi/en" ${A} target="_blank" rel="noopener">tietosuoja.fi</a>`;

const LEGAL = {
  en: {
    impressum: { title: "Impressum", subtitle: "Legal notice / Anbieterkennzeichnung (§ 5 DDG)", body: `
  <h2>Service provider</h2><p><strong>Elira Living</strong> (sole proprietorship / toiminimi)<br>Owner: Zeerak Ata<br>Lapinrinne 1b<br>00180 Helsinki<br>Finland</p>
  <h2>Contact</h2><p>Phone: +358 41 7408294<br>E-mail: ${MAIL}</p>
  <h2>Business ID (Y-tunnus)</h2><p>3526013-6 — registered in the Finnish Trade Register (PRH).</p>
  <h2>VAT</h2><p>Elira Living is a small business and is not currently registered for VAT; no VAT identification number is held and VAT is not shown separately.</p>
  <h2>Packaging register (LUCID)</h2><p>Registration number under the German Packaging Act (VerpackG): <strong>DE1454291180935</strong></p>
  <h2>Online dispute resolution</h2><p>EU ODR platform: ${ODR}. We are not obliged or willing to participate in consumer arbitration.</p>` },
    privacy: { title: "Privacy Policy", subtitle: "How we handle your personal data under the GDPR", body: `
  <h2>1. Controller</h2><p><strong>Elira Living</strong> (owner: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland · ${MAIL} · Business ID 3526013-6.</p>
  <h2>2. What we collect</h2><ul><li><strong>Order &amp; payment data</strong> — name, address, email, order contents. Card details go directly to Stripe and are never stored on our servers.</li><li><strong>Newsletter</strong> — your email, if you subscribe.</li><li><strong>Technical data</strong> — IP, browser, pages visited (hosting/checkout providers).</li><li><strong>Local storage</strong> — cart &amp; language, stored in your browser only.</li></ul>
  <h2>3. Legal bases (Art. 6 GDPR)</h2><ul><li>Art. 6(1)(b) — performance of the purchase contract.</li><li>Art. 6(1)(c) — legal obligations (tax/accounting).</li><li>Art. 6(1)(a) — consent (newsletter, analytics &amp; marketing).</li><li>Art. 6(1)(f) — legitimate interests (secure shop).</li></ul>
  <h2>4. Recipients &amp; processors</h2><ul><li>${STRIPE} Payments Europe, Ltd. (Dublin) — payments.</li><li><strong>Fulfilment partner</strong> in Latvia (EU) — name &amp; delivery address.</li><li><strong>Hosting</strong> — GitHub Pages + a Cloudflare Worker. SCCs apply to any EEA transfer.</li><li><strong>Analytics &amp; advertising (with consent):</strong> Google (Analytics 4, Ads), Meta Platforms, TikTok — see §5.</li><li><strong>Email marketing</strong> — Klaviyo (Klaviyo, Inc., USA) processes your email address to send the newsletter (with your consent) and order-related emails. Standard Contractual Clauses cover the US transfer.</li></ul>
  <h2>5. Cookies, analytics &amp; advertising</h2><p>We use essential local storage (cart &amp; language), which needs no consent. <strong>With your consent</strong> we also use <strong>Google Analytics 4</strong>, <strong>Google Ads</strong>, the <strong>Meta (Facebook/Instagram) Pixel</strong> the <strong>TikTok Pixel</strong> and <strong>Klaviyo</strong> (onsite cart tracking for reminder emails) to measure traffic, show relevant ads and send cart reminders. These load only after you accept via our cookie banner (Google Consent Mode v2; default denied) and may set cookies and transfer data to Google, Meta, TikTok and Klaviyo, including outside the EEA under appropriate safeguards. Change or withdraw your choice anytime via "Cookie settings" in the footer.</p>
  <h2>6. Retention</h2><p>Order/accounting data for the statutory periods under Finnish bookkeeping law (generally 6 years). Newsletter until you unsubscribe.</p>
  <h2>7. Your rights</h2><p>Access, rectification, erasure, restriction, portability, objection, and withdrawal of consent — email ${MAIL}. Lead authority: Finnish Data Protection Ombudsman (${TIETO}). DE/NL customers may also contact their national authority.</p>` },
    terms: { title: "Terms &amp; Conditions", subtitle: "General terms of sale for consumers", body: `
  <h2>1. Seller</h2><p>Elira Living (owner: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland — Business ID 3526013-6. ${MAIL}.</p>
  <h2>2. Scope</h2><p>These terms apply to all consumer orders placed via this shop. We ship across the <strong>European Union</strong>.</p>
  <h2>3. Contract</h2><p>Product display is not a binding offer. Completing payment at Stripe checkout places a binding order; the contract forms on our confirmation or dispatch.</p>
  <h2>4. Prices &amp; VAT</h2><p>All prices are total prices in Euro. As a small business we are not currently VAT-registered, so VAT is not shown separately.</p>
  <h2>5. Shipping</h2><p>Free on all orders. Dispatched from within the EU (currently Latvia). Delivery 3–7 working days.</p>
  <h2>6. Payment</h2><p>Securely via Stripe (card, iDEAL, Klarna, SEPA). Due immediately on order.</p>
  <h2>7. Right of withdrawal</h2><p>14-day statutory right — see the <a href="{{withdrawalUrl}}" ${A}>Right of Withdrawal</a> page.</p>
  <h2>8. Cosmetics &amp; hygiene</h2><p>Sealed cosmetics unsealed after delivery are excluded from withdrawal where permitted by law.</p>
  <h2>9. Governing law</h2><p>Finnish law applies, without prejudice to mandatory consumer rights of your country of residence. EU ODR: ${ODR}.</p>` },
    withdrawal: { title: "Right of Withdrawal", subtitle: "Your 14-day right to cancel", body: `
  <h2>Right of withdrawal</h2><p>You may withdraw within 14 days without giving a reason, from the day you take possession of the goods.</p>
  <p>To exercise it, inform us — <strong>Elira Living</strong> (Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland · ${MAIL} — with a clear statement of your decision (for example, by email). You may simply state that you wish to withdraw from your order, quoting your order number and date.</p>
  <h2>Consequences</h2><p>We reimburse all payments including standard delivery within 14 days of being informed, via Stripe. We may withhold reimbursement until the goods are returned. You bear the direct cost of return.</p>
  <h3>Returns address</h3><p>Elira Living — Returns<br>Lapinrinne 1B, 606<br>00180 Helsinki, Finland</p>
  <h2>Exclusions</h2><p>Sealed cosmetics (toners, shampoos) unsealed after delivery are excluded for hygiene reasons.</p>` }
  },

  de: {
    impressum: { title: "Impressum", subtitle: "Angaben gemäß § 5 DDG", body: `
  <h2>Diensteanbieter</h2><p><strong>Elira Living</strong> (Einzelunternehmen / toiminimi)<br>Inhaber: Zeerak Ata<br>Lapinrinne 1b<br>00180 Helsinki<br>Finnland</p>
  <h2>Kontakt</h2><p>Telefon: +358 41 7408294<br>E-Mail: ${MAIL}</p>
  <h2>Unternehmenskennung (Y-tunnus)</h2><p>3526013-6 — eingetragen im finnischen Handelsregister (PRH).</p>
  <h2>Umsatzsteuer</h2><p>Elira Living ist ein Kleinunternehmen und derzeit nicht umsatzsteuerlich registriert; es besteht keine Umsatzsteuer-Identifikationsnummer und es wird keine Umsatzsteuer gesondert ausgewiesen.</p>
  <h2>Verpackungsregister (LUCID)</h2><p>Registrierungsnummer nach dem Verpackungsgesetz (VerpackG): <strong>DE1454291180935</strong></p>
  <h2>Online-Streitbeilegung</h2><p>EU-Plattform zur Online-Streitbeilegung (OS): ${ODR}. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>` },
    privacy: { title: "Datenschutzerklärung", subtitle: "Wie wir Ihre personenbezogenen Daten gemäß DSGVO verarbeiten", body: `
  <h2>1. Verantwortlicher</h2><p><strong>Elira Living</strong> (Inhaber: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finnland · ${MAIL} · Unternehmenskennung 3526013-6.</p>
  <h2>2. Welche Daten wir erheben</h2><ul><li><strong>Bestell- und Zahlungsdaten</strong> — Name, Adresse, E-Mail, Bestellinhalt. Kartendaten werden direkt an Stripe übermittelt und niemals auf unseren Servern gespeichert.</li><li><strong>Newsletter</strong> — Ihre E-Mail-Adresse, sofern Sie sich anmelden.</li><li><strong>Technische Daten</strong> — IP-Adresse, Browser, aufgerufene Seiten (durch Hosting-/Checkout-Anbieter).</li><li><strong>Lokaler Speicher</strong> — Warenkorb und Sprache, nur in Ihrem Browser.</li></ul>
  <h2>3. Rechtsgrundlagen (Art. 6 DSGVO)</h2><ul><li>Art. 6 Abs. 1 lit. b — Erfüllung des Kaufvertrags.</li><li>Art. 6 Abs. 1 lit. c — gesetzliche Pflichten (Steuern/Buchhaltung).</li><li>Art. 6 Abs. 1 lit. a — Einwilligung (Newsletter, Statistik &amp; Marketing).</li><li>Art. 6 Abs. 1 lit. f — berechtigte Interessen (sicherer Shop).</li></ul>
  <h2>4. Empfänger und Auftragsverarbeiter</h2><ul><li>${STRIPE} Payments Europe, Ltd. (Dublin) — Zahlungsabwicklung.</li><li><strong>Fulfillment-Partner</strong> in Lettland (EU) — Name und Lieferadresse.</li><li><strong>Hosting</strong> — GitHub Pages und ein Cloudflare Worker. Für Übermittlungen außerhalb des EWR gelten Standardvertragsklauseln.</li><li><strong>Statistik &amp; Werbung (mit Einwilligung):</strong> Google (Analytics 4, Ads), Meta Platforms, TikTok — siehe §5.</li><li><strong>E-Mail-Marketing</strong> — Klaviyo (Klaviyo, Inc., USA) verarbeitet Ihre E-Mail-Adresse für den Newsletter (mit Ihrer Einwilligung) und bestellbezogene E-Mails. Standardvertragsklauseln decken die Übermittlung in die USA ab.</li></ul>
  <h2>5. Cookies, Statistik &amp; Werbung</h2><p>Wir verwenden essenziellen lokalen Speicher (Warenkorb und Sprache), der keine Einwilligung erfordert. <strong>Mit Ihrer Einwilligung</strong> verwenden wir außerdem <strong>Google Analytics 4</strong>, <strong>Google Ads</strong>, das <strong>Meta-(Facebook/Instagram-)Pixel</strong> das <strong>TikTok-Pixel</strong> und <strong>Klaviyo</strong> (Onsite-Warenkorb-Tracking für Erinnerungs-E-Mails), um Besuche zu messen, relevante Werbung anzuzeigen und Warenkorb-Erinnerungen zu senden. Diese Dienste werden erst geladen, nachdem Sie über unser Cookie-Banner zugestimmt haben (Google Consent Mode v2; standardmäßig abgelehnt). Dabei können Cookies gesetzt und Daten an Google, Meta, TikTok und Klaviyo übermittelt werden, auch außerhalb des EWR unter geeigneten Garantien. Sie können Ihre Auswahl jederzeit über „Cookie-Einstellungen“ im Footer ändern oder widerrufen.</p>
  <h2>6. Speicherdauer</h2><p>Bestell- und Buchhaltungsdaten für die gesetzlichen Fristen nach finnischem Buchführungsrecht (in der Regel 6 Jahre). Newsletter-Daten bis zur Abmeldung.</p>
  <h2>7. Ihre Rechte</h2><p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch sowie Widerruf der Einwilligung — per E-Mail an ${MAIL}. Zuständige Aufsichtsbehörde: finnische Datenschutzbeauftragte (${TIETO}). Kundinnen und Kunden in Deutschland können sich auch an ihre zuständige Landesdatenschutzbehörde wenden.</p>` },
    terms: { title: "Allgemeine Geschäftsbedingungen (AGB)", subtitle: "Allgemeine Verkaufsbedingungen für Verbraucher", body: `
  <h2>1. Verkäufer</h2><p>Elira Living (Inhaber: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finnland — Unternehmenskennung 3526013-6. ${MAIL}.</p>
  <h2>2. Geltungsbereich</h2><p>Diese Bedingungen gelten für alle Verbraucherbestellungen über diesen Shop. Wir liefern in die gesamte <strong>Europäische Union</strong>.</p>
  <h2>3. Vertragsschluss</h2><p>Die Produktdarstellung ist kein verbindliches Angebot. Mit Abschluss der Zahlung an der Stripe-Kasse geben Sie eine verbindliche Bestellung ab; der Vertrag kommt mit unserer Bestätigung oder dem Versand zustande.</p>
  <h2>4. Preise &amp; Umsatzsteuer</h2><p>Alle Preise sind Gesamtpreise in Euro. Als Kleinunternehmen sind wir derzeit nicht umsatzsteuerlich registriert; Umsatzsteuer wird nicht gesondert ausgewiesen.</p>
  <h2>5. Versand</h2><p>Kostenloser Versand auf alle Bestellungen. Versand aus der EU (derzeit Lettland). Lieferung in 3–7 Werktagen.</p>
  <h2>6. Zahlung</h2><p>Sichere Zahlung über Stripe (Karte, iDEAL, Klarna, SEPA). Fällig sofort mit der Bestellung.</p>
  <h2>7. Widerrufsrecht</h2><p>14-tägiges gesetzliches Widerrufsrecht — siehe Seite <a href="{{withdrawalUrl}}" ${A}>Widerrufsrecht</a>.</p>
  <h2>8. Kosmetik &amp; Hygiene</h2><p>Versiegelte Kosmetikprodukte, die nach der Lieferung entsiegelt wurden, sind vom Widerruf ausgeschlossen, soweit gesetzlich zulässig.</p>
  <h2>9. Anwendbares Recht</h2><p>Es gilt finnisches Recht, unbeschadet der zwingenden verbraucherschützenden Vorschriften Ihres Wohnsitzstaates. EU-Streitbeilegung: ${ODR}.</p>` },
    withdrawal: { title: "Widerrufsrecht", subtitle: "Ihr 14-tägiges Widerrufsrecht", body: `
  <h2>Widerrufsrecht</h2><p>Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben.</p>
  <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns — <strong>Elira Living</strong> (Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finnland · ${MAIL} — mittels einer eindeutigen Erklärung (z. B. per E-Mail) über Ihren Entschluss informieren. Es genügt, wenn Sie mitteilen, dass Sie Ihre Bestellung widerrufen, unter Angabe Ihrer Bestellnummer und des Bestelldatums.</p>
  <h2>Folgen des Widerrufs</h2><p>Wir erstatten Ihnen alle Zahlungen einschließlich der Standard-Lieferkosten unverzüglich und spätestens binnen 14 Tagen ab Eingang Ihrer Widerrufsmitteilung über Stripe zurück. Wir können die Rückzahlung verweigern, bis wir die Waren zurückerhalten haben. Sie tragen die unmittelbaren Kosten der Rücksendung.</p>
  <h3>Rücksendeadresse</h3><p>Elira Living — Retoure<br>Lapinrinne 1B, 606<br>00180 Helsinki, Finnland</p>
  <h2>Ausschluss</h2><p>Versiegelte Kosmetik (Gesichtswasser, Shampoo), die nach Lieferung entsiegelt wurde, ist aus Hygienegründen vom Widerruf ausgeschlossen.</p>` }
  },

  nl: {
    impressum: { title: "Colofon", subtitle: "Wettelijke kennisgeving", body: `
  <h2>Dienstverlener</h2><p><strong>Elira Living</strong> (eenmanszaak / toiminimi)<br>Eigenaar: Zeerak Ata<br>Lapinrinne 1b<br>00180 Helsinki<br>Finland</p>
  <h2>Contact</h2><p>Telefoon: +358 41 7408294<br>E-mail: ${MAIL}</p>
  <h2>Bedrijfsidentificatie (Y-tunnus)</h2><p>3526013-6 — ingeschreven in het Finse handelsregister (PRH).</p>
  <h2>Btw</h2><p>Elira Living is een kleine onderneming en momenteel niet btw-geregistreerd; er is geen btw-identificatienummer en btw wordt niet apart vermeld.</p>
  <h2>Verpakkingsregister (LUCID)</h2><p>Registratienummer onder de Duitse Verpakkingswet (VerpackG): <strong>DE1454291180935</strong></p>
  <h2>Onlinegeschillenbeslechting</h2><p>EU-platform voor onlinegeschillenbeslechting (ODR): ${ODR}. Wij zijn niet verplicht en niet bereid deel te nemen aan geschillenbeslechting voor een geschillencommissie voor consumenten.</p>` },
    privacy: { title: "Privacybeleid", subtitle: "Hoe wij je persoonsgegevens verwerken onder de AVG", body: `
  <h2>1. Verwerkingsverantwoordelijke</h2><p><strong>Elira Living</strong> (eigenaar: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland · ${MAIL} · Bedrijfsidentificatie 3526013-6.</p>
  <h2>2. Welke gegevens we verzamelen</h2><ul><li><strong>Bestel- en betaalgegevens</strong> — naam, adres, e-mail, bestelinhoud. Kaartgegevens gaan rechtstreeks naar Stripe en worden nooit op onze servers opgeslagen.</li><li><strong>Nieuwsbrief</strong> — je e-mailadres, als je je aanmeldt.</li><li><strong>Technische gegevens</strong> — IP-adres, browser, bezochte pagina's (door hosting-/checkoutproviders).</li><li><strong>Lokale opslag</strong> — winkelwagen en taal, alleen in je browser.</li></ul>
  <h2>3. Rechtsgronden (art. 6 AVG)</h2><ul><li>Art. 6 lid 1 sub b — uitvoering van de koopovereenkomst.</li><li>Art. 6 lid 1 sub c — wettelijke verplichtingen (belasting/boekhouding).</li><li>Art. 6 lid 1 sub a — toestemming (nieuwsbrief, statistieken &amp; marketing).</li><li>Art. 6 lid 1 sub f — gerechtvaardigde belangen (veilige shop).</li></ul>
  <h2>4. Ontvangers en verwerkers</h2><ul><li>${STRIPE} Payments Europe, Ltd. (Dublin) — betalingen.</li><li><strong>Fulfilmentpartner</strong> in Letland (EU) — naam en bezorgadres.</li><li><strong>Hosting</strong> — GitHub Pages en een Cloudflare Worker. Voor doorgifte buiten de EER gelden modelcontractbepalingen.</li><li><strong>Statistieken &amp; advertenties (met toestemming):</strong> Google (Analytics 4, Ads), Meta Platforms, TikTok — zie §5.</li><li><strong>E-mailmarketing</strong> — Klaviyo (Klaviyo, Inc., VS) verwerkt je e-mailadres voor de nieuwsbrief (met je toestemming) en bestelgerelateerde e-mails. Modelcontractbepalingen dekken de doorgifte naar de VS.</li></ul>
  <h2>5. Cookies, statistieken &amp; advertenties</h2><p>We gebruiken essentiële lokale opslag (winkelwagen en taal), waarvoor geen toestemming nodig is. <strong>Met jouw toestemming</strong> gebruiken we ook <strong>Google Analytics 4</strong>, <strong>Google Ads</strong>, de <strong>Meta-(Facebook/Instagram-)pixel</strong> de <strong>TikTok-pixel</strong> en <strong>Klaviyo</strong> (onsite winkelmandje-tracking voor herinneringsmails) om bezoeken te meten, relevante advertenties te tonen en winkelmandje-herinneringen te sturen. Deze diensten worden pas geladen nadat je via onze cookiebanner akkoord bent gegaan (Google Consent Mode v2; standaard geweigerd). Hierbij kunnen cookies worden geplaatst en gegevens worden doorgegeven aan Google, Meta, TikTok en Klaviyo, ook buiten de EER met passende waarborgen. Je kunt je keuze altijd wijzigen of intrekken via "Cookie-instellingen" in de footer.</p>
  <h2>6. Bewaartermijn</h2><p>Bestel- en boekhoudgegevens gedurende de wettelijke termijnen onder het Finse boekhoudrecht (doorgaans 6 jaar). Nieuwsbriefgegevens tot je je afmeldt.</p>
  <h2>7. Je rechten</h2><p>Inzage, rectificatie, wissing, beperking, overdraagbaarheid, bezwaar en intrekking van toestemming — e-mail ${MAIL}. Leidende toezichthouder: de Finse toezichthouder voor gegevensbescherming (${TIETO}). Klanten in Nederland kunnen ook terecht bij de Autoriteit Persoonsgegevens.</p>` },
    terms: { title: "Algemene voorwaarden", subtitle: "Algemene verkoopvoorwaarden voor consumenten", body: `
  <h2>1. Verkoper</h2><p>Elira Living (eigenaar: Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland — Bedrijfsidentificatie 3526013-6. ${MAIL}.</p>
  <h2>2. Toepassingsgebied</h2><p>Deze voorwaarden gelden voor alle consumentenbestellingen via deze shop. Wij verzenden naar de gehele <strong>Europese Unie</strong>.</p>
  <h2>3. Totstandkoming</h2><p>De productpresentatie is geen bindend aanbod. Door de betaling bij de Stripe-kassa af te ronden plaats je een bindende bestelling; de overeenkomst komt tot stand bij onze bevestiging of verzending.</p>
  <h2>4. Prijzen &amp; btw</h2><p>Alle prijzen zijn totaalprijzen in euro. Als kleine onderneming zijn we momenteel niet btw-geregistreerd; btw wordt niet apart vermeld.</p>
  <h2>5. Verzending</h2><p>Gratis op alle bestellingen. Verzonden vanuit de EU (momenteel Letland). Levering in 3–7 werkdagen.</p>
  <h2>6. Betaling</h2><p>Veilig via Stripe (kaart, iDEAL, Klarna, SEPA). Direct verschuldigd bij bestelling.</p>
  <h2>7. Herroepingsrecht</h2><p>Wettelijk herroepingsrecht van 14 dagen — zie de pagina <a href="{{withdrawalUrl}}" ${A}>Herroepingsrecht</a>.</p>
  <h2>8. Cosmetica &amp; hygiëne</h2><p>Verzegelde cosmetica die na levering is ontzegeld, is uitgesloten van herroeping voor zover wettelijk toegestaan.</p>
  <h2>9. Toepasselijk recht</h2><p>Het Finse recht is van toepassing, onverminderd de dwingende consumentenrechten van je land van verblijf. EU-ODR: ${ODR}.</p>` },
    withdrawal: { title: "Herroepingsrecht", subtitle: "Je herroepingsrecht van 14 dagen", body: `
  <h2>Herroepingsrecht</h2><p>Je hebt het recht om binnen 14 dagen zonder opgave van redenen de overeenkomst te herroepen, vanaf de dag waarop je de goederen in ontvangst neemt.</p>
  <p>Om je herroepingsrecht uit te oefenen, informeer ons — <strong>Elira Living</strong> (Zeerak Ata), Lapinrinne 1b, 00180 Helsinki, Finland · ${MAIL} — via een ondubbelzinnige verklaring (bijvoorbeeld per e-mail). Je kunt eenvoudig melden dat je je bestelling herroept, met vermelding van je bestelnummer en besteldatum.</p>
  <h2>Gevolgen</h2><p>Wij betalen alle betalingen inclusief standaard leveringskosten binnen 14 dagen na ontvangst van je melding terug via Stripe. Wij mogen wachten tot de goederen retour zijn. Je draagt de directe kosten van retournering.</p>
  <h3>Retouradres</h3><p>Elira Living — Retouren<br>Lapinrinne 1B, 606<br>00180 Helsinki, Finland</p>
  <h2>Uitsluitingen</h2><p>Verzegelde cosmetica (toners, shampoos) die na levering is ontzegeld, is om hygiënische redenen uitgesloten.</p>` }
  }
};

const DISCLAIMER = {
  en: "This notice reflects the information provided by the business. Please have it reviewed by a qualified adviser. Last updated: June 2026.",
  de: "Diese Angaben beruhen auf den Informationen des Unternehmens. Bitte lassen Sie sie von einer qualifizierten Fachperson prüfen. Stand: Juni 2026.",
  nl: "Deze informatie is gebaseerd op gegevens van het bedrijf. Laat deze door een gekwalificeerde adviseur controleren. Laatst bijgewerkt: juni 2026."
};

module.exports = { LEGAL, DISCLAIMER };
