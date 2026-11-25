#!/usr/bin/env node
// program encoder — accommodation pages (template `program`, archetype the-garden).
// Reads the hydrated capture stardust/current/pages/<slug>.html (+ <slug>.json) and writes the DA
// document for the page: content-driven, walks the source's WPBakery rows in document order, so a
// sibling that omits or adds a module (more image rows, no grid, extra text, more features) encodes
// without code changes.
//
//   section 1  hero-slider start-<n> (rows = slides: image / text layers) + section-metadata duration
//   section 2  in source order:
//                text columns        → default content (first heading promoted to h1 when the page
//                                      has none — R-07; empty / &nbsp; paragraphs dropped)
//                single-image rows   → image-grid plain (one block row per source row, one cell per
//                                      column; consecutive image rows merge into one block)
//                icon-with-text      → icon-features (row = icon word | heading + description)
//                Contact Form 7      → contact-form (row = label | field word [required])
//                vc_masonry_media_grid → image-grid gallery (cell = image + lightbox link: file href,
//                                      title as the link text)
//                bare wrapper text   → <p> verbatim (raw shortcodes that failed to render, R-09)
//                vc_empty_space      → nothing (the spacing lives in the block CSS); a 50px intro
//                                      spacer / 70px stacked-image spacer → image-grid variants
//                                      intro-50 / stack-70
//              icon words: Font Awesome 5 names, or The7 icomoon names (the7-home-021 …)
//   section 3  metadata (Title, Description, Image, header-veil, translations) — veil from the
//              masthead's inline background, translations from the hreflang alternates
//
// Media: every image is authored as content.da.live/<org>/<repo>/media/<scope>/<name>; the encoder
// writes the upload manifest (local captured file, else the source URL) for da-media-upload.mjs.
//
// usage: node stardust/encoders/encode-program.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"] [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : dflt;
};
const [slug, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!slug || !outFile) {
  console.error('usage: encode-program.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] [--translations t]');
  process.exit(2);
}
const scope = opt('scope', slug);
const manifestFile = opt('manifest', `stardust/.work/rollout/program/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const startOpt = opt('start', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const clean = (el) => {
    // verbatim inner HTML minus WordPress attributes on inline links (target/rel are not authorable)
    const c = el.cloneNode(true);
    c.querySelectorAll('a').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel'); });
    return c.innerHTML.trim();
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

  // ---- body: every module of #content in document order
  const items = [];
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row'));
  const sel = '.wpb_text_column, .wpb_single_image, .icon-with-text-shortcode, .wpcf7';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  rows.forEach((row, ri) => {
    const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
    cols.forEach((col, ci) => {
      // document order over the column: modules, spacers and bare text left in a WPBakery wrapper
      // (raw shortcode text that failed to render — R-09, kept verbatim)
      const found = [];
      const collect = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) {
            if (n.parentElement.matches('.wpb_wrapper') && n.textContent.trim()) found.push(n);
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            if (n.matches(`${sel}, .vc_grid-container-wrapper, .vc_empty_space`)) found.push(n);
            else if (!n.matches('style, script')) collect(n);
          }
        });
      };
      collect(col);
      const last = () => items[items.length - 1];
      found.forEach((el) => {
        if (el.nodeType === Node.TEXT_NODE) {
          items.push({ kind: 'text', tag: 'p', raw: el.textContent.replace(/\s+/g, ' ').trim() });
        } else if (el.matches('.vc_empty_space')) {
          const it = last();
          if (it && it.row === ri && it.col === ci) it.spaceAfter = spacerH(el);
        } else if (el.matches('.wpb_text_column')) {
          const inner = el.querySelector('.wpb_wrapper') || el;
          [...inner.children].forEach((c) => {
            if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
            const html = clean(c);
            if (isBlank(html) || /^<span id="more-\d+"><\/span>$/.test(html)) return;
            items.push({
              kind: 'text', tag: c.tagName.toLowerCase(), html, row: ri, col: ci,
            });
          });
        } else if (el.matches('.vc_grid-container-wrapper')) {
          // WPBakery media grid (vc_masonry_media_grid): image items linking to the file (prettyPhoto)
          const gi = [...el.querySelectorAll('.vc_grid-item')].map((it) => {
            const img = it.querySelector('img');
            const a = it.querySelector('a.vc_gitem-link, a[href]');
            const span = +((it.className.match(/vc_col-sm-(\d+)/) || [])[1] || 6);
            return {
              src: img ? img.getAttribute('src') : null,
              alt: img ? img.getAttribute('alt') || '' : '',
              href: a ? a.getAttribute('href') : null,
              title: a ? a.getAttribute('title') || '' : '',
              perRow: Math.max(1, Math.round(12 / span)),
            };
          }).filter((g) => g.src);
          if (gi.length) {
            items.push({
              kind: 'gallery', items: gi, row: ri, col: ci,
            });
          }
        } else if (el.matches('.wpb_single_image')) {
          const img = el.querySelector('img');
          if (!img) return;
          const srcset = (img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]);
          items.push({
            kind: 'image', row: ri, col: ci, src: img.getAttribute('src'), srcset, alt: img.getAttribute('alt') || '',
          });
        } else if (el.matches('.icon-with-text-shortcode')) {
          const i = el.querySelector('.dt-regular-icon') || el.querySelector('i');
          // Font Awesome 5 (`fa-<name>`) or The7's own icomoon set (`icomoon-the7-font-<name>`)
          const cls = i ? [...i.classList] : [];
          const fa = cls.find((c) => /^fa-/.test(c) && c !== 'fa-fw');
          const ico = cls.find((c) => /^icomoon-the7-font-/.test(c));
          let icon = '';
          if (fa) icon = fa.slice(3);
          else if (ico) icon = ico.slice('icomoon-the7-font-'.length);
          const title = el.querySelector('.dt-text-title');
          const desc = el.querySelector('.dt-text-desc');
          items.push({
            kind: 'icon',
            row: ri,
            col: ci,
            icon,
            titleTag: title ? title.tagName.toLowerCase() : null,
            title: title ? clean(title) : '',
            desc: desc ? clean(desc) : '',
          });
        } else if (el.matches('.wpcf7')) {
          const form = el.querySelector('form');
          const fields = [];
          [...form.children].filter((c) => c.tagName === 'P').forEach((p) => {
            const controls = [...p.querySelectorAll('input:not([type=hidden]), textarea, select')];
            if (!controls.length) {
              if (!isBlank(p.innerHTML)) fields.push({ note: clean(p) });
              return;
            }
            controls.forEach((ctl) => {
              const type = ctl.tagName === 'TEXTAREA' ? 'textarea' : ctl.type;
              const name = ctl.name || '';
              const req = ctl.getAttribute('aria-required') === 'true';
              if (type === 'submit') {
                fields.push({ label: ctl.value, word: 'submit' });
              } else if (type === 'checkbox') {
                const lab = ctl.closest('label')?.querySelector('.wpcf7-list-item-label');
                fields.push({ label: lab ? clean(lab) : '', word: `acceptance${req ? ' required' : ''}` });
              } else {
                // the label text is the label's own text before its control
                const label = ctl.closest('label');
                let text = '';
                if (label) {
                  const n = [...label.childNodes];
                  const stop = n.findIndex((x) => x.nodeType === 1 && (x.matches('br') || x.contains(ctl)));
                  text = n.slice(0, stop < 0 ? n.length : stop).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim();
                }
                let word = 'text';
                if (type === 'textarea') word = 'message';
                else if (type === 'email' || type === 'tel') word = type;
                else if (/name/.test(name)) word = 'name';
                else if (/subject/.test(name)) word = 'subject';
                fields.push({ label: text, word: `${word}${req ? ' required' : ''}` });
              }
            });
          });
          items.push({ kind: 'form', fields, row: ri, col: ci });
        }
      });
    });
  });
  // masthead veil (The7 per-page header background) and the Polylang translations (hreflang)
  const banner = document.querySelector('header[role=banner], .masthead[role=banner]');
  const veilBg = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => /^[a-z]{2}$/.test(h));
  return {
    hero, items, veilBg, alternates,
  };
});
await browser.close();

// ---- media: local captured file (largest ≤1536 rendition for grid images), stored name, manifest
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  // dots → dashes; diacritics dropped so the stored name is plain ASCII (DetalleBaño → DetalleBano)
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url, { rendition = false } = {}) {
  const file = decodeURIComponent(new URL(url, 'https://www.casaargentera.com/').pathname.split('/').pop());
  let pick = file;
  if (rendition) {
    const m = file.match(/^(.*?)(-\d+x\d+)?(\.[a-z]+)$/i);
    const wanted = new RegExp(`^${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-1536x\\d+${m[3].replace('.', '\\.')}$`);
    const hit = localFiles.flatMap(([, fs]) => fs).find((f) => wanted.test(f));
    if (hit) pick = hit;
  }
  const dir = localFiles.find(([, fs]) => fs.includes(pick));
  const name = storedName(pick);
  if (!manifest.some((e) => e.name === name)) {
    const entry = { file: dir ? join(dir[0], pick) : `stardust/.work/rollout/program/fetched/${pick}`, name };
    if (!dir) entry.source = new URL(url.replace(file, pick), 'https://www.casaargentera.com/').href;
    manifest.push(entry);
  }
  return `${MEDIA}${name}`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (url, alt, opts) => `<p><img src="${media(url, opts)}" alt="${esc(alt)}"></p>`;
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;

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
  // start slide: --start (the slide the gate's frozen reference shows — the source starts at 1 and
  // rotates; the published-origin reference freezes it after three transitions), else the capture's
  // data-slideactive
  const start = Math.min(startOpt ? +startOpt : hero.active, slides.length);
  s1 = `<div><div class="hero-slider${start > 1 ? ` start-${start}` : ''}">${rows}</div>`
    + `${hero.duration ? `<div class="section-metadata">${row('duration', hero.duration)}</div>` : ''}</div>`;
}

// ---- section 2: body modules in source order, consecutive same-kind items grouped
let h1Done = items.some((i) => i.kind === 'text' && i.tag === 'h1');
const out = [];
for (let i = 0; i < items.length;) {
  const kind = items[i].kind;
  let j = i;
  while (j < items.length && items[j].kind === kind) j += 1;
  const group = items.slice(i, j);
  if (kind === 'text') {
    group.forEach((g) => {
      let tag = g.tag;
      if (!h1Done && g.raw === undefined && /^h[2-6]$/.test(tag)) {
        tag = 'h1'; // R-07: the page's first heading is its h1, painted as the source heading
        h1Done = true;
      }
      out.push(g.raw !== undefined ? `<p>${esc(g.raw)}</p>` : `<${tag}>${g.html}</${tag}>`);
    });
  } else if (kind === 'image') {
    const byRow = new Map();
    group.forEach((g) => {
      if (!byRow.has(g.row)) byRow.set(g.row, new Map());
      const cols = byRow.get(g.row);
      if (!cols.has(g.col)) cols.set(g.col, []);
      cols.get(g.col).push(img(g.src, g.alt, { rendition: true }));
    });
    const rows = [...byRow.values()].map((cols) => row(...[...cols.values()].map((c) => c.join('')))).join('');
    // spacing variants read from the source's spacers (never per-page CSS): the text column above
    // ends with a 50px spacer (intro-50, archetype 32); a column stacks images 70px apart (stack-70)
    const variants = ['plain'];
    const prev = items[i - 1];
    if (prev && prev.kind === 'text' && prev.spaceAfter === 50) variants.push('intro-50');
    if (group.some((g, k) => g.spaceAfter === 70 && group[k + 1]
      && group[k + 1].row === g.row && group[k + 1].col === g.col)) variants.push('stack-70');
    out.push(`<div class="image-grid ${variants.join(' ')}">${rows}</div>`);
  } else if (kind === 'gallery') {
    // WPBakery media grid → image-grid gallery: one block row per grid row, one cell per item —
    // the image, then its lightbox link (href + title verbatim; the title is the caption)
    group.forEach((g) => {
      const per = g.items[0].perRow;
      const cells = g.items.map((it) => `${img(it.src, it.alt, { rendition: true })}`
        + `${it.href ? `<p><a href="${esc(it.href)}">${esc(it.title || it.alt)}</a></p>` : ''}`);
      const rws = [];
      for (let k = 0; k < cells.length; k += per) rws.push(row(...cells.slice(k, k + per)));
      out.push(`<div class="image-grid gallery">${rws.join('')}</div>`);
    });
  } else if (kind === 'icon') {
    const rows = group.map((g) => {
      const tt = g.titleTag && /^h[1-6]$/.test(g.titleTag) ? g.titleTag : 'h5';
      const body = `${g.title ? `<${tt}>${g.title}</${tt}>` : ''}${g.desc ? `<p>${g.desc}</p>` : ''}`;
      return g.icon ? row(`<p>${g.icon}</p>`, body) : row(body);
    }).join('');
    out.push(`<div class="icon-features">${rows}</div>`);
  } else if (kind === 'form') {
    group.forEach((g) => {
      const rows = g.fields.map((f) => (f.note
        ? row(`<p>${f.note}</p>`)
        : row(`<p>${f.word === 'submit' ? esc(f.label) : f.label}</p>`, `<p>${f.word}</p>`))).join('');
      out.push(`<div class="contact-form">${rows}</div>`);
    });
  }
  i = j;
}
const s2 = `<div>${out.join('')}</div>`;

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
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides start ${hero.active}, ${JSON.stringify(counts)}; media ${manifest.length} → ${manifestFile})`);
