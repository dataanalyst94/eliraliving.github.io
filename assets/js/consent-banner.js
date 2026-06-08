/* =========================================================================
   ELIRA LIVING — Cookie consent banner (GDPR-compliant, trilingual).
   Defaults to denied; Reject is as easy as Accept; granular Preferences;
   records the choice; re-openable via any [data-consent-open] link or
   EliraConsent.open(). Wires to EliraConsent.update() in analytics.js.
   ========================================================================= */
(function () {
  "use strict";
  const LANG = window.LANG || "en";
  const Consent = window.EliraConsent;
  if (!Consent) return;

  const STR = {
    en: { title: "Your privacy", body: "We use cookies to run the shop and, with your consent, to measure traffic and show relevant ads. You can change this anytime.",
      accept: "Accept all", reject: "Reject all", prefs: "Preferences", save: "Save choices",
      necessary: "Strictly necessary", necessaryD: "Required for the cart and checkout. Always on.",
      analytics: "Analytics", analyticsD: "Helps us understand how the shop is used.",
      marketing: "Marketing", marketingD: "Lets us measure and show relevant ads (Meta, TikTok, Google).",
      privacy: "Privacy policy", settings: "Cookie settings" },
    de: { title: "Ihre Privatsphäre", body: "Wir verwenden Cookies, um den Shop zu betreiben und – mit Ihrer Einwilligung – Besuche zu messen und relevante Werbung anzuzeigen. Sie können dies jederzeit ändern.",
      accept: "Alle akzeptieren", reject: "Alle ablehnen", prefs: "Einstellungen", save: "Auswahl speichern",
      necessary: "Unbedingt erforderlich", necessaryD: "Für Warenkorb und Kasse erforderlich. Immer aktiv.",
      analytics: "Statistik", analyticsD: "Hilft uns zu verstehen, wie der Shop genutzt wird.",
      marketing: "Marketing", marketingD: "Ermöglicht Messung und relevante Werbung (Meta, TikTok, Google).",
      privacy: "Datenschutz", settings: "Cookie-Einstellungen" },
    nl: { title: "Je privacy", body: "We gebruiken cookies om de shop te laten werken en – met jouw toestemming – om bezoeken te meten en relevante advertenties te tonen. Je kunt dit altijd wijzigen.",
      accept: "Alles accepteren", reject: "Alles weigeren", prefs: "Voorkeuren", save: "Keuze opslaan",
      necessary: "Strikt noodzakelijk", necessaryD: "Nodig voor winkelwagen en afrekenen. Altijd aan.",
      analytics: "Statistieken", analyticsD: "Helpt ons begrijpen hoe de shop wordt gebruikt.",
      marketing: "Marketing", marketingD: "Maakt meting en relevante advertenties mogelijk (Meta, TikTok, Google).",
      privacy: "Privacybeleid", settings: "Cookie-instellingen" }
  };
  const S = STR[LANG] || STR.en;
  const privacyHref = "/" + LANG + "/privacy.html";

  let el;
  function build() {
    el = document.createElement("div");
    el.className = "cc";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", S.title);
    el.innerHTML = `
      <div class="cc-card">
        <h2 class="cc-title font-display">${S.title}</h2>
        <p class="cc-body">${S.body} <a href="${privacyHref}" class="link-underline">${S.privacy}</a>.</p>
        <div class="cc-prefs" data-cc-prefs hidden>
          <label class="cc-opt"><input type="checkbox" checked disabled><span><strong>${S.necessary}</strong> — ${S.necessaryD}</span></label>
          <label class="cc-opt"><input type="checkbox" data-c="analytics"><span><strong>${S.analytics}</strong> — ${S.analyticsD}</span></label>
          <label class="cc-opt"><input type="checkbox" data-c="ads"><span><strong>${S.marketing}</strong> — ${S.marketingD}</span></label>
        </div>
        <div class="cc-actions">
          <button class="btn btn-outline" data-cc="reject">${S.reject}</button>
          <button class="btn btn-outline" data-cc="prefs">${S.prefs}</button>
          <button class="btn btn-primary" data-cc="accept">${S.accept}</button>
          <button class="btn btn-primary" data-cc="save" hidden>${S.save}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('[data-cc="accept"]').addEventListener("click", () => choose({ analytics: true, ads: true }));
    el.querySelector('[data-cc="reject"]').addEventListener("click", () => choose({ analytics: false, ads: false }));
    el.querySelector('[data-cc="prefs"]').addEventListener("click", () => {
      el.querySelector("[data-cc-prefs]").hidden = false;
      el.querySelector('[data-cc="save"]').hidden = false;
      el.querySelector('[data-cc="prefs"]').hidden = true;
    });
    el.querySelector('[data-cc="save"]').addEventListener("click", () => {
      choose({ analytics: el.querySelector('[data-c="analytics"]').checked, ads: el.querySelector('[data-c="ads"]').checked });
    });
  }
  function choose(state) { Consent.update(state, true); hide(); }
  function show() {
    if (!el) build();
    const s = Consent.saved();
    if (s) { el.querySelector('[data-c="analytics"]').checked = !!s.analytics; el.querySelector('[data-c="ads"]').checked = !!s.ads; }
    el.classList.add("show");
    requestAnimationFrame(() => el.querySelector(".cc-card").focus && el.querySelector(".cc-card").setAttribute("tabindex", "-1"));
  }
  function hide() { if (el) el.classList.remove("show"); }

  Consent.open = show;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-consent-open]").forEach(a => { a.textContent = S.settings; a.addEventListener("click", e => { e.preventDefault(); show(); }); });
    if (!Consent.saved()) show();
  });
})();
