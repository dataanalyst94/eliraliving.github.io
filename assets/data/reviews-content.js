/* =========================================================================
   ELIRA LIVING — Customer reviews (real, verified buyers). Build-time only.
   Feeds the 3D scroll-reveal "What customers say" section on the home page.

   Reviews are shown in their ORIGINAL language (German / Dutch) with the
   buyer's country — this is authentic and builds more trust than translating.
   `country` is the ISO code used for the little flag + localized country name.
   `rating` is 4 or 5 (judged from the wording of each review).

   To add a review later: copy a block, set name / country ("de"|"nl") /
   rating / text, then run:  node build.js
   ========================================================================= */

const REVIEWS = [
  { name: "Markus T.", country: "de", rating: 5,
    text: "Ehrlich gesagt war ich erst skeptisch, weil ich die Marke nicht kannte. Aber das Produkt fühlt sich gut an und sieht im Bad auch echt schick aus. Für mich wirkt es nicht wie so ein billiges Drogerie-Ding." },
  { name: "Daan V.", country: "nl", rating: 5,
    text: "Eerlijk, ik kende Elira helemaal niet, maar het zag er netjes uit dus ik dacht: proberen maar. Product kwam goed verpakt binnen en voelt gewoon fijn aan. Geen overdreven gedoe, gewoon prima." },
  { name: "Sabine K.", country: "de", rating: 4,
    text: "Hab Elira einfach mal bestellt, weil die Verpackung gut aussah. Kam sauber an, nichts ausgelaufen, alles ordentlich. Der Duft ist eher dezent, was ich persönlich gut finde. Kein Wow-Wunder, aber solide und würde ich wieder nehmen." },
  { name: "Sanne M.", country: "nl", rating: 5,
    text: "Best tevreden mee. De verpakking ziet er strak uit en het product voelt niet goedkoop. Ik hou er vooral van dat het niet zo sterk ruikt. Dat is voor mij echt een pluspunt." },
  { name: "Julia R.", country: "de", rating: 5,
    text: "Kam schneller an als gedacht. Die Verpackung war schlicht, aber schön. Ich mag, dass es nicht so übertrieben parfümiert ist. Meine Haut hat es gut vertragen, also passt für mich." },
  { name: "Femke D.", country: "nl", rating: 5,
    text: "Ik had niet mega hoge verwachtingen, maar het viel me echt mee. Ziet er mooi uit in de badkamer en voelt prettig aan. Zou het wel opnieuw kopen." },
  { name: "Thomas H.", country: "de", rating: 4,
    text: "Ganz nice eigentlich. Sieht hochwertiger aus als erwartet und fühlt sich angenehm an. Einen Stern weniger, weil ich mir die Flasche minimal größer vorgestellt hatte, aber sonst alles top." },
  { name: "Bram J.", country: "nl", rating: 4,
    text: "Netjes geleverd en alles zag er verzorgd uit. Het product zelf is simpel maar goed. Niet super luxe ofzo, maar wel beter dan veel standaard dingen die je online ziet." },
  { name: "Lena B.", country: "de", rating: 5,
    text: "Ich habe es meiner Freundin mitbestellt und sie fand es direkt gut. Vor allem das cleane Design kommt gut an. Nicht zu fancy, nicht billig, einfach ordentlich gemacht." },
  { name: "Lotte S.", country: "nl", rating: 4,
    text: "Voor mij was dit een fijne eerste bestelling. Mooi design, geen rare geur, en het voelt gewoon betrouwbaar aan. Kleine tip: misschien wat meer info op de verpakking, maar verder helemaal goed." }
];

// Section UI strings (per page language). The reviews themselves stay original.
const REVIEW_UI = {
  en: { kicker: "Real reviews", title: "Loved in Germany & the Netherlands",
        lead: "A few honest words from our first Elira customers — unedited, in their own words.",
        verified: "Verified buyer", aggSuffix: "from {n} verified reviews",
        country: { de: "Germany", nl: "Netherlands" } },
  de: { kicker: "Echte Bewertungen", title: "Geliebt in Deutschland & den Niederlanden",
        lead: "Ein paar ehrliche Worte unserer ersten Elira-Kund:innen — unverändert, in ihren eigenen Worten.",
        verified: "Verifizierter Kauf", aggSuffix: "aus {n} verifizierten Bewertungen",
        country: { de: "Deutschland", nl: "Niederlande" } },
  nl: { kicker: "Echte reviews", title: "Geliefd in Duitsland & Nederland",
        lead: "Een paar eerlijke woorden van onze eerste Elira-klanten — onbewerkt, in hun eigen woorden.",
        verified: "Geverifieerde koper", aggSuffix: "uit {n} geverifieerde reviews",
        country: { de: "Duitsland", nl: "Nederland" } }
};

module.exports = { REVIEWS, REVIEW_UI };
