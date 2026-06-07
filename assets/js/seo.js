/* =========================================================================
   ELIRA LIVING — SEO engine.
   Localized titles/descriptions/keywords (EN/DE/NL), Open Graph, Twitter,
   canonical, hreflang alternates, and JSON-LD structured data
   (Organization, WebSite, Product, BreadcrumbList).
   Runs on load and on every language change.
   ========================================================================= */
(function () {
  const BASE = "https://eliraliving.com";
  const OG_IMAGE = BASE + "/assets/img/og-image.jpg";
  const OG_LOCALE = { en: "en_GB", de: "de_DE", nl: "nl_NL" };
  const langs = ["en", "de", "nl"];

  // ---- Per-page localized metadata --------------------------------------
  const SEO = {
    home: {
      en: { t: "Elira Living | Natural Vegan Skincare & Haircare — COSMOS Certified",
            d: "Vegan, ECOCERT COSMOS-certified natural skincare and haircare. Cruelty-free, made in the EU. Free climate-neutral shipping in Germany & the Netherlands.",
            k: "natural skincare, vegan skincare, COSMOS certified skincare, organic skincare, natural haircare, cruelty-free cosmetics, clean beauty, ECOCERT, made in EU, sustainable beauty, vegan shampoo, purifying toner" },
      de: { t: "Elira Living | Natürliche vegane Haut- & Haarpflege — COSMOS-zertifiziert",
            d: "Vegane, ECOCERT COSMOS-zertifizierte Naturkosmetik für Haut und Haar. Tierversuchsfrei, in der EU hergestellt. Kostenloser klimaneutraler Versand in DE & NL.",
            k: "Naturkosmetik, vegane Hautpflege, COSMOS zertifiziert, Bio Hautpflege, natürliche Haarpflege, tierversuchsfreie Kosmetik, Clean Beauty, ECOCERT, in EU hergestellt, nachhaltige Kosmetik, veganes Shampoo, klärendes Gesichtswasser" },
      nl: { t: "Elira Living | Natuurlijke veganistische huid- & haarverzorging — COSMOS",
            d: "Veganistische, ECOCERT COSMOS-gecertificeerde natuurlijke huid- en haarverzorging. Dierproefvrij, gemaakt in de EU. Gratis klimaatneutrale verzending in DE & NL.",
            k: "natuurlijke huidverzorging, veganistische huidverzorging, COSMOS gecertificeerd, biologische huidverzorging, natuurlijke haarverzorging, dierproefvrije cosmetica, clean beauty, ECOCERT, gemaakt in EU, duurzame cosmetica, veganistische shampoo, zuiverende toner" }
    },
    shop: {
      en: { t: "Shop Natural Skincare & Haircare | Elira Living",
            d: "Browse Elira Living's full range of vegan, COSMOS-certified skincare and haircare. Cleansers, toners, moisturisers and shampoo — cruelty-free and made in the EU.",
            k: "shop natural skincare, vegan skincare shop, COSMOS certified products, natural haircare, facial cleanser, purifying toner, moisturizer, sensitive scalp shampoo, clean beauty store" },
      de: { t: "Naturkosmetik kaufen — Haut- & Haarpflege | Elira Living",
            d: "Entdecken Sie das vollständige Sortiment von Elira Living: vegane, COSMOS-zertifizierte Haut- und Haarpflege. Reiniger, Toner, Cremes und Shampoo — tierversuchsfrei, made in EU.",
            k: "Naturkosmetik kaufen, vegane Hautpflege Shop, COSMOS zertifizierte Produkte, natürliche Haarpflege, Gesichtsreiniger, klärendes Gesichtswasser, Feuchtigkeitscreme, Shampoo empfindliche Kopfhaut" },
      nl: { t: "Natuurlijke huid- & haarverzorging kopen | Elira Living",
            d: "Ontdek het volledige assortiment van Elira Living: veganistische, COSMOS-gecertificeerde huid- en haarverzorging. Reinigers, toners, crèmes en shampoo — dierproefvrij, gemaakt in de EU.",
            k: "natuurlijke huidverzorging kopen, veganistische huidverzorging winkel, COSMOS gecertificeerde producten, natuurlijke haarverzorging, gezichtsreiniger, zuiverende toner, moisturizer, shampoo gevoelige hoofdhuid" }
    },
    about: {
      en: { t: "About Elira Living | Clean Beauty, Made in Europe",
            d: "Elira Living makes vegan, ECOCERT COSMOS-certified skincare and haircare — clean, effective formulas rooted in nature and responsibly made in the EU.",
            k: "about Elira Living, clean beauty brand, vegan cosmetics Europe, ECOCERT COSMOS, sustainable skincare, natural beauty story" },
      de: { t: "Über Elira Living | Saubere Pflege, hergestellt in Europa",
            d: "Elira Living entwickelt vegane, ECOCERT COSMOS-zertifizierte Haut- und Haarpflege — saubere, wirksame Formeln aus der Natur, verantwortungsvoll in der EU hergestellt.",
            k: "über Elira Living, Clean Beauty Marke, vegane Kosmetik Europa, ECOCERT COSMOS, nachhaltige Hautpflege, natürliche Schönheit" },
      nl: { t: "Over Elira Living | Schone verzorging, gemaakt in Europa",
            d: "Elira Living maakt veganistische, ECOCERT COSMOS-gecertificeerde huid- en haarverzorging — schone, effectieve formules uit de natuur, verantwoord gemaakt in de EU.",
            k: "over Elira Living, clean beauty merk, veganistische cosmetica Europa, ECOCERT COSMOS, duurzame huidverzorging, natuurlijke schoonheid" }
    }
  };

  // ---- helpers ----------------------------------------------------------
  function upsertMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }
  function upsertLink(rel, href, hreflang) {
    const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
    let el = document.head.querySelector(sel);
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); if (hreflang) el.setAttribute("hreflang", hreflang); document.head.appendChild(el); }
    el.setAttribute("href", href);
  }
  function injectLD(id, obj) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = id; document.head.appendChild(el); }
    el.textContent = JSON.stringify(obj);
  }
  function fileName() { return (location.pathname.split("/").pop() || "index.html"); }
  function withLang(url, l) { return url + (url.includes("?") ? "&" : "?") + "lang=" + l; }

  function pageKey() {
    const p = document.body.getAttribute("data-page") || "";
    if (p === "home-immersive" || p === "home") return "home";
    if (p === "shop") return "shop";
    if (p === "about") return "about";
    if (p === "product") return "product";
    return null; // legal/cart/etc handled lightly
  }

  // ---- main apply -------------------------------------------------------
  function apply() {
    const lang = (window.I18nState && I18nState.lang) || "en";
    const key = pageKey();
    const file = fileName();
    const isHome = key === "home";
    const cleanPath = isHome ? "/" : "/" + file;
    let canonical = BASE + cleanPath;

    let title, desc, keywords, ogType = "website", product = null;

    if (key === "product" && window.getProduct) {
      const id = new URLSearchParams(location.search).get("id");
      product = getProduct(id) || PRODUCTS[0];
      canonical = BASE + "/product.html?id=" + product.id;
      const cat = I18nState.t("cat." + product.category);
      const brand = "Elira Living";
      title = `${product.name} – ${cat} | ${brand}`;
      desc = (productDesc(product) || "") + " " + (lang === "de" ? "Vegan, ECOCERT COSMOS-zertifiziert. Kostenloser Versand in DE & NL ab 39 €."
            : lang === "nl" ? "Vegan, ECOCERT COSMOS-gecertificeerd. Gratis verzending in DE & NL vanaf € 39."
            : "Vegan, ECOCERT COSMOS certified. Free shipping in DE & NL over €39.");
      keywords = [product.name, cat, "Elira Living", ...(product.features || []), "vegan", "COSMOS", "ECOCERT"].join(", ");
      ogType = "product";
    } else if (key && SEO[key]) {
      const s = SEO[key][lang] || SEO[key].en;
      title = s.t; desc = s.d; keywords = s.k;
    } else {
      // legal/other indexable: keep document title, derive description
      title = document.title;
      desc = document.querySelector('meta[name="description"]')?.content ||
        "Elira Living — vegan, ECOCERT COSMOS-certified natural skincare & haircare.";
      keywords = "Elira Living, natural skincare, vegan, COSMOS certified";
    }

    // <title> + core meta
    document.title = title;
    document.documentElement.lang = lang;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "keywords", keywords);

    // canonical
    upsertLink("canonical", canonical);

    // hreflang alternates (+ x-default)
    langs.forEach(l => upsertLink("alternate", l === "en" ? canonical : withLang(canonical, l), l));
    upsertLink("alternate", canonical, "x-default");

    // Open Graph
    upsertMeta("property", "og:site_name", "Elira Living");
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", product && product.img ? BASE + "/" + product.img : OG_IMAGE);
    upsertMeta("property", "og:locale", OG_LOCALE[lang] || "en_GB");
    langs.filter(l => l !== lang).forEach((l, i) => upsertMeta("property", "og:locale:alternate" + (i ? i : ""), OG_LOCALE[l]));

    // Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", product && product.img ? BASE + "/" + product.img : OG_IMAGE);

    // robots (only set positive on indexable; never override an existing noindex)
    if (!document.querySelector('meta[name="robots"]')) {
      upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    }

    buildStructuredData(lang, canonical, product, key);
  }

  // ---- JSON-LD ----------------------------------------------------------
  function buildStructuredData(lang, canonical, product, key) {
    const org = {
      "@context": "https://schema.org", "@type": "Organization",
      "name": "Elira Living", "url": BASE + "/", "logo": OG_IMAGE,
      "email": "support@eliraliving.com",
      "founder": { "@type": "Person", "name": "Zeerak Ata" },
      "address": { "@type": "PostalAddress", "streetAddress": "Lapinrinne 1b", "postalCode": "00180", "addressLocality": "Helsinki", "addressCountry": "FI" },
      "areaServed": ["DE", "NL"]
    };
    injectLD("ld-org", org);

    injectLD("ld-website", {
      "@context": "https://schema.org", "@type": "WebSite",
      "name": "Elira Living", "url": BASE + "/", "inLanguage": lang
    });

    // remove product/breadcrumb LD if not relevant
    ["ld-product", "ld-breadcrumb"].forEach(id => { if (key !== "product") { const e = document.getElementById(id); if (e) e.remove(); } });

    if (key === "product" && product) {
      const cat = I18nState.t("cat." + product.category);
      injectLD("ld-product", {
        "@context": "https://schema.org", "@type": "Product",
        "name": product.name,
        "image": [BASE + "/" + product.img],
        "description": productDesc(product),
        "brand": { "@type": "Brand", "name": "Elira Living" },
        "category": cat,
        "offers": {
          "@type": "Offer", "url": canonical, "priceCurrency": "EUR",
          "price": (product.price / 100).toFixed(2),
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition",
          "seller": { "@type": "Organization", "name": "Elira Living" }
        }
      });
      injectLD("ld-breadcrumb", {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/" },
          { "@type": "ListItem", "position": 2, "name": cat, "item": BASE + "/shop.html?category=" + product.category },
          { "@type": "ListItem", "position": 3, "name": product.name, "item": canonical }
        ]
      });
    }
  }

  document.addEventListener("DOMContentLoaded", apply);
  document.addEventListener("langchange", apply);
  // Re-assert after all other DOMContentLoaded handlers + late page scripts run,
  // so SEO always owns the final <title> and meta regardless of script order.
  window.addEventListener("load", apply);
})();
