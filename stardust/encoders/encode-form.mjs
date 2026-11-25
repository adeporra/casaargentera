#!/usr/bin/env node
// form encoder — contact pages (template `form`, archetype contact; siblings es-contacto,
// ca-contacte, da-kontakt). Reads the hydrated capture stardust/current/pages/<slug>.html
// (+ <slug>.json) and writes the DA document for the page. Content-driven: walks the source's
// WPBakery rows in document order, so a sibling that adds or omits a module (an extra text under
// the directions, more or fewer directions, more form fields or notes) encodes without code changes.
//
//   section 1  hero-slider [start-<n>] (rows = slides: image / text layers) + section-metadata
//              duration only when the slider rotates (a single slide is static)
//   section 2  full-width rows, in source order:
//                text columns        → default content, verbatim (first heading promoted to h1
//                                      when the page has none — R-07; empty paragraphs dropped)
//                vc gmaps widget     → map (one link: the embed src; link text = iframe title,
//                                      R-03); top-10 when it sits inside the text column (10px
//                                      under the paragraph instead of the 20px module gap)
//   section 3  the two-column rows (vc_col-sm-6 pairs) → section style `split`:
//                a row whose columns hold text only (one heading per column) → the column heads,
//                                      authored first as one default-content run (left, right)
//                the next two-column row → the left column's modules (icon-with-text →
//                                      icon-features, text → default content), then the right
//                                      column's module (Contact Form 7 → contact-form) LAST
//              icon-features variants read from the source: title-22 when the titles are h4
//              (The7 paints the title with its heading level: h4 22/30, h5 17/27); gap-32 when
//              32px spacers separate the boxes
//              vc_empty_space rows → nothing (the split section CSS carries the 46 / 32 rhythm)
//              any other module is reported on stderr (never silently dropped)
//   section 4  metadata (Title, Description, Image, header-veil, translations)
//
// Media: every image is authored as content.da.live/<org>/<repo>/media/<scope>/<name>; the encoder
// writes the upload manifest (local captured file, else the source URL) for da-media-upload.mjs.
//
// usage: node stardust/encoders/encode-form.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"] [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const USAGE = 'usage: encode-form.mjs <slug> <out.html> [--scope s] [--manifest f] [--veil v] '
  + '[--translations t] [--start n]';
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
const scope = opt('scope', 'contact');
const manifestFile = opt('manifest', `stardust/.work/rollout/form/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const startOpt = opt('start', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];
// R-03: the source iframe has no accessible name; the map link text becomes its title
const MAP_TITLE = 'Casa Argentera on Google Maps';

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
    // verbatim inner HTML minus WordPress attributes on inline links (target/rel are not authorable)
    const c = el.cloneNode(true);
    c.querySelectorAll('a').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel'); });
    return c.innerHTML.trim();
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
      hero.slides.push({
        url: url ? new URL(url, 'https://www.casaargentera.com/').href : null, alt, layers,
      });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }

  // ---- module readers
  const textItems = (el) => {
    const out = [];
    const inner = el.querySelector('.wpb_wrapper') || el;
    [...inner.children].forEach((c) => {
      if (c.matches('.wpb_gmaps_widget')) {
        const f = c.querySelector('iframe');
        if (f) out.push({ kind: 'map', src: f.getAttribute('src'), inText: true });
        return;
      }
      if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
      const html = clean(c);
      if (isBlank(html) || /^<span id="more-\d+"><\/span>$/.test(html)) return;
      out.push({ kind: 'text', tag: c.tagName.toLowerCase(), html });
    });
    return out;
  };
  const iconItem = (el) => {
    const i = el.querySelector('.dt-regular-icon') || el.querySelector('i');
    const cls = i ? [...i.classList] : [];
    const fa = cls.find((c) => /^fa-/.test(c) && c !== 'fa-fw');
    const ico = cls.find((c) => /^icomoon-the7-font-/.test(c));
    let icon = '';
    if (fa) icon = fa.slice(3);
    else if (ico) icon = ico.slice('icomoon-the7-font-'.length);
    const title = el.querySelector('.dt-text-title');
    const desc = el.querySelector('.dt-text-desc');
    return {
      kind: 'icon',
      icon,
      titleTag: title ? title.tagName.toLowerCase() : null,
      title: title ? clean(title) : '',
      desc: desc ? clean(desc) : '',
    };
  };
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

  // ---- rows → columns → modules (document order); spacers recorded on the module above
  const sel = '.wpb_text_column, .icon-with-text-shortcode, .wpcf7, .wpb_gmaps_widget, .vc_empty_space';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const unknown = [];
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .map((row) => {
      const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
      return cols.map((col) => {
        const items = [];
        const found = [];
        const collect = (node) => {
          [...node.children].forEach((n) => {
            if (n.matches(sel)) found.push(n);
            else if (n.matches('.wpb_content_element, .vc_grid-container-wrapper, .wpb_single_image')) {
              unknown.push(n.className.split(/\s+/).slice(0, 2).join('.'));
            } else if (!n.matches('style, script')) collect(n);
          });
        };
        collect(col);
        found.forEach((el) => {
          if (el.matches('.vc_empty_space')) {
            const last = items[items.length - 1];
            if (last) last.spaceAfter = spacerH(el);
          } else if (el.matches('.wpb_text_column')) items.push(...textItems(el));
          else if (el.matches('.wpb_gmaps_widget')) {
            const f = el.querySelector('iframe');
            if (f) items.push({ kind: 'map', src: f.getAttribute('src') });
          } else if (el.matches('.icon-with-text-shortcode')) items.push(iconItem(el));
          else if (el.matches('.wpcf7')) items.push(formItem(el));
        });
        return {
          span: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12),
          items,
        };
      });
    });

  // masthead veil (The7 per-page header background) and the Polylang translations (hreflang)
  const banner = document.querySelector('header[role=banner], .masthead[role=banner]');
  const veilBg = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => /^[a-z]{2}$/.test(h));
  return {
    hero, rows, unknown, veilBg, alternates,
  };
});
await browser.close();

// ---- media: local captured file, stored name, manifest
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  // dots → dashes; diacritics dropped so the stored name is plain ASCII
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url) {
  const abs = new URL(url, 'https://www.casaargentera.com/').href;
  const file = decodeURIComponent(new URL(abs).pathname.split('/').pop());
  const dir = localFiles.find(([, fs]) => fs.includes(file));
  const name = storedName(file);
  if (!manifest.some((e) => e.name === name)) {
    const entry = { file: dir ? join(dir[0], file) : `stardust/.work/rollout/form/fetched/${file}`, name };
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

// ---- section 1: hero
const { hero } = src;
const slides = hero.slides.filter((s) => s.url);
let s1 = '';
if (slides.length) {
  const rws = slides.map((s) => {
    const cells = [img(s.url, s.alt)];
    if (s.layers.length) cells.push(s.layers.map((l) => `<p>${esc(l)}</p>`).join(''));
    return row(...cells);
  }).join('');
  const start = Math.min(startOpt ? +startOpt : hero.active, slides.length);
  const rotates = slides.length > 1 && hero.duration;
  s1 = `<div><div class="hero-slider${start > 1 ? ` start-${start}` : ''}">${rws}</div>`
    + `${rotates ? `<div class="section-metadata">${row('duration', hero.duration)}</div>` : ''}</div>`;
}

// ---- module writers
const allItems = src.rows.flat().flatMap((c) => c.items);
let h1Done = allItems.some((i) => i.kind === 'text' && i.tag === 'h1');
const text = (g) => {
  let { tag } = g;
  if (!h1Done && /^h[2-6]$/.test(tag)) {
    tag = 'h1'; // R-07: the page's first heading is its h1, painted as the source heading
    h1Done = true;
  }
  return `<${tag}>${g.html}</${tag}>`;
};
const writeIcons = (group) => {
  const variants = [];
  if (group.every((g) => g.titleTag === 'h4')) variants.push('title-22');
  if (group.slice(0, -1).every((g) => g.spaceAfter === 32) && group.length > 1) variants.push('gap-32');
  const rws = group.map((g) => {
    const tt = g.titleTag && /^h[1-6]$/.test(g.titleTag) ? g.titleTag : 'h5';
    const body = `${g.title ? `<${tt}>${g.title}</${tt}>` : ''}${g.desc ? `<p>${g.desc}</p>` : ''}`;
    return g.icon ? row(`<p>${g.icon}</p>`, body) : row(body);
  }).join('');
  return `<div class="icon-features${variants.length ? ` ${variants.join(' ')}` : ''}">${rws}</div>`;
};
const writeForm = (g) => {
  const rws = g.fields.map((f) => (f.note
    ? row(`<p>${f.note}</p>`)
    : row(`<p>${f.word === 'submit' ? esc(f.label) : f.label}</p>`, `<p>${f.word}</p>`))).join('');
  return `<div class="contact-form">${rws}</div>`;
};
const writeMap = (g) => `<div class="map${g.inText ? ' top-10' : ''}">${row(`<p><a href="${esc(g.src)}">${MAP_TITLE}</a></p>`)}</div>`;
// items in order, consecutive icon boxes grouped into one block
const write = (items) => {
  const out = [];
  for (let i = 0; i < items.length;) {
    const { kind } = items[i];
    let j = i + 1;
    if (kind === 'icon') while (j < items.length && items[j].kind === 'icon') j += 1;
    const group = items.slice(i, j);
    if (kind === 'text') out.push(text(group[0]));
    else if (kind === 'icon') out.push(writeIcons(group));
    else if (kind === 'form') out.push(writeForm(group[0]));
    else if (kind === 'map') out.push(writeMap(group[0]));
    i = j;
  }
  return out.join('');
};

// ---- sections 2/3: full-width rows → flow section; two-column rows → split section
const warnings = src.unknown.map((u) => `unknown module kept out: ${u}`);
const sections = [];
let flow = null;
let split = null;
src.rows.forEach((cols) => {
  const filled = cols.filter((c) => c.items.length);
  if (!filled.length) return; // spacer-only row: rhythm lives in the CSS
  if (cols.length === 1) {
    if (!flow || split) {
      flow = [];
      split = null;
      sections.push({ kind: 'flow', items: flow });
    }
    flow.push(...filled[0].items);
    return;
  }
  // two-column row
  if (!split) {
    split = { heads: [], left: [], right: [] };
    sections.push({ kind: 'split', split });
  }
  const textOnly = filled.every((c) => c.items.every((it) => it.kind === 'text'));
  if (textOnly && !split.left.length && !split.right.length) {
    cols.forEach((c) => split.heads.push(...c.items));
  } else {
    split.left.push(...cols[0].items);
    cols.slice(1).forEach((c) => split.right.push(...c.items));
  }
});
const bodySections = sections.map((s) => {
  if (s.kind === 'flow') return `<div>${write(s.items)}</div>`;
  const { heads, left, right } = s.split;
  if (right.length > 1) warnings.push(`split right column holds ${right.length} modules (only the last sits right)`);
  return `<div>${write(heads)}${write(left)}${write(right)}`
    + `<div class="section-metadata">${row('style', 'split')}</div></div>`;
}).join('');

// ---- metadata
const ogImage = meta.og && meta.og.image;
const mrows = [
  row('Title', esc(meta.title)),
  row('Description', esc(meta.description || '')),
];
if (ogImage) mrows.push(row('Image', img(ogImage, '')));
if (veil) mrows.push(row('header-veil', veil));
if (translations) mrows.push(row('translations', esc(translations)));
const sMeta = `<div><div class="metadata">${mrows.join('')}</div></div>`;

const html = `<body><header></header><main>${s1}${bodySections}${sMeta}</main><footer></footer></body>\n`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
warnings.forEach((w) => console.error(`warn ${slug}: ${w}`));
const counts = allItems.reduce((a, it) => ({ ...a, [it.kind]: (a[it.kind] || 0) + 1 }), {});
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides, sections `
  + `${sections.map((s) => s.kind).join('+')}, ${JSON.stringify(counts)}; media ${manifest.length} → ${manifestFile})`);
