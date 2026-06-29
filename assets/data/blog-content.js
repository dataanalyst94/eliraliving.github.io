/* =========================================================================
   ELIRA LIVING — Blog / Journal data (build-time only, Node).
   - BLOG_UI: trilingual labels for the blog index + post pages.
   - POSTS:   loaded from JSON files in assets/data/blog/*.json so the
              generator (tools/gen-blog.js) can drop a new post by writing a
              single file — no source rewriting. Each JSON file = one post.
   Post shape:
     {
       "slug": "kebab-case",
       "category": "skincare" | "haircare",
       "image": "/assets/img/....jpg",
       "date": "YYYY-MM-DD",            // published
       "updated": "YYYY-MM-DD",         // optional
       "related": ["product-id", ...],  // internal links
       "i18n": {
         "en": { "title","description","keywords","excerpt","readMins",
                 "body":[ {type,text|items|id} ], "faq":[ {q,a} ] },
         "de": {...}, "nl": {...}
       }
     }
   Body block types: p | h2 | h3 | ul | ol | quote | product
   Edit / add posts, then:  node build.js
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "blog");

const BLOG_UI = {
  en: {
    nav: "Journal",
    indexTitle: "The Elira Journal — Natural Skincare Guides & Ingredient Stories | Elira Living",
    indexDescription: "Expert, jargon-free guides to vegan, natural skincare and haircare — sensitive-skin routines, ingredient explainers and clean-beauty advice from Elira Living.",
    indexKeywords: "natural skincare blog, vegan skincare guide, sensitive skin routine, clean beauty journal, salicylic acid, ingredient guide, COSMOS skincare, sensitive scalp",
    kicker: "The Journal",
    heading: "Skincare guides & ingredient stories",
    lead: "Expert, jargon-free guidance on natural, vegan skincare and haircare — and the certified ingredients behind every Elira Living formula.",
    readMore: "Read article",
    empty: "New articles are on the way.",
    back: "All articles",
    crumbHome: "Home",
    minRead: "min read",
    published: "Published",
    updated: "Updated",
    related: "Featured in this guide",
    shopCta: "Shop the range",
    faqHeading: "Frequently asked questions",
    toc: "In this guide",
    learn: "Learn more"
  },
  de: {
    nav: "Journal",
    indexTitle: "Das Elira Journal — Naturkosmetik-Ratgeber & Inhaltsstoffe | Elira Living",
    indexDescription: "Verständliche Experten-Ratgeber zu veganer Naturkosmetik für Haut & Haar — Pflege für empfindliche Haut, Inhaltsstoffe einfach erklärt und Clean-Beauty-Tipps von Elira Living.",
    indexKeywords: "Naturkosmetik Blog, vegane Hautpflege Ratgeber, empfindliche Haut Routine, Clean Beauty, Salicylsäure, Inhaltsstoffe erklärt, COSMOS Hautpflege, empfindliche Kopfhaut",
    kicker: "Das Journal",
    heading: "Pflege-Ratgeber & Inhaltsstoffe",
    lead: "Verständliche Experten-Tipps zu veganer Naturkosmetik für Haut und Haar — und zu den zertifizierten Inhaltsstoffen hinter jeder Elira Living-Formel.",
    readMore: "Artikel lesen",
    empty: "Neue Artikel sind in Arbeit.",
    back: "Alle Artikel",
    crumbHome: "Start",
    minRead: "Min. Lesezeit",
    published: "Veröffentlicht",
    updated: "Aktualisiert",
    related: "In diesem Ratgeber",
    shopCta: "Zum Shop",
    faqHeading: "Häufige Fragen",
    toc: "In diesem Ratgeber",
    learn: "Mehr erfahren"
  },
  nl: {
    nav: "Journal",
    indexTitle: "Het Elira Journal — Natuurlijke Huidverzorgingsgidsen & Ingrediënten | Elira Living",
    indexDescription: "Begrijpelijke expertgidsen over veganistische, natuurlijke huid- en haarverzorging — routines voor de gevoelige huid, ingrediënten uitgelegd en clean-beauty-advies van Elira Living.",
    indexKeywords: "natuurlijke huidverzorging blog, veganistische huidverzorging gids, gevoelige huid routine, clean beauty, salicylzuur, ingrediënten uitgelegd, COSMOS huidverzorging, gevoelige hoofdhuid",
    kicker: "Het Journal",
    heading: "Verzorgingsgidsen & ingrediëntverhalen",
    lead: "Begrijpelijk expertadvies over veganistische, natuurlijke huid- en haarverzorging — en de gecertificeerde ingrediënten achter elke Elira Living-formule.",
    readMore: "Lees artikel",
    empty: "Nieuwe artikelen zijn onderweg.",
    back: "Alle artikelen",
    crumbHome: "Home",
    minRead: "min leestijd",
    published: "Gepubliceerd",
    updated: "Bijgewerkt",
    related: "Uitgelicht in deze gids",
    shopCta: "Naar de shop",
    faqHeading: "Veelgestelde vragen",
    toc: "In deze gids",
    learn: "Meer weten"
  },
  fi: {
    nav: "Journal",
    indexTitle: "Elira Journal — Luonnollisen ihonhoidon oppaat & ainesosatarinat | Elira Living",
    indexDescription: "Asiantuntevia, selkokielisiä oppaita vegaaniseen, luonnolliseen iho- ja hiustenhoitoon — herkän ihon rutiinit, ainesosien selitykset ja puhtaan kauneuden vinkit Elira Livingiltä.",
    indexKeywords: "luonnollisen ihonhoidon blogi, vegaaninen ihonhoito-opas, herkän ihon rutiini, puhtaan kauneuden journal, salisyylihappo, ainesosaopas, COSMOS ihonhoito, herkkä hiuspohja",
    kicker: "Journal",
    heading: "Hoito-oppaat & ainesosatarinat",
    lead: "Asiantuntevaa, selkokielistä opastusta luonnolliseen, vegaaniseen iho- ja hiustenhoitoon — ja sertifioituihin ainesosiin jokaisen Elira Living -formulaation takana.",
    readMore: "Lue artikkeli",
    empty: "Uusia artikkeleita on tulossa.",
    back: "Kaikki artikkelit",
    crumbHome: "Etusivu",
    minRead: "min lukuaika",
    published: "Julkaistu",
    updated: "Päivitetty",
    related: "Esillä tässä oppaassa",
    shopCta: "Tutustu valikoimaan",
    faqHeading: "Usein kysytyt kysymykset",
    toc: "Tässä oppaassa",
    learn: "Lue lisää"
  }
};

const LANGS = ["en", "de", "nl", "fi"];

function validate(post, file) {
  if (!post || typeof post !== "object") throw new Error(`Blog post ${file}: not an object`);
  if (!post.slug) throw new Error(`Blog post ${file}: missing "slug"`);
  if (!post.i18n || !post.i18n.en) throw new Error(`Blog post ${post.slug}: missing i18n.en`);
  post.category = post.category || "skincare";
  post.image = post.image || "/assets/img/cream.jpg";
  post.date = post.date || "2026-01-01";
  post.related = Array.isArray(post.related) ? post.related : [];
  // Backfill missing languages from English so a post is never half-rendered.
  LANGS.forEach(L => { if (!post.i18n[L]) post.i18n[L] = post.i18n.en; });
  return post;
}

function loadPosts() {
  if (!fs.existsSync(DIR)) return [];
  const posts = fs.readdirSync(DIR)
    .filter(f => f.toLowerCase().endsWith(".json"))
    .map(f => {
      const raw = fs.readFileSync(path.join(DIR, f), "utf8");
      let json;
      try { json = JSON.parse(raw); }
      catch (e) { throw new Error(`Blog post ${f}: invalid JSON — ${e.message}`); }
      return validate(json, f);
    });
  // Newest first.
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return posts;
}

module.exports = { BLOG_UI, POSTS: loadPosts(), loadPosts, BLOG_DIR: DIR };
