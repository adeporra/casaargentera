#!/usr/bin/env node
// events encoder — event pages (template `events`, archetype events; siblings es-eventos,
// ca-esdeveniments, da-eventsda). Reads the hydrated capture stardust/current/pages/<slug>.html
// (+ <slug>.json) and writes the DA document for the page. Content-driven: walks the source's
// WPBakery rows in document order, so a sibling with more or fewer list items, grid images, form
// fields or slides encodes without code changes.
//
//   section 1  hero-slider title-60 [start-<n>] — one row per slide: image / text layers (title
//              first: the s:60 layer, then the subs) / placements read from the rs-layer data-xy
//              (`x:95 y:232; x:162 y:304 #ea9800`, colour = the layer's data-color when it is not
//              the block default, `lh:<n>` when a title has no data-text l:) + section-metadata
//              duration when the slider rotates
//   section 2  in source order:
//                text columns            → default content, verbatim (first heading promoted to h1
//                                          when the page has none — R-07; empty paragraphs dropped)
//                vc_masonry_media_grid   → image-grid gallery (one block row per grid row of
//                                          12/span items; cell = image + its lightbox link: file
//                                          href verbatim, link text = the source link title)
//                vc_empty_space          → nothing (the block CSS carries the 50px rhythm)
//                Contact Form 7          → contact-form (one row per field / note)
//              any other module is reported on stderr (never silently dropped)
//   section 3  metadata (Title, Description, Image, header-veil, translations)
//
// Media: every image is authored as content.da.live/<org>/<repo>/media/<scope>/<name> — the file
// the source names (local captured copy when present, else the source URL in the manifest for
// da-media-upload.mjs).
//
// usage: node stardust/encoders/encode-events.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"] [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const USAGE = 'usage: encode-events.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] '
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
const scope = opt('scope', 'events');
const manifestFile = opt('manifest', `stardust/.work/rollout/events/enc/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const startOpt = opt('start', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
// the page's own captured assets first: a same-named file elsewhere can be a different photo
// (journal, recreate — events: the Priorat hero asset)
const ASSET_DIRS = ['stardust/prototypes/assets/events', 'stardust/migrated/assets',
  'stardust/prototypes/assets'];
const FETCH_DIR = 'stardust/.work/rollout/events/fetched';
const SUB_COLOUR = '#e09500'; // hero-slider .hero-slide-placed sub default

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|<!--[\s\S]*?-->|\s/g, '') === '';
  const clean = (el) => {
    // verbatim inner HTML minus WordPress attributes on inline links (target/rel not authorable)
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    c.querySelectorAll('a').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel'); });
    // editor residue (e.g. the Google Translate paste on es/ca/da list items) is not authorable
    c.querySelectorAll('*').forEach((n) => [...n.attributes]
      .filter((a) => /^(class|style|id|dir|data-.*)$/.test(a.name))
      .forEach((a) => n.removeAttribute(a.name)));
    return c.innerHTML.trim();
  };

  // ---- hero (Revolution Slider): slides, active slide, duration, text layers + placements
  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...s.querySelector('rs-sbg-wrap')?.childNodes || []]
        .find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const layers = [...s.querySelectorAll('rs-layer')].map((l) => {
        const xy = l.getAttribute('data-xy') || '';
        const dt = l.getAttribute('data-text') || '';
        const num = (re, str) => (str.match(re) || [])[1];
        return {
          text: t(l),
          size: +(num(/s:(\d+)/, dt) || 0),
          lh: num(/l:(\d+)/, dt),
          xc: /x:c/.test(xy),
          yc: /y:c/.test(xy),
          x: num(/(?:^|;)x:(-?\d+)px/, xy) ?? num(/xo:(-?\d+)px/, xy) ?? '0',
          y: num(/(?:^|;)y:(-?\d+)px/, xy) ?? num(/yo:(-?\d+)px/, xy) ?? '0',
          color: (l.getAttribute('data-color') || '').toLowerCase(),
        };
      }).filter((l) => l.text);
      hero.slides.push({
        url: url ? new URL(url, 'https://www.casaargentera.com/').href : null, alt, layers,
      });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }

  // ---- body modules in document order
  const items = [];
  const unknown = [];
  const formItem = (el) => {
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
            text = n.slice(0, stop < 0 ? n.length : stop).map((x) => x.textContent).join('')
              .replace(/\s+/g, ' ').trim();
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
    return { kind: 'form', fields };
  };
  const galleryItem = (el) => {
    const gi = [...el.querySelectorAll('.vc_grid-item')].map((it) => {
      const img = it.querySelector('img');
      const a = it.querySelector('a.vc_gitem-link, a[href]');
      const span = +((it.className.match(/vc_col-sm-(\d+)/) || [])[1] || 4);
      return {
        src: img ? img.getAttribute('src') : null,
        alt: img ? img.getAttribute('alt') || '' : '',
        href: a ? a.getAttribute('href') : null,
        title: a ? a.getAttribute('title') || '' : '',
        perRow: Math.max(1, Math.round(12 / span)),
      };
    }).filter((g) => g.src);
    return { kind: 'gallery', items: gi };
  };
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'));
  rows.forEach((row) => {
    const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
    cols.forEach((col) => {
      const sel = '.wpb_text_column, .wpcf7, .vc_grid-container-wrapper, .vc_empty_space';
      const found = [];
      const walk = (node) => [...node.children].forEach((n) => {
        if (n.matches(sel)) found.push(n);
        else if (n.matches('.wpb_wrapper, .vc_column-inner, .vc_row, .wpb_column')) walk(n);
        else if (!n.matches('style, script, noscript')) unknown.push(n.className || n.tagName);
      });
      walk(col);
      found.forEach((el) => {
        if (el.matches('.wpb_text_column')) {
          const inner = el.querySelector('.wpb_wrapper') || el;
          [...inner.children].forEach((c) => {
            if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')) {
              unknown.push(c.className || c.tagName);
              return;
            }
            const html = clean(c);
            if (isBlank(html) || /^<span id="more-\d+"><\/span>$/.test(html)) return;
            items.push({ kind: 'text', tag: c.tagName.toLowerCase(), html });
          });
        } else if (el.matches('.wpcf7')) items.push(formItem(el));
        else if (el.matches('.vc_grid-container-wrapper')) items.push(galleryItem(el));
        else if (el.matches('.vc_empty_space')) {
          const h = +(((el.getAttribute('style') || '').match(/height:\s*(\d+)/) || [])[1] || 0);
          items.push({ kind: 'space', h });
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
    hero, items, unknown, veilBg, alternates,
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
  const abs = new URL(url, 'https://www.casaargentera.com/').href.replace('/wp/wp-content/', '/wp-content/');
  const file = decodeURIComponent(new URL(abs).pathname.split('/').pop());
  const dir = localFiles.find(([, fs]) => fs.includes(file) || fs.includes(file.normalize('NFC'))
    || fs.includes(file.normalize('NFD')));
  const name = storedName(file);
  if (!manifest.some((e) => e.name === name)) {
    let entry;
    if (dir) {
      const local = dir[1].find((f) => f.normalize('NFC') === file.normalize('NFC'));
      entry = { file: join(dir[0], local), name };
    } else entry = { file: `${FETCH_DIR}/${file}`, name, source: abs };
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
const veil = veilOpt || (veilKey ? VEIL_WORDS[veilKey] || veilKey : null);
const leaf = (href) => new URL(href, 'https://www.casaargentera.com/').pathname.replace(/\/+$/, '') || '/';
const translations = translationsOpt || (src.alternates.length
  ? src.alternates.map(([h, href]) => `${h}=${leaf(href)}`).join(', ') : null);

// ---- section 1: hero (title = the largest layer, first; subs after, in source order)
const { hero, items } = src;
const warnings = [...new Set(src.unknown)].map((u) => `unknown module kept out: ${u}`);
const slides = hero.slides.filter((s) => s.url);
let s1 = '';
if (slides.length) {
  const rws = slides.map((s) => {
    const max = Math.max(0, ...s.layers.map((l) => l.size));
    const ti = s.layers.findIndex((l) => l.size === max);
    const ordered = ti > 0 ? [s.layers[ti], ...s.layers.filter((_, k) => k !== ti)] : s.layers;
    const cells = [img(s.url, s.alt)];
    if (ordered.length) {
      cells.push(ordered.map((l) => `<p>${esc(l.text)}</p>`).join(''));
      const place = ordered.map((l, k) => {
        const x = l.xc ? `c${+l.x < 0 ? '' : '+'}${l.x}` : l.x;
        const y = l.yc ? `c${+l.y < 0 ? '' : '+'}${l.y}` : l.y;
        const parts = [`x:${x} y:${y}`];
        const dflt = k === 0 ? '#ffffff' : SUB_COLOUR;
        if (l.color && l.color !== dflt) parts.push(l.color);
        // a title without data-text l: keeps Revolution's default line height (25 at s:60)
        if (k === 0 && !l.lh) parts.push('lh:25');
        return parts.join(' ');
      }).join('; ');
      cells.push(`<p>${place}</p>`);
    }
    return row(...cells);
  }).join('');
  const start = Math.min(startOpt ? +startOpt : hero.active, slides.length);
  const rotates = slides.length > 1 && hero.duration;
  const variants = ['title-60', ...(start > 1 ? [`start-${start}`] : [])];
  s1 = `<div><div class="hero-slider ${variants.join(' ')}">${rws}</div>`
    + `${rotates ? `<div class="section-metadata">${row('duration', hero.duration)}</div>` : ''}</div>`;
}

// ---- section 2: body modules in source order
let h1Done = items.some((i) => i.kind === 'text' && i.tag === 'h1');
const out = [];
items.forEach((it) => {
  if (it.kind === 'text') {
    let { tag } = it;
    if (!h1Done && /^h[2-6]$/.test(tag)) {
      tag = 'h1'; // R-07
      h1Done = true;
    }
    out.push(`<${tag}>${it.html}</${tag}>`);
  } else if (it.kind === 'gallery') {
    const per = it.items.length ? it.items[0].perRow : 3;
    const cells = it.items.map((g) => `${img(g.src, g.alt)}`
      + `${g.href ? `<p><a href="${esc(g.href)}">${esc(g.title || g.alt)}</a></p>` : ''}`);
    const rws = [];
    for (let k = 0; k < cells.length; k += per) rws.push(row(...cells.slice(k, k + per)));
    out.push(`<div class="image-grid gallery events">${rws.join('')}</div>`);
  } else if (it.kind === 'form') {
    const rws = it.fields.map((f) => (f.note
      ? row(`<p>${f.note}</p>`)
      : row(`<p>${f.word === 'submit' ? esc(f.label) : f.label}</p>`, `<p>${f.word}</p>`))).join('');
    out.push(`<div class="contact-form">${rws}</div>`);
  }
});
if (!h1Done) warnings.push('no heading on the page: no h1');
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
warnings.forEach((w) => console.error(`warn ${slug}: ${w}`));
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides start `
  + `${startOpt || hero.active}, ${JSON.stringify(counts)}; media ${manifest.length} → ${manifestFile})`);
