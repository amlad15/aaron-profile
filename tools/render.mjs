// Prerenders js/content.js into index.html so the content is real HTML on first load.
// Usage: node tools/render.mjs   (no dependencies; commit the updated index.html)
import { readFileSync, writeFileSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const SITE = require(join(root, 'js/content.js'));
const R = require(join(root, 'js/render.js'));

// Same rule as site.js: a cert only counts once its file really is a PDF
function isPdf(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return false;
  const fd = openSync(p, 'r'), buf = Buffer.alloc(5);
  readSync(fd, buf, 0, 5, 0); closeSync(fd);
  return buf.toString('latin1') === '%PDF-';
}
const verified = SITE.certificates.filter(c => isPdf(c.file));

const file = join(root, 'index.html');
let html = readFileSync(file, 'utf8');

function fill(name, body) {
  const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
  if (!re.test(html)) throw new Error(`Missing build:${name} markers in index.html`);
  html = html.replace(re, `$1\n${body}\n$2`);            // keep markers so the next run can find them
}

fill('nav', R.nav(verified.length));
fill('main', R.main(SITE, verified));
html = html.replace(/data-content-hash="[^"]*"/, `data-content-hash="${R.hash(SITE)}"`);
html = html.replace(/<span data-year>\d+<\/span>/, `<span data-year>${new Date().getFullYear()}</span>`);
writeFileSync(file, html);

// Sitemap lastmod tracks the last content render
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(root, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://amlad15.github.io/aaron-profile/</loc><lastmod>${today}</lastmod></url>
</urlset>
`);

console.log(`index.html rendered · ${verified.length}/${SITE.certificates.length} certificates published · hash ${R.hash(SITE)}`);
