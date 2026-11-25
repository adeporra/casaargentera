#!/usr/bin/env node
// static encoder — text-only information pages (template `static`, archetype
// privacy-policy-and-cookies; siblings da-privacy-policy-and-cookies, ca-politica-de-privacitat-i-
// cookies, ca-politica-de-privacidad-y-cookies, covid-19, ca-covid-19, da-covid-19).
// Reads the hydrated capture stardust/current/pages/<slug>.html (+ <slug>.json) and writes the DA
// document for the page. Content-driven: walks the source's WPBakery rows → columns → modules in
// document order, so a sibling that pushes its text down with empty-space modules instead of empty
// lines (ca, covid), or splits the text over two columns, encodes without code changes.
//
//   section 1  in source order, one section:
//                text (h1–h6, p, ul, ol)   → default content, verbatim (first heading promoted to
//                                            h1 — R-07; painted as the canon h2 by spacer.css)
//                bare text in a column     → a paragraph, verbatim (raw shortcode text that failed
//                                            to render — R-02 on the COVID-19 pages)
//                vertical space            → spacer (one cell: height in px). A run of empty
//                                            lines (`<p>&nbsp;</p>`, empty headings — the
//                                            pipeline drops them), vc_empty_space modules and
//                                            empty rows (1px column min-height) becomes ONE
//                                            spacer; its height = the run's painted height + the
//                                            bottom margin of the text element before it (EDS
//                                            zeroes the last child's margin of each wrapper)
//              any other module is reported on stderr (never silently dropped)
//   section 2  metadata (Title, Description, Image, header-veil, translations)
//
// Painted heights of an empty line (canon type, constant at 1440 and 360): line box + 10px margin
// (0 when the line is its text column's last child — WPBakery last-child rule).
//
// usage: node stardust/encoders/encode-static.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const USAGE = 'usage: encode-static.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] '
  + '[--translations t]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : dflt;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [slug, outFile] = positional;
if (!slug || !outFile) {
  console.error(USAGE);
  process.exit(2);
}
const scope = opt('scope', 'static');
const manifestFile = opt('manifest', `stardust/.work/rollout/static/enc/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];
// line boxes of the canon type (styles.css / canon.css): p 14/25, h1 h2 50/55, h3 30/35,
// h4 22/30, h5 17/27, h6 14/25
const LINE = {
  p: 25, h1: 55, h2: 55, h3: 35, h4: 30, h5: 27, h6: 25,
};
const MARGIN = {
  p: 10, h1: 10, h2: 10, h3: 10, h4: 10, h5: 10, h6: 10, ul: 10, ol: 10,
};

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const isBlank = (html) => html.replace(/<!--[\s\S]*?-->|&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const clean = (el) => {
    // verbatim inner HTML minus WordPress attributes on inline links (target/rel not authorable)
    const c = el.cloneNode(true);
    c.querySelectorAll('a').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel'); });
    return c.innerHTML.trim();
  };
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const INLINE = 'a, strong, b, em, i, span, br, sup, sub, u';
  const unknown = [];
  const items = [];

  // a text column's children: text elements (blank ones are vertical space)
  const textColumn = (tc) => {
    const inner = tc.querySelector('.wpb_wrapper') || tc;
    const kids = [...inner.children].filter((c) => !c.matches('style, script'));
    kids.forEach((c, i) => {
      const tag = c.tagName.toLowerCase();
      const last = i === kids.length - 1;
      if (!/^(h[1-6]|p|ul|ol)$/.test(tag)) {
        unknown.push(`text-column child <${tag}>`);
        return;
      }
      const html = clean(c);
      if (/^<span id="more-\d+"><\/span>$/.test(html)) return;
      if (/^(h[1-6]|p)$/.test(tag) && isBlank(html) && !c.querySelector('img')) {
        items.push({ kind: 'blank', tag, last });
      } else items.push({ kind: 'text', tag, html, last });
    });
  };
  // a column wrapper's children in document order: modules, and bare text (raw shortcodes)
  const walk = (node) => {
    let run = null; // consecutive bare text + inline elements → one paragraph
    const flush = () => {
      if (run && run.textContent.replace(/\s+/g, ' ').trim()) {
        items.push({
          kind: 'text', tag: 'p', html: run.innerHTML.replace(/\s+/g, ' ').trim(), last: true, raw: true,
        });
      }
      run = null;
    };
    [...node.childNodes].forEach((n) => {
      const inline = n.nodeType === Node.TEXT_NODE
        || (n.nodeType === Node.ELEMENT_NODE && n.matches(INLINE));
      if (inline) {
        if (!run) run = document.createElement('p');
        run.append(n.cloneNode(true));
        return;
      }
      flush();
      if (n.nodeType !== Node.ELEMENT_NODE || n.matches('style, script')) return;
      if (n.matches('.vc_empty_space')) items.push({ kind: 'space', h: spacerH(n) });
      else if (n.matches('.wpb_text_column')) textColumn(n);
      else if (n.matches('.wpb_content_element, .vc_grid-container-wrapper, .wpb_single_image')) {
        unknown.push(n.className.split(/\s+/).slice(0, 2).join('.'));
      } else walk(n);
    });
    flush();
  };

  [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .forEach((row) => {
      const before = items.length;
      const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
      cols.forEach((col) => walk(col.querySelector('.wpb_wrapper') || col));
      // an empty row still paints its columns' 1px min-height
      if (items.length === before) items.push({ kind: 'space', h: 1 });
    });

  // masthead veil (The7 per-page header background) and the Polylang translations (hreflang)
  const banner = document.querySelector('header[role=banner], .masthead[role=banner]');
  const veilBg = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => /^[a-z]{2}$/.test(h));
  return {
    items, unknown, veilBg, alternates,
  };
});
await browser.close();

// ---- media: local captured file, stored name, manifest (the og image only)
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url) {
  const abs = new URL(url, 'https://www.casaargentera.com/').href;
  const file = decodeURIComponent(new URL(abs).pathname.split('/').pop());
  const dir = localFiles.find(([, fs]) => fs.includes(file));
  const name = storedName(file);
  if (!manifest.some((e) => e.name === name)) {
    const entry = { file: dir ? join(dir[0], file) : `stardust/.work/rollout/static/fetched/${file}`, name };
    if (!dir) entry.source = abs.replace('/wp/wp-content/', '/wp-content/');
    manifest.push(entry);
  }
  return `${MEDIA}${name}`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (url, alt) => `<p><img src="${media(url)}" alt="${esc(alt)}"></p>`;
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;

// ---- page-level metadata derived from the capture (overridable by flags)
const VEIL_WORDS = { 'rgba(221,153,51,0.5)': 'amber', 'rgba(221,179,110,0.5)': 'gold' };
const veilKey = src.veilBg ? src.veilBg.replace(/\s+/g, '') : null;
const veil = veilOpt || (veilKey ? VEIL_WORDS[veilKey] || veilKey : 'amber');
const leaf = (href) => {
  const path = new URL(href, 'https://www.casaargentera.com/').pathname.replace(/\/+$/, '');
  return path || '/';
};
const translations = translationsOpt || (src.alternates.length
  ? src.alternates.map(([h, href]) => `${h}=${leaf(href)}`).join(', ') : null);

// ---- section 1: text runs + spacers
const warnings = src.unknown.map((u) => `unknown module kept out: ${u}`);
let h1Done = src.items.some((i) => i.kind === 'text' && i.tag === 'h1');
const out = [];
let space = 0; // pending vertical space (px)
let prev = null; // the text item before the pending space
const flushSpace = () => {
  if (space > 0) {
    // EDS zeroes the bottom margin of the last element before the spacer wrapper: carry it
    const carried = prev && !prev.last ? (MARGIN[prev.tag] || 0) : 0;
    out.push(`<div class="spacer">${row(`<p>${space + carried}</p>`)}</div>`);
  }
  space = 0;
};
src.items.forEach((it) => {
  if (it.kind === 'space') {
    space += it.h;
    return;
  }
  if (it.kind === 'blank') {
    space += LINE[it.tag] + (it.last ? 0 : MARGIN[it.tag]);
    return;
  }
  flushSpace();
  let { tag } = it;
  if (!h1Done && /^h[2-6]$/.test(tag)) {
    tag = 'h1'; // R-07: the page's first heading is its h1, painted as the source heading
    h1Done = true;
    if (it.tag !== 'h2') warnings.push(`h1 promoted from ${it.tag}: spacer.css paints h1 as h2`);
  }
  if (it.raw) warnings.push(`raw text kept verbatim as a paragraph: ${it.html.slice(0, 60)}`);
  out.push(`<${tag}>${it.html}</${tag}>`);
  prev = it;
});
flushSpace();
if (!h1Done) warnings.push('no heading on the page: no h1');
const s1 = `<div>${out.join('')}</div>`;

// ---- section 2: metadata
const ogImage = meta.og && meta.og.image;
const mrows = [
  row('Title', esc(meta.title)),
  row('Description', esc(meta.description || '')),
];
if (ogImage) mrows.push(row('Image', img(ogImage, '')));
if (veil) mrows.push(row('header-veil', veil));
if (translations) mrows.push(row('translations', esc(translations)));
const s2 = `<div><div class="metadata">${mrows.join('')}</div></div>`;

const html = `<body><header></header><main>${s1}${s2}</main><footer></footer></body>\n`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
warnings.forEach((w) => console.error(`warn ${slug}: ${w}`));
const spacers = (s1.match(/class="spacer"/g) || []).length;
const counts = src.items.reduce((a, it) => ({ ...a, [it.kind]: (a[it.kind] || 0) + 1 }), {});
console.log(`encoded ${slug} → ${outFile}  (${JSON.stringify(counts)}; spacers ${spacers} `
  + `[${[...s1.matchAll(/class="spacer"><div><div><p>(\d+)/g)].map((m) => m[1]).join(', ')}]; `
  + `media ${manifest.length} → ${manifestFile})`);
