#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "de", "nl", "fi"];
const REQUIRED_COUNTRIES = ["FI", "DE", "FR", "IT", "CZ"];
const EXPECTED_PRODUCTS = 7;

function occurrences(xml, pattern) {
  return [...xml.matchAll(pattern)].length;
}

for (const lang of LANGS) {
  const filename = path.join(ROOT, `feed-${lang}.xml`);
  if (!fs.existsSync(filename)) throw new Error(`Missing ${filename}`);
  const xml = fs.readFileSync(filename, "utf8");
  const products = occurrences(xml, /<item>/g);
  if (products !== EXPECTED_PRODUCTS) {
    throw new Error(`${lang}: expected ${EXPECTED_PRODUCTS} products, found ${products}`);
  }
  if (!xml.includes(`<link>https://www.eliraliving.com/${lang}/</link>`)) {
    throw new Error(`${lang}: channel link does not match the localized storefront`);
  }
  for (const country of REQUIRED_COUNTRIES) {
    const count = occurrences(xml, new RegExp(`<g:country>${country}<\\/g:country>`, "g"));
    if (count !== EXPECTED_PRODUCTS) {
      throw new Error(`${lang}: ${country} shipping appears ${count} times, expected ${EXPECTED_PRODUCTS}`);
    }
  }
  for (const id of xml.matchAll(/<g:id>([^<]+)<\/g:id>/g)) {
    if (!id[1].endsWith(`-${lang.toUpperCase()}`)) throw new Error(`${lang}: non-localized offer id ${id[1]}`);
  }
  console.log(`${lang}: ${products} products, priority-country shipping present`);
}

const legacy = fs.readFileSync(path.join(ROOT, "feed.xml"), "utf8");
const english = fs.readFileSync(path.join(ROOT, "feed-en.xml"), "utf8");
if (legacy !== english) throw new Error("feed.xml must remain an exact alias of feed-en.xml");

console.log("Merchant feed validation passed.");
