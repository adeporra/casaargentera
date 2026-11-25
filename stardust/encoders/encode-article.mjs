#!/usr/bin/env node
// article encoder — editorial pages (template `article`, archetype culture; siblings es-cultura,
// nature-sport, the-house, who-we-are, the-place, beach-and-more … in en/es/ca/da).
// Reads the hydrated capture stardust/current/pages/<slug>.html (+ <slug>.json) and writes the DA
// document for the page. Content-driven: walks the source's WPBakery rows in document order, so a
// sibling that omits or adds a module (more or fewer feature rows, no intro, single-image rows, an
// image wrapped in a heading) encodes without code changes.
//
//   section 1  hero-slider [start-<n>] (rows = slides: image / text layers) + section-metadata
//              duration when the slider rotates (a single slide is static: no bullets, no timer)
//   section 2  in source order:
//                text columns (full width) → default content, verbatim (first heading promoted to h1
//                                            when the page has none — R-07; `&nbsp;` spacer
//                                            paragraphs kept: they are the source's vertical rhythm)
//                image + text rows        → media-feature (row = image column | text column, both
//                  (2+ text columns, one    verbatim, column order kept; consecutive rows merge into
//                   carrying an image)      one block). Spacing read from the WPBakery spacers:
//                                            gap-<n> between rows (default 40), top-<n> above the
//                                            first row (default 56; 0 when no spacer)
//                single-image rows        → image-grid plain (one block row per source row, one cell
//                                            per column — the program encoder's model)
//                vc_empty_space           → nothing by itself (read into the variants above)
//              any other module is reported on stderr (never silently dropped)
//   section 3  metadata (Title, Description, Image, header-veil, translations)
//
// Media: every image is authored as content.da.live/<org>/<repo>/media/<scope>/<name> (the 1536
// rendition when captured, else the file the source shows); the encoder writes the upload manifest
// (local captured file, else the source URL) for da-media-upload.mjs.
//
// usage: node stardust/encoders/encode-article.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"] [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: encode-article.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] '
    + '[--translations t] [--start n]');
  process.exit(0);
}
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : dflt;
};
const [slug, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!slug || !outFile) {
  console.error('usage: encode-article.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] [--translations t]');
  process.exit(2);
}
const scope = opt('scope', slug);
const manifestFile = opt('manifest', `stardust/.work/rollout/article/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const startOpt = opt('start', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];
const FEATURE_GAP = 40; // media-feature defaults (the archetype's spacers)
const FEATURE_TOP = 56;

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const isNbsp = (html) => /^(&nbsp;| )+$/.test(html.trim());
  // verbatim element: WordPress link attributes dropped (target/rel are not authorable), lazy-load
  // duplicates (<noscript>) dropped, every image reduced to a placeholder carrying src + alt
  const images = [];
  const clean = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    c.querySelectorAll('a').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel'); });
    c.querySelectorAll('img').forEach((im) => {
      images.push({ src: im.getAttribute('data-src') || im.getAttribute('src'), alt: im.getAttribute('alt') || '' });
      const ph = document.createElement('img');
      ph.setAttribute('data-img', String(images.length - 1));
      im.replaceWith(ph);
    });
    return c.outerHTML.trim();
  };
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote';
  const keep = (c) => {
    // comment-only paragraphs (`<!-- /wp:paragraph -->` leftovers) are blank: the delivery
    // pipeline drops them, so the encoder drops them too
    const h = c.innerHTML.replace(/<!--[\s\S]*?-->/g, '');
    if (c.querySelector('img')) return true;
    if (/^<span id="more-\d+"><\/span>$/.test(h.trim())) return false;
    return isNbsp(h) || !isBlank(h);
  };
  const asItem = (c) => ({ tag: c.tagName.toLowerCase(), html: clean(c), img: !!c.querySelector('img') });
  // a column's text in document order: text-column children, text elements and bare text left
  // directly in the column wrapper (raw shortcode text that failed to render — kept verbatim, R-09)
  const textChildren = (col) => {
    const found = [];
    const INLINE = 'a, strong, b, em, i, span, br, sup, sub, u';
    const walk = (node) => {
      let run = null; // consecutive bare text + inline elements in a wrapper → one <p>
      const flush = () => {
        if (run && run.textContent.replace(/\s+/g, ' ').trim()) {
          run.innerHTML = run.innerHTML.replace(/\s+/g, ' ').trim();
          found.push(asItem(run));
        }
        run = null;
      };
      const inWrapper = node.matches && node.matches('.wpb_wrapper');
      [...node.childNodes].forEach((n) => {
        const inline = n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && n.matches(INLINE));
        if (inWrapper && inline) {
          if (!run) run = document.createElement('p');
          run.append(n.cloneNode(true));
          return;
        }
        flush();
        if (n.nodeType !== Node.ELEMENT_NODE) return;
        if (n.matches('.wpb_text_column')) {
          const inner = n.querySelector('.wpb_wrapper') || n;
          [...inner.children].filter((c) => c.matches(TEXT)).forEach((c) => {
            if (keep(c)) found.push(asItem(c));
            // a comment-only paragraph renders empty but keeps the paragraph before it from being
            // the column's last child (its 10px margin stays): a ghost, read into the spacing below
            else if (c.matches('p') && c.innerHTML.includes('<!--')) found.push({ tag: 'p', ghost: true });
          });
        } else if (n.matches(TEXT)) {
          if (keep(n)) found.push(asItem(n));
        } else if (!n.matches('.wpb_single_image, .vc_empty_space, .vc_row, style, script, noscript')) {
          walk(n);
        }
      });
      flush();
    };
    walk(col);
    return found;
  };

  // ---- hero (Revolution Slider): slides, active slide, duration, text layers
  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    const slides = [...mod.querySelectorAll('rs-slide')];
    slides.forEach((s, i) => {
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
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row'));
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const KNOWN = '.wpb_text_column, .wpb_single_image, .vc_empty_space';
  rows.forEach((row) => {
    const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
    cols.forEach((col) => {
      col.querySelectorAll('.wpb_wrapper > *, .vc_column-inner > *').forEach((m) => {
        if (m.matches('.wpb_wrapper, .vc_column-inner, .vc_row, style, script')) return;
        if (!m.matches(`${KNOWN}, ${TEXT}, a, strong, b, em, i, span, br`) && !m.closest('.wpb_text_column, .wpb_single_image')
          && !m.querySelector(KNOWN)) unknown.push(m.className || m.tagName);
      });
    });
    const spacers = cols.flatMap((c) => [...c.querySelectorAll('.vc_empty_space')].map(spacerH));
    const texts = cols.map(textChildren);
    const singles = cols.map((c) => [...c.querySelectorAll('.wpb_single_image img')]
      .map((im) => ({ src: im.getAttribute('data-src') || im.getAttribute('src'), alt: im.getAttribute('alt') || '' })));
    const hasText = texts.some((x) => x.length);
    const hasSingle = singles.some((x) => x.length);
    if (!hasText && !hasSingle) {
      // a spacer-only row
      items.push({ kind: 'space', h: Math.max(0, ...spacers) });
    } else if (cols.length > 1 && hasText && !hasSingle && texts.some((x) => x.some((e) => e.img))) {
      items.push({ kind: 'feature', cells: texts, spaceAfter: spacers.length ? Math.max(...spacers) : 0 });
    } else if (hasSingle && !hasText) {
      items.push({ kind: 'image', cols: singles, spaceAfter: spacers.length ? Math.max(...spacers) : 0 });
    } else {
      // full-width (or mixed) text: default content in column order; single images beside text
      // become image-grid rows of their own
      cols.forEach((c, ci) => {
        texts[ci].forEach((e) => items.push({ kind: 'text', ...e }));
        if (singles[ci].length) items.push({ kind: 'image', cols: [singles[ci]], spaceAfter: 0 });
      });
      if (spacers.length && items.length) items[items.length - 1].spaceAfter = Math.max(...spacers);
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

// ---- media: local captured file (largest ≤1536 rendition), stored name, manifest
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  // dots → dashes; diacritics dropped so the stored name is plain ASCII
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url, { rendition = false } = {}) {
  const abs = new URL(url, 'https://www.casaargentera.com/').href;
  const file = decodeURIComponent(new URL(abs).pathname.split('/').pop());
  let pick = file;
  if (rendition) {
    const m = file.match(/^(.*?)(-\d+x\d+)?(\.[a-z]+)$/i);
    if (m) {
      const wanted = new RegExp(`^${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-1536x\\d+${m[3].replace('.', '\\.')}$`);
      const hit = localFiles.flatMap(([, fs]) => fs).find((f) => wanted.test(f));
      if (hit) pick = hit;
    }
  }
  const dir = localFiles.find(([, fs]) => fs.includes(pick));
  const name = storedName(pick);
  if (!manifest.some((e) => e.name === name)) {
    const entry = { file: dir ? join(dir[0], pick) : `stardust/.work/rollout/article/fetched/${pick}`, name };
    // the source's `/wp/wp-content/…` src 404s (its srcset serves `/wp-content/…`): fetch that
    if (!dir) entry.source = abs.replace(file, pick).replace('/wp/wp-content/', '/wp-content/');
    manifest.push(entry);
  }
  return `${MEDIA}${name}`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const imgTag = (url, alt, opts) => `<img src="${media(url, opts)}" alt="${esc(alt)}">`;
const img = (url, alt, opts) => `<p>${imgTag(url, alt, opts)}</p>`;
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;
// a cleaned element: image placeholders → authored images (1536 rendition), attributes WordPress
// adds to text elements dropped (class / style / id are not authorable)
const element = (e) => e.html
  .replace(/<img data-img="(\d+)">/g, (_, n) => imgTag(src.images[+n].src, src.images[+n].alt, { rendition: true }))
  .replace(/^<(\w+)[^>]*>/, '<$1>');

// ---- page-level metadata derived from the capture (overridable by flags)
const VEIL_WORDS = { 'rgba(221,153,51,0.5)': 'amber', 'rgba(221,179,110,0.5)': 'gold' };
const veil = veilOpt || (src.veilBg ? VEIL_WORDS[src.veilBg.replace(/\s+/g, '')] || src.veilBg.replace(/\s+/g, '') : 'amber');
const leaf = (href) => {
  const path = new URL(href, 'https://www.casaargentera.com/').pathname.replace(/\/+$/, '');
  return path || '/';
};
const translations = translationsOpt || (src.alternates.length
  ? src.alternates.map(([h, href]) => `${h}=${leaf(href)}`).join(', ') : null);

// ---- section 1: hero
const { hero, items } = src;
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
const out = [];
const warnings = src.unknown.map((u) => `unknown module kept out: ${u}`);
// the gap under the intro heading (h1 → next text), read from the source's rhythm: a `&nbsp;`
// paragraph adds its 25px line + 10px margin (the delivery pipeline drops empty paragraphs, so the
// space becomes the media-feature variant intro-<n>); a spacer row replaces the heading's margin
const NBSP = /^<p>(&nbsp;|\u00a0|\s)+<\/p>$/;
// ghosts (comment-only paragraphs): dropped like the delivery pipeline drops empty paragraphs; one
// that closes a text column right before a single-image row keeps that text's 10px margin → the
// image-grid variant intro-<spacer + 10>
for (let k = items.length - 1; k >= 0; k -= 1) {
  if (!items[k].ghost) continue;
  const prev = items[k - 1];
  const next = items[k + 1];
  if (prev && prev.kind === 'text' && !prev.ghost) {
    if (items[k].spaceAfter) prev.spaceAfter = items[k].spaceAfter;
    if (next && next.kind === 'image') next.introPlus = 10;
  }
  items.splice(k, 1);
}
const firstHead = h1Done ? -1 : items.findIndex((g) => g.kind === 'text' && /^h[2-6]$/.test(g.tag) && !g.img);
// a promoted source h3 keeps the h3 paint (200 30px/35px): media-feature variant intro-h3 (R-07
// "painted as the source heading"); h2 and h3 both keep the source's 10px bottom margin
const introTag = firstHead > -1 ? items[firstHead].tag : 'h2';
const INTRO_BASE = 10;
let introGap = INTRO_BASE;
if (firstHead > -1) {
  let k = firstHead + 1;
  let blanks = 0;
  while (items[k] && items[k].kind === 'text' && NBSP.test(element(items[k]))) {
    blanks += 1;
    k += 1;
  }
  if (blanks) introGap = INTRO_BASE + blanks * 35;
  else if (items[k] && items[k].kind === 'space' && items[k + 1] && items[k + 1].kind === 'text') introGap = items[k].h;
  else if (items[firstHead].spaceAfter && items[k] && items[k].kind === 'text') introGap = items[firstHead].spaceAfter;
}
for (let k = items.length - 1; k >= 0; k -= 1) {
  if (items[k].kind === 'text' && NBSP.test(element(items[k]))) {
    if (k !== firstHead + 1 && !(items[k - 1] && items[k - 1].kind === 'text' && NBSP.test(element(items[k - 1])))) {
      warnings.push(`blank paragraph dropped at item ${k} (the pipeline drops it; spacing not carried)`);
    }
    items.splice(k, 1);
  }
}
let introPending = introGap !== INTRO_BASE || introTag === 'h3';
for (let i = 0; i < items.length;) {
  const { kind } = items[i];
  let j = i;
  while (j < items.length && (items[j].kind === kind
    // feature / image rows separated only by spacers stay one block
    || (items[j].kind === 'space' && j + 1 < items.length && items[j + 1].kind === kind && kind !== 'text'))) j += 1;
  const group = items.slice(i, j).filter((g) => g.kind !== 'space');
  const spacesIn = items.slice(i, j).filter((g) => g.kind === 'space').map((g) => g.h);
  if (kind === 'text') {
    group.forEach((g) => {
      let html = element(g);
      if (!h1Done && /^h[2-6]$/.test(g.tag) && !g.img) {
        html = html.replace(/^<h[2-6]>/, '<h1>').replace(/<\/h[2-6]>$/, '</h1>'); // R-07
        h1Done = true;
      }
      out.push(html);
    });
  } else if (kind === 'feature') {
    const rows = group.map((g) => row(...g.cells.map((c) => c.map(element).join('')))).join('');
    const prev = items[i - 1];
    let top = 0;
    if (prev && prev.kind === 'space') top = prev.h;
    else if (prev && prev.spaceAfter) top = prev.spaceAfter;
    const gaps = [...spacesIn, ...group.slice(0, -1).map((g) => g.spaceAfter).filter(Boolean)];
    const gap = gaps.length ? gaps[0] : 0;
    if (new Set(gaps).size > 1) warnings.push(`feature gaps differ (${gaps.join(',')}), using ${gap}`);
    const variants = [];
    if (gap !== FEATURE_GAP && group.length > 1) variants.push(`gap-${gap}`);
    if (top !== FEATURE_TOP) variants.push(`top-${top}`);
    if (introPending && introTag === 'h3') variants.push('intro-h3');
    if (introPending && introGap !== INTRO_BASE) variants.push(`intro-${introGap}`);
    introPending = false;
    out.push(`<div class="media-feature${variants.length ? ` ${variants.join(' ')}` : ''}">${rows}</div>`);
  } else if (kind === 'image') {
    const prev = items[i - 1];
    const variants = ['plain'];
    if (group[0].introPlus && prev && prev.kind === 'text') {
      const n = (prev.spaceAfter || 0) + group[0].introPlus;
      if (n === 42) variants.push(`intro-${n}`);
      else warnings.push(`image-grid intro gap ${n}px not carried (no variant)`);
    }
    // no spacer under any image of the rows: the grid closes flush (no 46px spacer)
    if (group.every((g) => !g.spaceAfter)) variants.push('end-0');
    const rows = group.map((g) => row(...g.cols.map((c) => c.map((im) => img(im.src, im.alt, { rendition: true })).join('')))).join('');
    out.push(`<div class="image-grid ${variants.join(' ')}">${rows}</div>`);
  }
  i = j;
}
if (introPending) warnings.push(`intro gap ${introGap}px / ${introTag} not carried (no media-feature on the page)`);
let s2 = `<div>${out.join('')}</div>`;
// no intro heading at all (R-10 pages: the heading sits in a failed shortcode): the page's first
// text heading becomes its h1, painted as the source heading (R-07; media-feature h1 rule)
if (!h1Done) {
  const re = /<(h[2-6])>((?:(?!<\/\1>)[\s\S])*?)<\/\1>/g;
  const hit = [...s2.matchAll(re)].find((m) => !m[2].includes('<img'));
  if (hit) {
    s2 = s2.slice(0, hit.index) + `<h1>${hit[2]}</h1>` + s2.slice(hit.index + hit[0].length);
    h1Done = true;
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
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides start ${hero.active}, `
  + `${JSON.stringify(counts)}; media ${manifest.length} → ${manifestFile})`);
