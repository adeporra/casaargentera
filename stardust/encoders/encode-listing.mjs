#!/usr/bin/env node
// listing encoder — overview pages (template `listing`, archetype experiences; siblings
// es-experiencias, ca-experiencies, da-oplevelser). Reads the hydrated capture
// stardust/current/pages/<slug>.html (+ <slug>.json) and writes the DA document for the page.
// Content-driven: walks the source's WPBakery rows in document order, so a sibling with more or
// fewer teasers, a teaser with two images (da-oplevelser "Kultur"), an empty text column or a
// missing intro encodes without code changes.
//
//   section 1  hero-slider [start-<n>] (rows = slides: image / text layers) + section-metadata
//              duration when the slider rotates (a single slide is static: no bullets, no timer)
//   section 2  in source order:
//                text rows (no image)     → default content, verbatim (first heading promoted to h1
//                                            when the page has none — R-07)
//                teaser rows (a column    → media-feature, one row per source row, one cell per
//                  whose text carries an   source column holding its heading + image paragraphs
//                  image: linked h2 over   verbatim (consecutive teaser rows — spacer rows between
//                  an inline image)        them included — merge into one block). Spacing read
//                                          from the WPBakery spacers:
//                                            top-<n>  above the first teaser (default 56)
//                                            gap-<n>  between teasers (default 40)
//                                            head-<n> between a teaser heading and its image
//                                            end-<n>  under the last teaser (default 0)
//                                            intro-<n> under the intro h1 when its paragraph
//                                              opens on a blank <br> line (10 + 25)
//                vc_empty_space           → nothing by itself (read into the variants above)
//              any other module is reported on stderr (never silently dropped)
//   section 3  metadata (Title, Description, Image, header-veil, translations)
//
// Images: the source's lazy loader points some teaser images at `/wp/wp-content/…` (404; the
// srcset's `/wp-content/…` serves the same file) — the encoder delivers the working file
// (register R-04, applied as R-11). Media are authored as content.da.live/<org>/<repo>/media/
// <scope>/<name> — the very file the source names (a teaser image shows at its own width, 1024 on
// the source, so no larger rendition is swapped in); the
// encoder writes the upload manifest (local captured file, else the source URL) for
// da-media-upload.mjs.
//
// usage: node stardust/encoders/encode-listing.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"] [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const USAGE = 'usage: encode-listing.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] '
  + '[--translations t] [--start n]';
const args = process.argv.slice(2);
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
const scope = opt('scope', 'listing');
const manifestFile = opt('manifest', `stardust/.work/rollout/listing/enc/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const startOpt = opt('start', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];
const FETCH_DIR = 'stardust/.work/rollout/listing/fetched';
const DEFAULTS = { top: 56, gap: 40, end: 0 }; // media-feature defaults

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/<!--[\s\S]*?-->|&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  // verbatim element: WordPress link attributes dropped (target/rel are not authorable), lazy-load
  // duplicates (<noscript>) dropped, every image reduced to a placeholder carrying src + alt
  const images = [];
  const clean = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    c.querySelectorAll('a').forEach((a) => {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
    c.querySelectorAll('img').forEach((im) => {
      images.push({ src: im.getAttribute('data-src') || im.getAttribute('src'), alt: im.getAttribute('alt') || '' });
      const ph = document.createElement('img');
      ph.setAttribute('data-img', String(images.length - 1));
      im.replaceWith(ph);
    });
    return c.outerHTML.trim();
  };
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  // a column's pieces in document order: text elements (verbatim) and spacers
  const pieces = (col) => {
    const out = [];
    const unknown = [];
    const walk = (node) => {
      [...node.children].forEach((n) => {
        if (n.matches('.wpb_text_column')) {
          const inner = n.querySelector('.wpb_wrapper') || n;
          [...inner.children].forEach((c) => {
            if (!c.matches(TEXT)) {
              unknown.push(c.className || c.tagName);
              return;
            }
            if (!c.querySelector('img') && isBlank(c.innerHTML)) return;
            out.push({
              kind: 'el', tag: c.tagName.toLowerCase(), html: clean(c), img: !!c.querySelector('img'),
            });
          });
        } else if (n.matches('.vc_empty_space')) {
          out.push({ kind: 'space', h: spacerH(n) });
        } else if (n.matches(TEXT)) {
          if (n.querySelector('img') || !isBlank(n.innerHTML)) {
            out.push({
              kind: 'el', tag: n.tagName.toLowerCase(), html: clean(n), img: !!n.querySelector('img'),
            });
          }
        } else if (n.matches('.wpb_wrapper, .vc_column-inner')) {
          walk(n);
        } else if (!n.matches('style, script, noscript')) {
          unknown.push(n.className || n.tagName);
        }
      });
    };
    walk(col);
    return { out, unknown };
  };

  // ---- hero (Revolution Slider): slides, active slide, duration, text layers
  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...s.querySelector('rs-sbg-wrap')?.childNodes || []]
        .find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const layers = [...s.querySelectorAll('rs-layer')].map((l) => t(l)).filter(Boolean);
      hero.slides.push({ url: url ? new URL(url, 'https://www.casaargentera.com/').href : null, alt, layers });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }

  // ---- body: one item per top-level WPBakery row, in document order
  const items = [];
  const unknown = [];
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'));
  rows.forEach((row) => {
    const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
    const parsed = cols.map(pieces);
    parsed.forEach((p) => unknown.push(...p.unknown));
    const els = parsed.map((p) => p.out.filter((x) => x.kind === 'el'));
    const trailing = (p) => {
      const last = p.out[p.out.length - 1];
      return last && last.kind === 'space' ? last.h : 0;
    };
    const spaceAfter = Math.max(0, ...parsed.map(trailing));
    if (!els.some((e) => e.length)) {
      items.push({ kind: 'space', h: Math.max(0, ...parsed.flatMap((p) => p.out.map((x) => x.h || 0))) });
    } else if (els.some((e) => e.some((x) => x.img))) {
      // teaser: per column its elements; the spacer between the heading and the first image
      const heads = parsed.map((p) => {
        const hi = p.out.findIndex((x) => x.kind === 'el' && /^h[1-6]$/.test(x.tag) && !x.img);
        const ii = p.out.findIndex((x) => x.kind === 'el' && x.img);
        if (hi < 0 || ii < hi) return null;
        return p.out.slice(hi + 1, ii).filter((x) => x.kind === 'space').reduce((a, x) => a + x.h, 0);
      }).filter((h) => h !== null);
      items.push({
        kind: 'teaser', cells: els, head: heads.length ? heads[0] : null, heads, spaceAfter,
      });
    } else {
      els.flat().forEach((e) => items.push({ ...e, kind: 'text' }));
      items[items.length - 1].spaceAfter = spaceAfter;
    }
  });
  // masthead veil (The7 per-page header background) and the Polylang translations (hreflang)
  const banner = document.querySelector('header[role=banner], .masthead[role=banner]');
  const veilBg = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => /^[a-z]{2}$/.test(h));
  return {
    hero, items, images, unknown, veilBg, alternates,
  };
});
await browser.close();

// ---- media: the file the source names (local captured copy when present), stored name, manifest
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  // dots → dashes; diacritics dropped so the stored name is plain ASCII
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url) {
  // the lazy loader's `/wp/wp-content/…` 404s; its srcset's `/wp-content/…` serves the file (R-04)
  const abs = new URL(url, 'https://www.casaargentera.com/').href.replace('/wp/wp-content/', '/wp-content/');
  const file = decodeURIComponent(new URL(abs).pathname.split('/').pop());
  const dir = localFiles.find(([, fs]) => fs.includes(file));
  const name = storedName(file);
  if (!manifest.some((e) => e.name === name)) {
    const entry = { file: dir ? join(dir[0], file) : `${FETCH_DIR}/${file}`, name };
    if (!dir) entry.source = abs;
    manifest.push(entry);
  }
  return `${MEDIA}${name}`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const imgTag = (url, alt) => `<img src="${media(url)}" alt="${esc(alt)}">`;
const img = (url, alt) => `<p>${imgTag(url, alt)}</p>`;
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;
// a cleaned element: image placeholders → authored images, attributes WordPress adds to text
// elements dropped (class / style / id are not authorable)
const element = (e) => e.html
  .replace(/<img data-img="(\d+)">/g, (_, n) => imgTag(src.images[+n].src, src.images[+n].alt))
  .replace(/^<(\w+)[^>]*>/, '<$1>');

// ---- page-level metadata derived from the capture (overridable by flags)
const VEIL_WORDS = { 'rgba(221,153,51,0.5)': 'amber', 'rgba(221,179,110,0.5)': 'gold' };
const veilKey = src.veilBg ? src.veilBg.replace(/\s+/g, '') : null;
const veil = veilOpt || (veilKey ? VEIL_WORDS[veilKey] || veilKey : null);
const leaf = (href) => new URL(href, 'https://www.casaargentera.com/').pathname.replace(/\/+$/, '') || '/';
const translations = translationsOpt || (src.alternates.length
  ? src.alternates.map(([h, href]) => `${h}=${leaf(href)}`).join(', ') : null);

// ---- section 1: hero
const { hero, items } = src;
const warnings = [...new Set(src.unknown)].map((u) => `unknown module kept out: ${u}`);
const slides = hero.slides.filter((s) => s.url);
let s1 = '';
if (slides.length) {
  const rows = slides.map((s) => {
    const cells = [img(s.url, s.alt)];
    if (s.layers.length) cells.push(s.layers.map((l) => `<p>${esc(l)}</p>`).join(''));
    return row(...cells);
  }).join('');
  const start = Math.min(startOpt ? +startOpt : hero.active, slides.length);
  const rotates = slides.length > 1 && hero.duration;
  s1 = `<div><div class="hero-slider${start > 1 ? ` start-${start}` : ''}">${rows}</div>`
    + `${rotates ? `<div class="section-metadata">${row('duration', hero.duration)}</div>` : ''}</div>`;
}

// ---- section 2: body modules in source order, consecutive same-kind items grouped
let h1Done = items.some((i) => i.kind === 'text' && i.tag === 'h1');
let introH1 = -1;
let introGap = 0;
const out = [];
for (let i = 0; i < items.length;) {
  const { kind } = items[i];
  let j = i;
  while (j < items.length && (items[j].kind === kind
    // teaser rows separated only by spacer rows stay one block
    || (kind === 'teaser' && items[j].kind === 'space' && items[j + 1] && items[j + 1].kind === kind))) j += 1;
  const group = items.slice(i, j).filter((g) => g.kind !== 'space');
  if (kind === 'text') {
    group.forEach((g) => {
      let html = element(g);
      if (!h1Done && /^h[2-6]$/.test(g.tag)) {
        html = html.replace(/^<h[2-6]>/, '<h1>').replace(/<\/h[2-6]>$/, '</h1>'); // R-07
        h1Done = true;
        introH1 = out.length;
      } else if (introH1 === out.length - 1 && g.tag === 'p'
        && /^<p>(<(strong|b|em|span)>)?\s*<br\s*\/?>/.test(html)) {
        // the paragraph under the intro heading opens on a blank line (ca-experiencies:
        // <strong><br> </strong>); the delivery pipeline drops a leading <br>, so the line
        // (25px, the body line-height) rides the intro-<n> gap: 10 (h1 margin) + 25
        introGap = 10 + 25;
      }
      out.push(html);
    });
  } else if (kind === 'teaser') {
    const rows = group.map((g) => row(...g.cells.map((c) => c.map(element).join('')))).join('');
    const prev = items[i - 1];
    let top = 0;
    if (prev && prev.kind === 'space') top = prev.h + (items[i - 2] && items[i - 2].spaceAfter ? items[i - 2].spaceAfter : 0);
    else if (prev && prev.spaceAfter) top = prev.spaceAfter;
    // the space between two teasers: the upper one's trailing spacer + any spacer rows between
    const gaps = [];
    for (let k = i; k < j - 1; k += 1) {
      if (items[k].kind === 'teaser') {
        let g = items[k].spaceAfter || 0;
        let n = k + 1;
        while (items[n] && items[n].kind === 'space') {
          g += items[n].h;
          n += 1;
        }
        gaps.push(g);
      }
    }
    const gap = gaps.length ? gaps[0] : DEFAULTS.gap;
    if (new Set(gaps).size > 1) warnings.push(`teaser gaps differ (${gaps.join(',')}), using ${gap}`);
    const heads = group.flatMap((g) => g.heads);
    if (new Set(heads).size > 1) warnings.push(`teaser heading gaps differ (${heads.join(',')}), using ${heads[0]}`);
    const end = group[group.length - 1].spaceAfter || 0;
    const variants = [];
    if (top !== DEFAULTS.top) variants.push(`top-${top}`);
    if (gap !== DEFAULTS.gap && group.length > 1) variants.push(`gap-${gap}`);
    if (heads.length && heads[0]) variants.push(`head-${heads[0]}`);
    if (end !== DEFAULTS.end) variants.push(`end-${end}`);
    if (introGap && !out.some((o) => o.startsWith('<div class="media-feature'))) {
      variants.push(`intro-${introGap}`);
    }
    out.push(`<div class="media-feature${variants.length ? ` ${variants.join(' ')}` : ''}">${rows}</div>`);
  }
  i = j;
}
let s2 = `<div>${out.join('')}</div>`;
// no intro heading: the page's first text heading becomes its h1 (R-07)
if (!h1Done) {
  const re = /<(h[2-6])>((?:(?!<\/\1>)[\s\S])*?)<\/\1>/g;
  const hit = [...s2.matchAll(re)].find((m) => !m[2].includes('<img'));
  if (hit) {
    s2 = `${s2.slice(0, hit.index)}<h1>${hit[2]}</h1>${s2.slice(hit.index + hit[0].length)}`;
    warnings.push(`no intro heading: first ${hit[1]} promoted to h1 (R-07)`);
  } else warnings.push('no heading on the page: no h1');
}

// ---- section 3: metadata
const ogImage = meta.og && meta.og.image;
const mrows = [
  row('Title', esc(meta.title)),
  row('Description', esc(meta.description || '')),
];
if (ogImage) mrows.push(row('Image', img(ogImage, '')));
if (veil) mrows.push(row('header-veil', veil));
if (translations) mrows.push(row('translations', esc(translations)));
const s3 = `<div><div class="metadata">${mrows.join('')}</div></div>`;

const html = `<body><header></header><main>${s1}${s2}${s3}</main><footer></footer></body>\n`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
const counts = items.reduce((a, it) => ({ ...a, [it.kind]: (a[it.kind] || 0) + 1 }), {});
warnings.forEach((w) => console.error(`warn ${slug}: ${w}`));
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides start `
  + `${startOpt || hero.active}, ${JSON.stringify(counts)}; media ${manifest.length} → ${manifestFile})`);
