/* =========================================================================
   ELIRA LIVING — content file (FI). UI strings, product names/descriptions,
   page copy. Product PRICES, IMAGES and SKUs live in /assets/data/catalog.js.
   INCI ingredient names are international nomenclature and kept verbatim;
   only the surrounding prose is translated.
   ========================================================================= */
(function (root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (typeof window !== "undefined") window.CONTENT = data;
})(this, function () {
  return {
  "lang": "fi",
  "meta": {
    "home": {
      "title": "Elira Living | Luonnollinen vegaaninen iho- ja hiustenhoito — COSMOS-sertifioitu",
      "description": "Vegaaninen, ECOCERT COSMOS -sertifioitu luonnollinen iho- ja hiustenhoito. Eläinkokeeton, valmistettu EU:ssa. Ilmainen ilmastoneutraali toimitus koko EU:hun.",
      "keywords": "luonnollinen ihonhoito, vegaaninen ihonhoito, COSMOS-sertifioitu, luomu ihonhoito, luonnollinen hiustenhoito, eläinkokeeton kosmetiikka, puhdas kauneus, ECOCERT, valmistettu EU:ssa, vegaaninen shampoo, kasvovesi"
    },
    "shop": {
      "title": "Osta luonnollista iho- ja hiustenhoitoa | Elira Living",
      "description": "Tutustu Elira Livingin koko vegaaniseen, COSMOS-sertifioituun iho- ja hiustenhoitovalikoimaan. Puhdistusaineet, kasvovedet, kosteusvoiteet ja shampoo — eläinkokeeton ja valmistettu EU:ssa.",
      "keywords": "osta luonnollista ihonhoitoa, vegaaninen ihonhoito, COSMOS-sertifioidut tuotteet, luonnollinen hiustenhoito, kasvojenpuhdistusaine, kasvovesi, kosteusvoide, herkän hiuspohjan shampoo, puhdas kauneus"
    },
    "about": {
      "title": "Tietoa Elira Livingistä | Puhdas kauneus, valmistettu Euroopassa",
      "description": "Elira Living valmistaa vegaanista, ECOCERT COSMOS -sertifioitua iho- ja hiustenhoitoa — puhtaita, tehokkaita formulaatioita, jotka pohjautuvat luontoon ja jotka on valmistettu vastuullisesti EU:ssa.",
      "keywords": "tietoa Elira Livingistä, puhtaan kauneuden brändi, vegaaninen kosmetiikka Eurooppa, ECOCERT COSMOS, kestävä ihonhoito, luonnollinen kauneus"
    },
    "productShippingNote": "Vegaaninen, ECOCERT COSMOS -sertifioitu. Ilmainen toimitus koko EU:hun jokaisesta tilauksesta.",
    "impressum": {
      "title": "Impressum / Oikeudellinen huomautus | Elira Living"
    },
    "privacy": {
      "title": "Tietosuojaseloste | Elira Living"
    },
    "terms": {
      "title": "Käyttöehdot | Elira Living"
    },
    "withdrawal": {
      "title": "Peruuttamisoikeus | Elira Living"
    },
    "cart": {
      "title": "Ostoskori | Elira Living"
    },
    "success": {
      "title": "Kiitos | Elira Living"
    },
    "cancel": {
      "title": "Maksu peruutettu | Elira Living"
    },
    "certifications": {
      "title": "Sertifikaattimme | ECOCERT COSMOS, vegaaninen ja muut | Elira Living",
      "description": "Jokainen Elira Living -tuote on riippumattomasti auditoitu ja sertifioitu — ECOCERT COSMOS Organic & Natural, 100 % vegaaninen, eläinkokeeton ja valmistettu GMP-sertifioiduissa olosuhteissa.",
      "keywords": "ECOCERT COSMOS sertifioitu ihonhoito, COSMOS Natural, COSMOS Organic, vegaaninen sertifioitu kosmetiikka, eläinkokeeton ihonhoito, GMP-sertifioitu kosmetiikka, B Corp kauneusbrändi, Bureau Veritas vahvistettu"
    }
  },
  "ui": {
    "meta.langName": "Suomi",
    "nav.shop": "Kauppa",
    "nav.skincare": "Ihonhoito",
    "nav.haircare": "Hiustenhoito",
    "nav.about": "Tietoa meistä",
    "nav.ingredients": "Tietoa ainesosista",
    "nav.certifications": "Sertifikaatit",
    "trust.kicker": "Aitoja rutiineja",
    "trust.title": "Tehty oikealle iholle, oikeaan elämään",
    "trust.lead": "Ensimmäisestä puhdistuksesta iltaseerumiin — Elira sopii huomaamattomasti arjen rutiineihin kaikkialla EU:ssa.",
    "nav.cart": "Ostoskori",
    "announce.1": "Ilmainen toimitus koko EU:hun — jokaisesta tilauksesta",
    "announce.2": "Ilmastoneutraali toimitus · 3–7 arkipäivää",
    "announce.3": "Vegaaninen & eläinkokeeton",
    "hero.kicker": "Puhdasta kauneutta, sertifioitua",
    "hero.title1": "Luonnollisesti sertifioitu",
    "hero.title2": "iho- & hiustenhoito.",
    "hero.lead": "Vegaanisia, ECOCERT COSMOS -sertifioituja formulaatioita — hellävaraisia, tehokkaita ja valmistettu Euroopassa.",
    "hero.cta": "Tutustu valikoimaan",
    "hero.cta2": "Tarinamme",
    "hero.shipNote": "Ilmainen toimitus kaikkiin 27 EU-maahan",
    "hero.shipNoteExtra": "sama hinta, ei lisämaksuja",
    "hero.badge1": "COSMOS",
    "hero.badge2": "Luonnollinen sertifiointi",
    "chapter.kicker": "Kosteusvoide",
    "chapter.head1": "Rauhoittaa herkkyyttä.",
    "chapter.head2": "Pehmentää punoitusta.",
    "chapter.head3": "Mukava iho.",
    "chapter.cta": "Tutustu voiteeseen",
    "ing.1.t": "Rauhoittaa",
    "ing.1.d": "Rauhoittaa reaktiivista, helposti ärsyyntyvää ihoa heti.",
    "ing.2.t": "Vähentää punoitusta",
    "ing.2.d": "Pehmentää näkyvästi punoitusta ja läiskäisyyttä ajan myötä.",
    "ing.3.t": "Suojakerroksen tuki",
    "ing.3.d": "Vahvistaa ihon luonnollista kosteussuojaa.",
    "cert.kicker": "Sertifioidusti puhdas",
    "cert.title": "Luonnon sertifioima.",
    "cert.lead": "Riippumattomasti vahvistanut ECOCERT COSMOS. Vegaaninen, eläinkokeeton ja valmistettu EU:ssa.",
    "marq.vegan": "100 % vegaaninen",
    "marq.cosmos": "ECOCERT COSMOS Natural",
    "marq.made": "Valmistettu EU:ssa",
    "marq.derm": "Dermatologisesti testattu",
    "marq.cruelty": "Eläinkokeeton",
    "marq.fragrance": "Hajusteettomia vaihtoehtoja",
    "cat.title": "Osta kategorioittain",
    "cat.kicker": "Valikoima",
    "cat.skincare": "Ihonhoito",
    "cat.haircare": "Hiustenhoito",
    "best.kicker": "Mallisto",
    "best.title": "Puhdasta, sertifioitua, tehokasta",
    "best.lead": "Jokainen formulaatio on vegaaninen ja ECOCERT COSMOS -sertifioitu — hellä iholle ja planeetalle.",
    "best.viewall": "Näytä kaikki tuotteet",
    "story.kicker": "Filosofiamme",
    "story.title": "Puhdasta kauneutta ilman kompromisseja.",
    "story.body": "Elira Living valmistaa luonnollisesti sertifioitua iho- ja hiustenhoitoa kaikille. Ei kovia kemikaaleja, ei eläinkokeita — vain puhtaita, tehokkaita formulaatioita, jotka ECOCERT COSMOS on sertifioinut ja jotka on valmistettu Euroopassa.",
    "story.p1": "ECOCERT COSMOS -sertifioitu",
    "story.p2": "100 % vegaaninen & eläinkokeeton",
    "story.p3": "Valmistettu vastuullisesti EU:ssa",
    "story.cta": "Lue lisää meistä",
    "value.1.t": "Vegaaninen & puhdas",
    "value.1.d": "Ei parabeeneja, sulfaatteja eikä eläinkokeita — aina.",
    "value.2.t": "Ilmastoneutraali",
    "value.2.d": "Hiilikompensoitu toimitus koko EU:hun.",
    "value.3.t": "COSMOS-sertifioitu",
    "value.3.d": "ECOCERT COSMOS riippumattomasti sertifioinut luonnolliseksi.",
    "value.4.t": "Maksa turvallisesti",
    "value.4.d": "Salattu maksu Stripen kautta. Sisältää ostajansuojan.",
    "news.kicker": "Uutiskirje",
    "news.title": "10 % alennus ensimmäisestä tilauksesta",
    "news.lead": "Tilaa uutiskirje saadaksesi ennakkopääsyn, rituaalit ja tarinat formulaatioiden takana.",
    "news.placeholder": "Sähköpostiosoite",
    "news.btn": "Tilaa",
    "news.consent": "Tilaamalla hyväksyt tietosuojaselosteemme.",
    "news.thanks": "Tervetuloa Elira Livingiin — tarkista sähköpostisi.",
    "foot.tag": "Luonnollisesti sertifioitua iho- & hiustenhoitoa.",
    "foot.shop": "Kauppa",
    "foot.help": "Apua",
    "foot.company": "Yritys",
    "foot.shipping": "Toimitus & palautukset",
    "foot.contact": "Yhteystiedot",
    "foot.faq": "Käyttöehdot",
    "foot.about": "Tietoa meistä",
    "foot.sustain": "Vastuullisuus",
    "foot.press": "Sertifiointi",
    "foot.privacy": "Tietosuoja",
    "foot.terms": "Käyttöehdot",
    "foot.withdrawal": "Peruuttaminen",
    "foot.imprint": "Impressum",
    "foot.rights": "Kaikki oikeudet pidätetään.",
    "foot.businessId": "Y-tunnus 3526013-6",
    "shop.title": "Kauppa",
    "shop.lead": "Koko valikoima — suodata kategorian mukaan.",
    "shop.all": "Kaikki",
    "shop.results": "tuotetta",
    "shop.sort.featured": "Suositellut",
    "shop.sort.priceAsc": "Hinta: edullisin ensin",
    "shop.sort.priceDesc": "Hinta: kallein ensin",
    "shop.sort.name": "Aakkosjärjestys",
    "shop.empty": "Tuotteita ei löytynyt.",
    "pdp.add": "Lisää ostoskoriin",
    "pdp.buy": "Osta heti",
    "pdp.shade": "Vaihtoehto",
    "pdp.size": "Koko",
    "pdp.qty": "Määrä",
    "pdp.details": "Tiedot",
    "pdp.ingredients": "Ainesosat (INCI)",
    "pdp.shipping": "Toimitus",
    "pdp.shippingText": "Ilmainen, ilmastoneutraali toimitus koko EU:hun jokaisesta tilauksesta — sama hinta, ei toimitusmaksua. Lähetetään EU:sta, tyypillisesti 3–7 arkipäivää.",
    "pdp.related": "Saatat myös pitää",
    "pdp.back": "Takaisin kauppaan",
    "cart.title": "Ostoskori",
    "cart.empty": "Ostoskorisi on tyhjä.",
    "cart.continue": "Jatka ostoksia",
    "cart.subtotal": "Välisumma",
    "cart.shipping": "Toimitus",
    "cart.shippingFree": "Ilmainen",
    "cart.total": "Yhteensä",
    "cart.checkout": "Kassalle",
    "cart.remove": "Poista",
    "cart.securenote": "Turvallinen maksu Stripen kautta · Visa, Mastercard, iDEAL, Klarna, SEPA",
    "cart.save.title": "Saat 10 % alennuksen — lähetämme ostoskorisi sähköpostiin",
    "cart.save.consent": "Lisää sähköpostiosoitteesi tallentaaksesi ostoskorisi ja saadaksesi muistutuksia sekä satunnaisia tarjouksia. Voit peruuttaa tilauksen milloin tahansa.",
    "cart.save.saved": "Tallennettu — muistutamme, jos et tee tilausta. ✓",
    "form.firstName": "Etunimi",
    "cart.xsell": "Täydennä rituaalisi",
    "cart.add": "Lisää",
    "cart.freeProgress": "{amount} ilmaiseen toimitukseen",
    "cart.freeReached": "Ilmainen toimitus sisältyy tilaukseesi ✓",
    "toast.added": "Lisätty ostoskoriin",
    "product.seeMore": "Näytä lisää",
    "product.seeLess": "Näytä vähemmän",
    "success.title": "Kiitos tilauksestasi!",
    "success.lead": "Vahvistus on lähetetty sähköpostiisi. Elira Living -tuotteesi ovat matkalla.",
    "success.cta": "Jatka ostoksia",
    "cancel.title": "Maksu peruutettu",
    "cancel.lead": "Ei hätää — ostoskorisi on tallennettu. Voit viimeistellä tilauksesi milloin tahansa.",
    "cancel.cta": "Takaisin ostoskoriin",
    "about.kicker": "Tietoa Elira Livingistä",
    "about.title": "Puhdasta kauneutta, valmistettu Euroopassa.",
    "about.lead": "Valmistamme luonnollisesti sertifioitua iho- ja hiustenhoitoa — ilman kompromisseja.",
    "about.body1": "Elira Living sai alkunsa turhautumisesta, jonka moni kokee hiljaa: iho, joka reagoi lähes kaikkeen. Tuotteet, jotka lupasivat aitoja tuloksia, jättivät usein jälkeensä punoitusta, kireyttä ja ärsytystä — ja hellävaraiset tuntuivat harvoin tekevän yhtään mitään.",
    "about.body2": "Emme uskoneet, että sinun pitäisi valita toimivan ja hellävaraisen tuotteen välillä. Niinpä ryhdyimme tekemään iho- ja hiustenhoitoa, joka on aidosti hellävaraista ja aidosti tehokasta — vegaanista, ECOCERT COSMOSin riippumattomasti sertifioimaa ja vastuullisesti Euroopassa valmistettua.",
    "about.stat1": "Luonnollista alkuperää",
    "about.stat2": "Vegaanisia formulaatioita",
    "about.stat3": "Eläinkokeita",
    "about.cta": "Osta nyt",
    "about.storyKicker": "Tarinamme",
    "about.storyTitle": "Syntynyt herkästä ihosta.",
    "about.story1": "Vuosien ajan tuntui mahdottomalta löytää tuotteita, jotka eivät kirvelleet, punoittaneet tai hilseilleet. Hyllyt olivat täynnä lupauksia — \"kirkastava\", \"tehokas\", \"kliininen\" — mutta reaktiiviselle iholle se voima tarkoitti liian usein suojakerrosta, joka jäi ärtyneeksi ja tyytymättömäksi.",
    "about.story2": "Elira Living on vastaus, jonka olisimme toivoneet saavamme: puhtaita, sertifioituja formulaatioita, jotka kunnioittavat ihoa sen sijaan että taistelisivat sitä vastaan. Ei kovia oikoteitä, ei eläinkokeita, ei mitään piiloteltavaa etiketissä — vain rehellisiä tuotteita, joihin voit luottaa, tehty kaikille, joiden iho on joskus tuntenut jäävänsä ulkopuolelle.",
    "about.quote": "Tehokkaan kauneuden ei pitäisi tulla ihosi, terveytesi tai planeetan kustannuksella.",
    "about.quoteAuthor": "— Elira Living -tiimi",
    "about.values1Title": "Hellävarainen jo suunnittelultaan",
    "about.values1Body": "Hajustetta harkitsevia, suojakerros edellä rakennettuja formulaatioita reagoivalle iholle.",
    "about.values2Title": "Rehellisesti sertifioitu",
    "about.values2Body": "ECOCERT COSMOSin riippumattomasti vahvistama — ei vain \"puhdas\" muotisanana.",
    "about.values3Title": "Valmistettu vastuullisesti",
    "about.values3Body": "Vegaaninen, eläinkokeeton ja valmistettu EU:ssa, toimitettu ilmastoneutraalisti ovellesi."
  },
  "features": {
    "vegan": "Vegaaninen",
    "cosmosOrganic": "COSMOS Organic",
    "cosmosNatural": "COSMOS Natural",
    "fragranceFree": "Hajusteeton",
    "sensitiveSkin": "Herkkä iho",
    "dailyUse": "Päivittäiseen käyttöön",
    "allSkin": "Kaikille ihotyypeille",
    "oilyComb": "Rasvoittuva / sekaiho",
    "derm": "Dermatologisesti testattu",
    "allHair": "Kaikille hiustyypeille",
    "antiAging": "Ikääntymistä ehkäisevä",
    "normalDry": "Normaali / kuiva iho"
  },
  "products": {
    "sensitive-moisturizing-cream": {
      "name": "Herkän ihon kosteusvoide",
      "desc": "Hajusteeton kosteusvoide, jossa ihoa hoitava glyseriini ja betaiini kylläävät reaktiivisen ihon pitkäkestoisella kosteudella. Rauhoittaa punoitusta ja vahvistaa kestävämpää suojakerrosta jokaisella käytöllä — jättäen ihon pehmeäksi, mukavaksi eikä koskaan kireäksi. ECOCERT COSMOS Organic, vegaaninen, herkälle iholle.",
      "ingredients": "Vegaaninen · ECOCERT COSMOS Organic -sertifioitu · Hajusteeton. Täydellinen INCI-luettelo on painettu tuotepakkaukseen."
    },
    "radiant-glow-cleanser": {
      "name": "Radiant Glow -kasvojenpuhdistusaine",
      "desc": "Hellävarainen päivittäinen puhdistusaine, joka sulattaa pois meikin, epäpuhtaudet ja ylimääräisen rasvan kuivattamatta ihoa. Jättää ihon puhtaaksi, raikkaaksi ja näkyvästi säteileväksi — ei koskaan kireäksi — joten sitä on ilo käyttää aamuin illoin. COSMOS Natural, vegaaninen, kaikille ihotyypeille.",
      "ingredients": "Vegaaninen · ECOCERT COSMOS Natural -sertifioitu. Täydellinen INCI-luettelo on painettu tuotepakkaukseen."
    },
    "purifying-toner": {
      "name": "Puhdistava kasvovesi",
      "desc": "Puhdistava kasvovesi, jossa rauhoittava laventelivesi, kosteuttava kurkku ja ripaus hellävaraista salisyylihappoa (BHA) avaa huokoset ja tasapainottaa rasvoittuvaa, sekaihoa. Hienostaa ja virkistää sileämmäksi, tasaisemmaksi ja kiilteettömäksi lopputulokseksi — ilman kirvelyä. 99 % luonnollista alkuperää, hajusteeton, COSMOS Natural, vegaaninen.",
      "ingredients": "Aqua, Alcohol, Lavandula Angustifolia (Lavender) Flower Water*, Glycerin**, Betaine, Propanediol, Acorus Calamus (Sweet Flag) Root Extract*, Cucumis Sativus (Cucumber) Fruit Extract*, Salicylic Acid, Benzyl Alcohol, Sodium Benzoate, Potassium Sorbate, Rhamnose, Glucose, Glucuronic Acid.  *luomuviljelystä  **valmistettu luomuainesosista · 99 % luonnollista alkuperää · ECOCERT COSMOS Natural."
    },
    "sensitive-scalp-shampoo": {
      "name": "Herkän hiuspohjan shampoo",
      "desc": "Hellävarainen, sulfaatiton shampoo, jossa mietoja kookospohjaisia puhdistusaineita, ravitsevaa luumu-uutetta ja rauhoittavaa lehmuksenkukkaa herkälle, helposti ärsyyntyvälle hiuspohjalle. Lievittää kutinaa ja kireyttä jättäen hiukset pehmeiksi, puhtaiksi ja helposti hallittaviksi — riittävän hellä päivittäiseen pesuun. Dermatologisesti testattu, 98 % luonnollista alkuperää, COSMOS Natural, vegaaninen, kaikille hiustyypeille.",
      "ingredients": "Aqua, Sodium Coco-Sulfate, Cocamidopropyl Betaine, Coco-Glucoside, Betaine, Glyceryl Oleate, Prunus Domestica (Plum) Fruit Extract*, Sodium Chloride, Citric Acid, Parfum, Benzyl Alcohol, Hydrolyzed Wheat Protein, Tilia Cordata (Linden) Flower Extract*, Sodium Benzoate, Potassium Sorbate, Jasminum Officinale (Jasmin) Extract, Leuconostoc/Radish Root Ferment Filtrate.  *luomuviljelystä · 98 % luonnollista alkuperää · ECOCERT COSMOS Natural."
    },
    "retinol-alternative-serum": {
      "name": "Retinolin vaihtoehto -seerumi",
      "desc": "Hellävarainen luonnollinen ikääntymistä ehkäisevä seerumi, jossa 2 % Bidens Pilosaa — kasvipohjainen retinolin vaihtoehto — sekä hyaluronihappoa. Hienostaa näkyvästi ihon pintaa ja pehmentää juonteita ja tummia läiskiä ilman ärsytystä. COSMOS Natural, vegaaninen, kaikille ihotyypeille.",
      "ingredients": "Aloe Barbadensis (Aloe) Leaf Juice*, Glycerin**, Simmondsia Chinensis (Jojoba) Seed Oil*, Pentylene Glycol, Polyglyceryl-6 Stearate, Cetearyl Alcohol, Propanediol, Dicaprylyl Carbonate, Astrocaryum Murumuru Seed Butter, Gossypium Herbaceum Seed Oil, Isoamyl Laurate, Bidens Pilosa Extract, Polyglyceryl-6 Behenate, Linum Usitatissimum Seed Oil, Parfum/Fragrance, Cellulose, Aqua/Water, Hippophae Rhamnoides (Sea Buckthorn) Fruit Extract*, Lactic Acid, Xanthan Gum, Rhodomyrtus Tomentosa (Rose Myrtle) Fruit Extract, Caprylic/Capric Triglyceride, Rosa Canina (Rosehip) Fruit Oil*, Mangifera Indica (Mango) Seed Butter*, Hydrolyzed Hyaluronic Acid, Sodium Hyaluronate, Sodium Phytate, Octyldodecanol, Tocopherol, Geraniol***, Citronellol***, Pelargonium Graveolens Flower Oil, Linalool***, Citral***.  *luomuviljelystä  **valmistettu luomuainesosista  ***luonnollisista eteerisistä öljyistä · 99 % luonnollista alkuperää · 24 % luomua · COSMOS Natural, sertifioinut ECOCERT Greenlife."
    },
    "peptide-anti-aging-serum": {
      "name": "Peptidi anti-age -seerumi",
      "desc": "Ylellinen silottava seerumi, jossa 2 % heksapeptidi-11:tä ja 1 % Ginkgo Bilobaa, sekä hyaluronihappoa ja antioksidanttipitoisia mustikan- ja mansikansiemenöljyjä. Pehmentää näkyvästi juonteita ja ryppyjä täyteläisemmän, kiinteämmän ja joustavamman ihon puolesta — herkän kukkaisella tuoksulla. COSMOS Natural, vegaaninen, normaalille ja kuivalle iholle.",
      "ingredients": "Aloe Barbadensis (Aloe) Leaf Juice*, Glycerin, Simmondsia Chinensis (Jojoba) Seed Oil*, Aqua/Water, Pentylene Glycol, Cetearyl Alcohol, Sodium PCA, Isoamyl Laurate, Glyceryl Stearate Citrate, Dipalmitoyl Hydroxyproline, Propanediol, Parfum/Fragrance, Caprylic/Capric Triglyceride, Fragaria Ananassa (Strawberry) Seed Oil, Vaccinium Myrtillus (Blueberry) Seed Oil*, Xanthan Gum, Hexapeptide-11, Phytosterols, Ricinus Communis (Castor) Seed Oil*, Ascorbyl Palmitate, Hydrolyzed Hyaluronic Acid, Potassium Hydroxide, Sodium Hyaluronate, Sodium Phytate, Tocopherol, Leuconostoc/Radish Root Ferment Filtrate, Ginkgo Biloba Leaf Extract, CI 77491 (Iron Oxides), Citric Acid, Sodium Benzoate, Potassium Sorbate, Glycolipids, Linalool***, Geraniol***, Citronellol***.  *luomuviljelystä  ***luonnollisista eteerisistä öljyistä · 99 % luonnollista alkuperää · 20 % luomua · COSMOS Natural, sertifioinut ECOCERT Greenlife."
    }
  }
};
});
