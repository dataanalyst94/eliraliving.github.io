/* Turn an English Klaviyo HTML template into a trilingual one (EN/DE/NL) by
   wrapping each phrase in a Locale conditional. Reliable: uses placeholder
   tokens so inserted text is never re-matched. Reports any phrase not found.
   Usage: node tools/klaviyo-localize.js <in.en.html> <out.html> <map.json>
   map.json = [{ "en": "...", "de": "...", "nl": "..." }, ...] */
const fs = require("fs");
const [, , inF, outF, mapF] = process.argv;
let html = fs.readFileSync(inF, "utf8");
// normalize non-breaking spaces to regular spaces so plain-space map keys match
html = html.replace(/ /g, " ");
const map = JSON.parse(fs.readFileSync(mapF, "utf8"));

// localize on-site URLs: /en/ -> /{{ person.Locale|default:'en' }}/
html = html.split("eliraliving.com/en/").join("eliraliving.com/{{ person.Locale|default:'en' }}/");

// pass 1: replace each EN phrase with a unique token (longest first)
const entries = map.map((e, i) => ({ ...e, i })).sort((a, b) => b.en.length - a.en.length);
const misses = [];
for (const e of entries) {
  if (!html.includes(e.en)) { misses.push(e.en); continue; }
  html = html.split(e.en).join(`@@TOK${e.i}@@`);
}
// pass 2: tokens -> language conditional
for (const e of entries) {
  const cond = `{% if person.Locale == 'de' %}${e.de}{% elif person.Locale == 'nl' %}${e.nl}{% else %}${e.en}{% endif %}`;
  html = html.split(`@@TOK${e.i}@@`).join(cond);
}
fs.writeFileSync(outF, html);
console.log(`✓ ${outF} — ${map.length - misses.length}/${map.length} phrases localized`);
if (misses.length) { console.log("NOT FOUND (fix these exact strings):"); for (const m of misses) console.log("   ·", JSON.stringify(m)); }
