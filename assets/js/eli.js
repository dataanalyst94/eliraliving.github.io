/* =========================================================================
   ELI — Elira Living's autonomous on-site assistant.
   100% client-side and rule-based: guided quick-replies + multilingual
   keyword matching over a curated knowledge base. No API, no server, no
   running cost — it works forever on the static site.

   Scope (hard-limited): products & recommendations by skin/hair type,
   shipping, returns/withdrawal, payment, ingredients, certifications,
   contact. Everything else → polite fallback to support email.

   Reuses page globals: window.LANG, window.CATALOG (prices/images),
   window.CONTENT (localized product names). Wording is cosmetic-only —
   no medical claims (COSMOS/EU compliance).
   ========================================================================= */
(function () {
  "use strict";
  var LANG = window.LANG || "en";
  var CAT = window.CATALOG;
  var C = window.CONTENT || {};
  if (!CAT) return; // catalog not loaded on this page — skip quietly
  var P = "/" + LANG;
  var MAIL = "support@eliraliving.com";
  var LOCALES = { de: "de-DE", nl: "nl-NL", en: "en-IE", fi: "fi-FI" };
  var fmt = function (c) { return new Intl.NumberFormat(LOCALES[LANG] || "en-IE", { style: "currency", currency: "EUR" }).format((c || 0) / 100); };
  var pname = function (id) { try { return C.products[id].name; } catch (e) { return id; } };
  var pimg = function (id) {
    if (CAT.productImage) return CAT.productImage(id, LANG);
    var p = CAT.getProduct(id);
    return p ? p.image : "";
  };

  /* ---- Knowledge base (4 languages) ------------------------------------ */
  var I18N = {
    en: {
      title: "Eli — Elira assistant", online: "Online · answers instantly",
      hello: "Hi, I'm Eli 🌿 — Elira Living's assistant. I can help you find the right product for your skin or hair type, and answer questions about shipping, returns, payment, ingredients and our certifications. What can I do for you?",
      menu: { skin: "Find skincare for me", hair: "Haircare advice", ship: "Shipping & delivery", ret: "Returns", pay: "Payment", ing: "Ingredients & certifications", contact: "Contact a human" },
      back: "⌂ Menu",
      skinQ: "Happy to help! How would you describe your skin?",
      skinOpts: { sensitive: "Sensitive / reactive", dry: "Dry / tight-feeling", oily: "Oily / combination", normal: "Normal / balanced", aging: "Fine lines & firmness" },
      agingQ: "And is your skin on the sensitive side, or more normal to dry?",
      agingOpts: { sensitive: "Rather sensitive", normalDry: "Normal to dry" },
      recIntro: "Based on what you've told me, this is what I'd reach for:",
      recWhy: {
        "sensitive-moisturizing-cream": "Fragrance-free, with glycerin and betaine — made for reactive, easily-irritated skin. It calms visible redness and supports the moisture barrier.",
        "purifying-toner": "Lavender water, cucumber and a touch of gentle salicylic acid (BHA) — clears pores and balances shine on oily and combination skin, without the sting.",
        "radiant-glow-cleanser": "A gentle daily cleanser that removes makeup and excess oil without stripping — skin feels clean and fresh, never tight.",
        "retinol-alternative-serum": "2% Bidens Pilosa, a plant-based retinol alternative, plus hyaluronic acid — visibly smooths fine lines without the irritation retinol can bring.",
        "peptide-anti-aging-serum": "2% Hexapeptide-11 with Ginkgo and hyaluronic acid — visibly softens fine lines for firmer, plumper-feeling skin.",
        "sensitive-scalp-shampoo": "Sulfate-free with mild coconut-derived cleansers, plum extract and linden flower — soothes itch and tightness, gentle enough for daily washing. Dermatologically tested."
      },
      alsoPair: "It pairs nicely with:", view: "View product →",
      browseLead: "Want to see everything for your type?", browseSkin: "All skincare products", browseHair: "All haircare products",
      hairA: "For hair, the whole range is built around one hero: our dermatologically tested, sulfate-free shampoo for sensitive, easily-irritated scalps — and it's gentle enough for all hair types and daily washing.",
      shipA: "Shipping is free on every order — to all 27 EU countries, same price, no fees. Orders are dispatched from within the EU and typically arrive in 3–7 working days, climate-neutral. 📦",
      retA: "You have the EU statutory 14-day right of withdrawal from the day you receive your order. Just email " + MAIL + " with your order number — no form needed. Note: sealed cosmetics that have been opened are excluded for hygiene reasons, and return shipping is paid by the customer.",
      payA: "We accept cards, iDEAL, Klarna and SEPA — all processed securely by Stripe. Payment is encrypted and we never see or store your card details. 🔒",
      ingA: "Every formula is 100% vegan, cruelty-free and independently certified by ECOCERT COSMOS (the cream is COSMOS Organic). Full INCI lists are printed on each product and shown on every product page.",
      ingLinks: [["Ingredients guide", "/ingredients.html"], ["Our certifications", "/certifications.html"]],
      contactA: "Of course! You can reach the team directly at " + MAIL + " — we reply within 1–2 working days. For order questions, include your order number.",
      thanksA: "You're very welcome! 🌿 Anything else I can help with?",
      byeA: "Take care! I'm right here if you need me. 🌿",
      fallback: "I'm a simple shop assistant, so I can only help with our products, skin & hair advice, shipping, returns, payment and ingredients. For anything else, the team at " + MAIL + " will gladly help! Meanwhile — anything from the menu?",
      humanIntro: "Sure! Type your message below and it goes straight to a real person on our team. Replies appear right here — just keep this tab open. 💬",
      humanSent: "✓ Delivered to the team. You can add more details anytime — their reply will appear here.",
      humanFail: "Live chat isn't reachable right now — please email us instead at " + MAIL + ". We reply within 1–2 working days.",
      teamLabel: "Elira team",
      inputPh: "Type a question…", open: "Chat with Eli", close: "Close chat"
    },
    de: {
      title: "Eli — Elira-Assistent", online: "Online · antwortet sofort",
      hello: "Hallo, ich bin Eli 🌿 — der Assistent von Elira Living. Ich helfe dir, das richtige Produkt für deinen Haut- oder Haartyp zu finden, und beantworte Fragen zu Versand, Rückgabe, Zahlung, Inhaltsstoffen und unseren Zertifizierungen. Was kann ich für dich tun?",
      menu: { skin: "Pflege für mich finden", hair: "Haarpflege-Beratung", ship: "Versand & Lieferung", ret: "Rückgabe", pay: "Zahlung", ing: "Inhaltsstoffe & Zertifikate", contact: "Mensch kontaktieren" },
      back: "⌂ Menü",
      skinQ: "Gerne! Wie würdest du deine Haut beschreiben?",
      skinOpts: { sensitive: "Empfindlich / reaktiv", dry: "Trocken / spannt", oily: "Ölig / Mischhaut", normal: "Normal / ausgeglichen", aging: "Fältchen & Festigkeit" },
      agingQ: "Und ist deine Haut eher empfindlich oder eher normal bis trocken?",
      agingOpts: { sensitive: "Eher empfindlich", normalDry: "Normal bis trocken" },
      recIntro: "Nach dem, was du mir erzählt hast, würde ich dazu greifen:",
      recWhy: {
        "sensitive-moisturizing-cream": "Parfümfrei, mit Glycerin und Betain — gemacht für reaktive, leicht irritierte Haut. Beruhigt sichtbare Rötungen und unterstützt die Feuchtigkeitsbarriere.",
        "purifying-toner": "Lavendelwasser, Gurke und ein Hauch milder Salicylsäure (BHA) — klärt die Poren und gleicht Glanz bei öliger Haut und Mischhaut aus, ganz ohne Brennen.",
        "radiant-glow-cleanser": "Ein milder täglicher Reiniger, der Make-up und überschüssiges Öl entfernt, ohne auszutrocknen — die Haut fühlt sich sauber und frisch an, nie gespannt.",
        "retinol-alternative-serum": "2 % Bidens Pilosa, eine pflanzliche Retinol-Alternative, plus Hyaluronsäure — glättet Fältchen sichtbar, ohne die Reizung, die Retinol mitbringen kann.",
        "peptide-anti-aging-serum": "2 % Hexapeptid-11 mit Ginkgo und Hyaluronsäure — mildert Fältchen sichtbar für strafferes, praller wirkendes Hautgefühl.",
        "sensitive-scalp-shampoo": "Sulfatfrei mit milden Tensiden auf Kokosbasis, Pflaumenextrakt und Lindenblüte — lindert Juckreiz und Spannungsgefühl, mild genug für die tägliche Wäsche. Dermatologisch getestet."
      },
      alsoPair: "Passt gut dazu:", view: "Zum Produkt →",
      browseLead: "Möchtest du alles für deinen Typ sehen?", browseSkin: "Alle Hautpflegeprodukte", browseHair: "Alle Haarpflegeprodukte",
      hairA: "Für die Haare dreht sich bei uns alles um einen Helden: unser dermatologisch getestetes, sulfatfreies Shampoo für empfindliche, leicht gereizte Kopfhaut — mild genug für alle Haartypen und die tägliche Wäsche.",
      shipA: "Der Versand ist bei jeder Bestellung kostenlos — in alle 27 EU-Länder, gleicher Preis, keine Gebühren. Versand aus der EU, Lieferung in der Regel in 3–7 Werktagen, klimaneutral. 📦",
      retA: "Du hast das gesetzliche 14-tägige Widerrufsrecht ab Erhalt deiner Bestellung. Schreib einfach an " + MAIL + " mit deiner Bestellnummer — kein Formular nötig. Hinweis: Versiegelte, geöffnete Kosmetik ist aus Hygienegründen ausgeschlossen, die Rücksendekosten trägt der Kunde.",
      payA: "Wir akzeptieren Karten, iDEAL, Klarna und SEPA — alles sicher über Stripe abgewickelt. Die Zahlung ist verschlüsselt; wir sehen und speichern deine Kartendaten nie. 🔒",
      ingA: "Jede Formel ist 100 % vegan, tierversuchsfrei und unabhängig von ECOCERT COSMOS zertifiziert (die Creme ist COSMOS Organic). Die vollständige INCI-Liste steht auf jedem Produkt und auf jeder Produktseite.",
      ingLinks: [["Inhaltsstoff-Guide", "/ingredients.html"], ["Unsere Zertifikate", "/certifications.html"]],
      contactA: "Natürlich! Du erreichst das Team direkt unter " + MAIL + " — wir antworten innerhalb von 1–2 Werktagen. Bei Fragen zu einer Bestellung gib bitte die Bestellnummer an.",
      thanksA: "Sehr gerne! 🌿 Kann ich noch etwas für dich tun?",
      byeA: "Mach's gut! Ich bin hier, wenn du mich brauchst. 🌿",
      fallback: "Ich bin ein einfacher Shop-Assistent und helfe nur bei unseren Produkten, Haut- & Haarberatung, Versand, Rückgabe, Zahlung und Inhaltsstoffen. Für alles andere hilft dir das Team unter " + MAIL + " gern weiter! Magst du etwas aus dem Menü?",
      humanIntro: "Gern! Schreib deine Nachricht unten — sie geht direkt an einen echten Menschen aus unserem Team. Antworten erscheinen genau hier — lass den Tab einfach geöffnet. 💬",
      humanSent: "✓ Ans Team übermittelt. Du kannst jederzeit Details ergänzen — die Antwort erscheint hier.",
      humanFail: "Der Live-Chat ist gerade nicht erreichbar — schreib uns bitte per E-Mail an " + MAIL + ". Wir antworten innerhalb von 1–2 Werktagen.",
      teamLabel: "Elira-Team",
      inputPh: "Frage eingeben…", open: "Mit Eli chatten", close: "Chat schließen"
    },
    nl: {
      title: "Eli — Elira-assistent", online: "Online · antwoordt direct",
      hello: "Hoi, ik ben Eli 🌿 — de assistent van Elira Living. Ik help je het juiste product voor jouw huid- of haartype te vinden en beantwoord vragen over verzending, retourneren, betalen, ingrediënten en onze certificeringen. Wat kan ik voor je doen?",
      menu: { skin: "Vind verzorging voor mij", hair: "Haarverzorging-advies", ship: "Verzending & levering", ret: "Retourneren", pay: "Betalen", ing: "Ingrediënten & certificaten", contact: "Contact met een mens" },
      back: "⌂ Menu",
      skinQ: "Met plezier! Hoe zou je je huid omschrijven?",
      skinOpts: { sensitive: "Gevoelig / reactief", dry: "Droog / trekkerig", oily: "Vet / gecombineerd", normal: "Normaal / in balans", aging: "Fijne lijntjes & stevigheid" },
      agingQ: "En is je huid eerder gevoelig, of meer normaal tot droog?",
      agingOpts: { sensitive: "Eerder gevoelig", normalDry: "Normaal tot droog" },
      recIntro: "Op basis van wat je vertelt, zou ik hiervoor gaan:",
      recWhy: {
        "sensitive-moisturizing-cream": "Parfumvrij, met glycerine en betaïne — gemaakt voor de reactieve, snel geïrriteerde huid. Kalmeert zichtbare roodheid en ondersteunt de vochtbarrière.",
        "purifying-toner": "Lavendelwater, komkommer en een vleugje mild salicylzuur (BHA) — zuivert de poriën en brengt glans in balans bij de vette en gecombineerde huid, zonder prikken.",
        "radiant-glow-cleanser": "Een milde dagelijkse reiniger die make-up en overtollig talg verwijdert zonder uit te drogen — de huid voelt schoon en fris, nooit strak.",
        "retinol-alternative-serum": "2% Bidens Pilosa, een plantaardig alternatief voor retinol, plus hyaluronzuur — vervaagt fijne lijntjes zichtbaar, zonder de irritatie die retinol kan geven.",
        "peptide-anti-aging-serum": "2% Hexapeptide-11 met ginkgo en hyaluronzuur — verzacht fijne lijntjes zichtbaar voor een steviger, voller huidgevoel.",
        "sensitive-scalp-shampoo": "Sulfaatvrij met milde reinigers op kokosbasis, pruimenextract en lindebloesem — verzacht jeuk en een trekkerig gevoel, mild genoeg voor dagelijks wassen. Dermatologisch getest."
      },
      alsoPair: "Combineert mooi met:", view: "Bekijk product →",
      browseLead: "Wil je alles voor jouw type zien?", browseSkin: "Alle huidverzorgingsproducten", browseHair: "Alle haarverzorgingsproducten",
      hairA: "Voor het haar draait alles om één held: onze dermatologisch geteste, sulfaatvrije shampoo voor de gevoelige, snel geïrriteerde hoofdhuid — mild genoeg voor alle haartypes en dagelijks wassen.",
      shipA: "Verzending is gratis bij elke bestelling — naar alle 27 EU-landen, zelfde prijs, geen kosten. Verzonden vanuit de EU, levering doorgaans in 3–7 werkdagen, klimaatneutraal. 📦",
      retA: "Je hebt het wettelijke herroepingsrecht van 14 dagen vanaf ontvangst van je bestelling. Mail gewoon naar " + MAIL + " met je bestelnummer — geen formulier nodig. Let op: verzegelde, geopende cosmetica is om hygiënische redenen uitgesloten en de retourkosten zijn voor de klant.",
      payA: "We accepteren kaarten, iDEAL, Klarna en SEPA — allemaal veilig verwerkt door Stripe. De betaling is versleuteld; wij zien of bewaren je kaartgegevens nooit. 🔒",
      ingA: "Elke formule is 100% veganistisch, dierproefvrij en onafhankelijk gecertificeerd door ECOCERT COSMOS (de crème is COSMOS Organic). De volledige INCI-lijst staat op elk product en op elke productpagina.",
      ingLinks: [["Ingrediëntengids", "/ingredients.html"], ["Onze certificaten", "/certifications.html"]],
      contactA: "Natuurlijk! Je bereikt het team direct via " + MAIL + " — we antwoorden binnen 1–2 werkdagen. Vermeld bij vragen over een bestelling je bestelnummer.",
      thanksA: "Graag gedaan! 🌿 Kan ik nog iets voor je doen?",
      byeA: "Het beste! Ik ben hier als je me nodig hebt. 🌿",
      fallback: "Ik ben een eenvoudige shopassistent en help alleen met onze producten, huid- & haaradvies, verzending, retourneren, betalen en ingrediënten. Voor al het andere helpt het team via " + MAIL + " je graag verder! Iets uit het menu misschien?",
      humanIntro: "Natuurlijk! Typ je bericht hieronder — het gaat rechtstreeks naar een echt mens van ons team. Antwoorden verschijnen hier — houd dit tabblad open. 💬",
      humanSent: "✓ Bezorgd bij het team. Je kunt altijd details toevoegen — het antwoord verschijnt hier.",
      humanFail: "De livechat is nu even niet bereikbaar — mail ons via " + MAIL + ". We antwoorden binnen 1–2 werkdagen.",
      teamLabel: "Elira-team",
      inputPh: "Typ een vraag…", open: "Chat met Eli", close: "Chat sluiten"
    },
    fi: {
      title: "Eli — Eliran avustaja", online: "Paikalla · vastaa heti",
      hello: "Hei, olen Eli 🌿 — Elira Livingin avustaja. Autan sinua löytämään oikean tuotteen iho- tai hiustyypillesi ja vastaan kysymyksiin toimituksesta, palautuksista, maksamisesta, ainesosista ja sertifikaateistamme. Miten voin auttaa?",
      menu: { skin: "Etsi minulle ihonhoito", hair: "Hiustenhoito-neuvo", ship: "Toimitus", ret: "Palautukset", pay: "Maksaminen", ing: "Ainesosat & sertifikaatit", contact: "Ota yhteys ihmiseen" },
      back: "⌂ Valikko",
      skinQ: "Autan mielelläni! Miten kuvailisit ihoasi?",
      skinOpts: { sensitive: "Herkkä / reaktiivinen", dry: "Kuiva / kiristävä", oily: "Rasvoittuva / sekaiho", normal: "Normaali / tasapainoinen", aging: "Juonteet & kiinteys" },
      agingQ: "Onko ihosi pikemminkin herkkä vai normaali–kuiva?",
      agingOpts: { sensitive: "Pikemminkin herkkä", normalDry: "Normaali–kuiva" },
      recIntro: "Kertomasi perusteella valitsisin tämän:",
      recWhy: {
        "sensitive-moisturizing-cream": "Hajusteeton, glyseriiniä ja betaiinia — tehty reaktiiviselle, helposti ärsyyntyvälle iholle. Rauhoittaa näkyvää punoitusta ja tukee kosteussuojaa.",
        "purifying-toner": "Laventelivettä, kurkkua ja ripaus mietoa salisyylihappoa (BHA) — puhdistaa huokoset ja tasapainottaa kiiltoa rasvoittuvalla ja sekaiholla, ilman kirvelyä.",
        "radiant-glow-cleanser": "Hellävarainen päivittäinen puhdistusaine, joka poistaa meikin ja ylimääräisen rasvan kuivattamatta — iho tuntuu puhtaalta ja raikkaalta, ei koskaan kireältä.",
        "retinol-alternative-serum": "2 % Bidens Pilosaa, kasvipohjainen retinolin vaihtoehto, sekä hyaluronihappoa — silottaa juonteita näkyvästi ilman retinolin tuomaa ärsytystä.",
        "peptide-anti-aging-serum": "2 % heksapeptidi-11:tä, ginkgoa ja hyaluronihappoa — pehmentää juonteita näkyvästi kiinteämmän ja täyteläisemmän tuntuisen ihon puolesta.",
        "sensitive-scalp-shampoo": "Sulfaatiton, miedot kookospohjaiset puhdistusaineet, luumu-uutetta ja lehmuksenkukkaa — lievittää kutinaa ja kireyttä, riittävän hellä päivittäiseen pesuun. Dermatologisesti testattu."
      },
      alsoPair: "Sopii hyvin yhteen tämän kanssa:", view: "Katso tuote →",
      browseLead: "Haluatko nähdä kaiken tyypillesi?", browseSkin: "Kaikki ihonhoitotuotteet", browseHair: "Kaikki hiustenhoitotuotteet",
      hairA: "Hiuksille valikoimamme rakentuu yhden sankarin ympärille: dermatologisesti testattu, sulfaatiton shampoomme herkälle, helposti ärsyyntyvälle hiuspohjalle — riittävän hellä kaikille hiustyypeille ja päivittäiseen pesuun.",
      shipA: "Toimitus on ilmainen jokaisesta tilauksesta — kaikkiin 27 EU-maahan, sama hinta, ei lisämaksuja. Lähetys EU:sta, perillä tyypillisesti 3–7 arkipäivässä, ilmastoneutraalisti. 📦",
      retA: "Sinulla on EU:n lakisääteinen 14 päivän peruuttamisoikeus tilauksen vastaanottamisesta. Lähetä vain sähköpostia osoitteeseen " + MAIL + " ja mainitse tilausnumerosi — lomaketta ei tarvita. Huomio: sinetöity, avattu kosmetiikka on hygieniasyistä rajattu pois, ja palautuskulut maksaa asiakas.",
      payA: "Hyväksymme kortit, iDEALin, Klarnan ja SEPAn — kaikki turvallisesti Stripen kautta. Maksu on salattu; emme koskaan näe tai tallenna korttitietojasi. 🔒",
      ingA: "Jokainen formulaatio on 100 % vegaaninen, eläinkokeeton ja ECOCERT COSMOSin riippumattomasti sertifioima (voide on COSMOS Organic). Täydellinen INCI-luettelo on jokaisessa tuotteessa ja tuotesivulla.",
      ingLinks: [["Ainesosaopas", "/ingredients.html"], ["Sertifikaattimme", "/certifications.html"]],
      contactA: "Toki! Tavoitat tiimin suoraan osoitteesta " + MAIL + " — vastaamme 1–2 arkipäivässä. Tilausta koskevissa kysymyksissä mainitse tilausnumerosi.",
      thanksA: "Ole hyvä! 🌿 Voinko auttaa vielä jossain?",
      byeA: "Kaikkea hyvää! Olen täällä, jos tarvitset minua. 🌿",
      fallback: "Olen yksinkertainen kauppa-avustaja, joten autan vain tuotteissamme, iho- ja hiusneuvonnassa, toimituksessa, palautuksissa, maksamisessa ja ainesosissa. Muissa asioissa tiimi auttaa mielellään: " + MAIL + ". Entä jokin valikosta?",
      humanIntro: "Toki! Kirjoita viestisi alle — se menee suoraan oikealle ihmiselle tiimissämme. Vastaukset ilmestyvät tähän — pidä tämä välilehti auki. 💬",
      humanSent: "✓ Toimitettu tiimille. Voit lisätä yksityiskohtia milloin vain — vastaus ilmestyy tähän.",
      humanFail: "Live-chat ei ole juuri nyt tavoitettavissa — lähetä meille sähköpostia: " + MAIL + ". Vastaamme 1–2 arkipäivässä.",
      teamLabel: "Elira-tiimi",
      inputPh: "Kirjoita kysymys…", open: "Juttele Elin kanssa", close: "Sulje chat"
    }
  };
  var T = I18N[LANG] || I18N.en;

  /* ---- Free-text intent matching (per-language keywords) ---------------- */
  // Order matters: more specific intents first. All lowercase substring tests.
  var INTENTS = [
    ["hair",   ["hair", "scalp", "shampoo", "haar", "kopfhaut", "hoofdhuid", "hius", "hiuspohja", "tukka"]],
    ["ret",    ["return", "refund", "withdraw", "cancel", "rückgabe", "widerruf", "erstattung", "retour", "herroep", "terugbetal", "palautu", "peruut", "hyvity"]],
    ["ship",   ["ship", "deliver", "track", "versand", "liefer", "verzend", "lever", "bezorg", "toimitus", "lähetys", "posti"]],
    ["pay",    ["pay", "klarna", "ideal", "sepa", "card", "zahl", "betaal", "betal", "maksu", "maksa", "kortti", "karte", "kaart"]],
    ["ing",    ["ingredient", "inci", "vegan", "cruelty", "cosmos", "ecocert", "certif", "inhaltsstoff", "tierversuch", "zertif", "ingredi", "dierproef", "certificer", "ainesosa", "sertif", "eläinko", "vegaan"]],
    ["skin",   ["skin", "face", "serum", "cream", "toner", "cleanser", "moistur", "wrinkle", "acne", "redness", "haut", "gesicht", "creme", "falten", "rötung", "huid", "gezicht", "rimpel", "roodheid", "iho", "kasvo", "voide", "juonte", "punoitus", "recommend", "empfehl", "aanrad", "suosittel"]],
    ["contact",["human", "person", "agent", "support", "email", "contact", "mensch", "kundendienst", "mens", "klantenservice", "ihminen", "asiakaspalvelu", "yhteys"]],
    ["thanks", ["thank", "danke", "bedankt", "kiitos", "thx", "merci"]],
    ["bye",    ["bye", "tschüss", "doei", "heippa", "moikka", "ciao"]],
    ["hello",  ["hello", "hi ", "hey", "hallo", "hoi", "hei", "moi", "terve", "guten tag", "goedendag", "päivää"]]
  ];
  function matchIntent(text) {
    var s = " " + text.toLowerCase() + " ";
    for (var i = 0; i < INTENTS.length; i++) {
      var words = INTENTS[i][1];
      for (var j = 0; j < words.length; j++) if (s.indexOf(words[j]) !== -1) return INTENTS[i][0];
    }
    return null;
  }

  /* ---- Live human handoff (via elira-chat Worker → founder's Telegram) --- */
  var CHAT_URL = "https://elira-chat.elira-living.workers.dev";
  var humanMode = false, pollTimer = null, pollTicks = 0;
  function sessionId() {
    try {
      var s = sessionStorage.getItem("eli-sess");
      if (!s) { s = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("eli-sess", s); }
      return s;
    } catch (e) { return "anon" + Date.now().toString(36); }
  }
  function startPoll() {
    if (pollTimer) return;
    pollTicks = 0;
    pollTimer = setInterval(function () {
      if (++pollTicks > 900) { clearInterval(pollTimer); pollTimer = null; return; } // stop after ~1h
      fetch(CHAT_URL + "/poll?session=" + sessionId())
        .then(function (r) { return r.json(); })
        .then(function (j) { (j.messages || []).forEach(teamSay); })
        .catch(function () {});
    }, 4000);
  }
  function sendHuman(text) {
    fetch(CHAT_URL + "/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: sessionId(), text: text, lang: LANG, page: location.pathname })
    }).then(function (r) {
      if (!r.ok) throw 0;
      botSay(T.humanSent); chips([[T.back, exitHuman]]); startPoll();
    }).catch(function () { humanMode = false; botSay(T.humanFail); menu(); });
  }
  function exitHuman() { humanMode = false; menuChips(); } // poller keeps running for late replies

  /* ---- Recommendation map ----------------------------------------------- */
  var RECS = {
    sensitive: { main: "sensitive-moisturizing-cream", pair: "radiant-glow-cleanser" },
    dry:       { main: "sensitive-moisturizing-cream", pair: "peptide-anti-aging-serum" },
    oily:      { main: "purifying-toner",              pair: "radiant-glow-cleanser" },
    normal:    { main: "radiant-glow-cleanser",        pair: "purifying-toner" },
    agingSens: { main: "retinol-alternative-serum",    pair: "sensitive-moisturizing-cream" },
    agingNorm: { main: "peptide-anti-aging-serum",     pair: "radiant-glow-cleanser" },
    hair:      { main: "sensitive-scalp-shampoo",      pair: null }
  };

  /* ---- Styles ------------------------------------------------------------ */
  var css = "" +
    ".eli-btn{position:fixed;right:1.1rem;bottom:1.1rem;z-index:70;width:56px;height:56px;border-radius:50%;border:1px solid rgba(200,162,78,.5);background:#1B2016;color:#C8A24E;cursor:pointer;box-shadow:0 14px 40px -12px rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.22,1,.36,1)}" +
    ".eli-btn:hover{transform:scale(1.08)}" +
    ".eli-btn svg{width:26px;height:26px}" +
    ".eli-panel{position:fixed;right:1.1rem;bottom:5.4rem;z-index:71;width:min(370px,calc(100vw - 2rem));max-height:min(560px,calc(100dvh - 7rem));display:none;flex-direction:column;background:#151A11;border:1px solid rgba(236,231,219,.16);border-radius:14px;overflow:hidden;box-shadow:0 30px 70px -24px rgba(0,0,0,.8);font-family:'Jost',ui-sans-serif,system-ui,sans-serif}" +
    ".eli-panel.open{display:flex}" +
    ".eli-head{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:#1B2016;border-bottom:1px solid rgba(236,231,219,.12)}" +
    ".eli-ava{width:34px;height:34px;border-radius:50%;background:rgba(200,162,78,.15);border:1px solid rgba(200,162,78,.4);display:flex;align-items:center;justify-content:center;color:#C8A24E;font-weight:600;font-size:.9rem}" +
    ".eli-head-t{flex:1;min-width:0}.eli-head-t b{display:block;color:#ECE7DB;font-size:.9rem;font-weight:500}" +
    ".eli-head-t span{display:block;color:#8E8A78;font-size:.7rem}.eli-head-t span::before{content:'●';color:#9DB08A;margin-right:.3rem;font-size:.6rem}" +
    ".eli-x{background:none;border:none;color:#8E8A78;cursor:pointer;font-size:1.2rem;padding:.3rem .5rem}.eli-x:hover{color:#ECE7DB}" +
    ".eli-body{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.55rem;scrollbar-width:thin}" +
    ".eli-msg{max-width:88%;padding:.6rem .85rem;border-radius:12px;font-size:.86rem;line-height:1.55;white-space:pre-line;overflow-wrap:break-word}" +
    ".eli-msg.bot{align-self:flex-start;background:#1B2016;border:1px solid rgba(236,231,219,.1);color:#ECE7DB;border-bottom-left-radius:4px}" +
    ".eli-msg.user{align-self:flex-end;background:rgba(200,162,78,.16);border:1px solid rgba(200,162,78,.3);color:#ECE7DB;border-bottom-right-radius:4px}" +
    ".eli-msg a{color:#C8A24E;text-decoration:underline;text-underline-offset:2px}" +
    ".eli-quick{display:flex;flex-wrap:wrap;gap:.45rem;align-self:flex-start;max-width:95%}" +
    ".eli-chip{background:transparent;border:1px solid rgba(200,162,78,.45);color:#C8A24E;border-radius:999px;padding:.42rem .8rem;font-size:.78rem;cursor:pointer;font-family:inherit;transition:background .25s}" +
    ".eli-chip:hover{background:rgba(200,162,78,.12)}" +
    ".eli-card{align-self:flex-start;width:88%;background:#1B2016;border:1px solid rgba(236,231,219,.12);border-radius:12px;overflow:hidden}" +
    ".eli-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}" +
    ".eli-card-b{padding:.7rem .85rem}" +
    ".eli-card-b b{display:block;color:#ECE7DB;font-size:.88rem;font-weight:500;font-family:'Bodoni Moda',serif}" +
    ".eli-card-b .p{color:#C8A24E;font-size:.85rem;margin:.15rem 0 .3rem;font-family:'Bodoni Moda',serif}" +
    ".eli-card-b .w{color:#C7C1B1;font-size:.78rem;line-height:1.5;margin-bottom:.5rem}" +
    ".eli-card-b a{display:inline-block;color:#C8A24E;font-size:.8rem;text-decoration:underline;text-underline-offset:2px}" +
    ".eli-in{display:flex;gap:.5rem;padding:.7rem;border-top:1px solid rgba(236,231,219,.12);background:#1B2016}" +
    ".eli-in input{flex:1;background:#151A11;border:1px solid rgba(236,231,219,.16);border-radius:8px;color:#ECE7DB;padding:.55rem .75rem;font-size:.85rem;font-family:inherit;outline:none}" +
    ".eli-in input:focus{border-color:rgba(200,162,78,.5)}" +
    ".eli-in button{background:#C8A24E;border:none;border-radius:8px;color:#14160F;padding:.55rem .8rem;cursor:pointer;font-size:.85rem;font-weight:500}" +
    "@media(max-width:480px){.eli-panel{right:.6rem;bottom:4.9rem}.eli-btn{right:.8rem;bottom:.8rem}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- DOM --------------------------------------------------------------- */
  var btn = document.createElement("button");
  btn.className = "eli-btn"; btn.type = "button"; btn.setAttribute("aria-label", T.open);
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.4-.7L3 21l1.85-5.6A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5Z"/></svg>';
  var panel = document.createElement("div");
  panel.className = "eli-panel";
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", T.title);
  panel.innerHTML =
    '<div class="eli-head"><div class="eli-ava">Eli</div><div class="eli-head-t"><b>' + T.title + '</b><span>' + T.online + '</span></div><button class="eli-x" type="button" aria-label="' + T.close + '">✕</button></div>' +
    '<div class="eli-body" data-eli-body></div>' +
    '<form class="eli-in" data-eli-form><input type="text" maxlength="300" placeholder="' + T.inputPh + '" aria-label="' + T.inputPh + '"><button type="submit">➤</button></form>';
  document.body.appendChild(btn);
  document.body.appendChild(panel);
  var body = panel.querySelector("[data-eli-body]");
  var form = panel.querySelector("[data-eli-form]");
  var input = form.querySelector("input");

  /* ---- Chat helpers ------------------------------------------------------ */
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function scroll() { body.scrollTop = body.scrollHeight; }
  function botSay(text, links) {
    var d = document.createElement("div");
    d.className = "eli-msg bot";
    var html = text ? esc(text).replace(esc(MAIL), '<a href="mailto:' + MAIL + '">' + MAIL + "</a>") : "";
    if (links) links.forEach(function (l) { html += (html ? "<br>" : "") + '<a href="' + P + l[1] + '">' + esc(l[0]) + " →</a>"; });
    d.innerHTML = html;
    body.appendChild(d); scroll();
  }
  function teamSay(text) {
    var d = document.createElement("div");
    d.className = "eli-msg bot";
    d.innerHTML = '<span style="display:block;font-size:.68rem;letter-spacing:.06em;color:#C8A24E;margin-bottom:.2rem">' + esc(T.teamLabel) + "</span>" + esc(text);
    body.appendChild(d); scroll();
  }
  function userSay(text) {
    var d = document.createElement("div");
    d.className = "eli-msg user"; d.textContent = text;
    body.appendChild(d); scroll();
  }
  function clearChips() { var q = body.querySelector(".eli-quick"); if (q) q.remove(); }
  function chips(list) {
    clearChips();
    var w = document.createElement("div"); w.className = "eli-quick";
    list.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "eli-chip"; b.textContent = it[0];
      b.addEventListener("click", function () { clearChips(); userSay(it[0]); it[1](); });
      w.appendChild(b);
    });
    body.appendChild(w); scroll();
  }
  function productCard(id) {
    var p = CAT.getProduct(id); if (!p) return;
    var d = document.createElement("div");
    d.className = "eli-card";
    d.innerHTML = '<img src="' + pimg(id) + '" alt="' + esc(pname(id)) + '" loading="lazy">' +
      '<div class="eli-card-b"><b>' + esc(pname(id)) + '</b><div class="p">' + fmt(p.price) + '</div>' +
      '<div class="w">' + esc(T.recWhy[id] || "") + '</div>' +
      '<a href="' + P + "/products/" + id + '.html">' + T.view + "</a></div>";
    body.appendChild(d); scroll();
  }

  /* ---- Flows ------------------------------------------------------------- */
  function menuChips(withBack) {
    var m = T.menu;
    var list = [
      [m.skin, skinFlow], [m.hair, hairFlow], [m.ship, function () { answer("shipA"); }],
      [m.ret, function () { answer("retA"); }], [m.pay, function () { answer("payA"); }],
      [m.ing, function () { botSay(T.ingA, T.ingLinks); menu(); }], [m.contact, humanFlow]
    ];
    chips(list);
  }
  function menu() { setTimeout(menuChips, 150); }
  function answer(key) { botSay(T[key]); menu(); }
  function recommend(key) {
    var r = RECS[key];
    botSay(T.recIntro);
    productCard(r.main);
    if (r.pair) { botSay(T.alsoPair); productCard(r.pair); }
    // Link to the full filtered shop page for that category so they can browse more.
    var cat = (key === "hair") ? "haircare" : "skincare";
    botSay(T.browseLead, [[cat === "haircare" ? T.browseHair : T.browseSkin, "/shop.html?category=" + cat]]);
    menu();
  }
  function skinFlow() {
    botSay(T.skinQ);
    var o = T.skinOpts;
    chips([
      [o.sensitive, function () { recommend("sensitive"); }],
      [o.dry, function () { recommend("dry"); }],
      [o.oily, function () { recommend("oily"); }],
      [o.normal, function () { recommend("normal"); }],
      [o.aging, agingFlow]
    ]);
  }
  function agingFlow() {
    botSay(T.agingQ);
    var o = T.agingOpts;
    chips([
      [o.sensitive, function () { recommend("agingSens"); }],
      [o.normalDry, function () { recommend("agingNorm"); }]
    ]);
  }
  function hairFlow() { botSay(T.hairA); recommend("hair"); }
  function humanFlow() { humanMode = true; botSay(T.humanIntro); chips([[T.back, exitHuman]]); }

  function handleFree(text) {
    var intent = matchIntent(text);
    switch (intent) {
      case "skin": skinFlow(); break;
      case "hair": hairFlow(); break;
      case "ship": answer("shipA"); break;
      case "ret": answer("retA"); break;
      case "pay": answer("payA"); break;
      case "ing": botSay(T.ingA, T.ingLinks); menu(); break;
      case "contact": humanFlow(); break;
      case "thanks": botSay(T.thanksA); menu(); break;
      case "bye": botSay(T.byeA); menu(); break;
      case "hello": botSay(T.hello); menu(); break;
      default: botSay(T.fallback); menu();
    }
  }

  /* ---- Wire-up ----------------------------------------------------------- */
  var started = false;
  function open() {
    panel.classList.add("open");
    if (!started) { started = true; botSay(T.hello); menuChips(); }
    input.focus();
  }
  function close() { panel.classList.remove("open"); }
  btn.addEventListener("click", function () { panel.classList.contains("open") ? close() : open(); });
  panel.querySelector(".eli-x").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value.trim(); if (!v) return;
    input.value = ""; clearChips(); userSay(v);
    if (humanMode) { sendHuman(v); return; }
    setTimeout(function () { handleFree(v); }, 250);
  });
})();
