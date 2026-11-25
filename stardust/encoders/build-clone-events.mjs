#!/usr/bin/env node
// Path A' structural clone for the `events` template (archetype events): fork
// stardust/prototypes/events-proposed.html (canon chrome, head, hero shell, events.css) and rebuild
// the hero and #content from <slug>'s verbatim capture (stardust/current/pages/<slug>.{html,json}),
// walking the WPBakery rows in document order with the prototype's own section vocabulary — the
// same walk as encode-events.mjs, so the clone and the delivered document agree on structure:
//   first text-only row            → section.vc-row.events-intro > .vc-col > .text-column
//   row holding the masonry grid   → section.vc-row.events-gallery > .vc-col > .media-grid
//                                    (zone background + lightbox link href/title verbatim + img
//                                    alt verbatim; width/height read from the local asset) and
//                                    .space-<n> per spacer
//   row holding Contact Form 7     → section.vc-row.events-enquiry > .vc-col: .text-column + .cf7
//                                    (the prototype's clean form: hidden fields, recaptcha token
//                                    and screen-reader residue dropped; labels, notes, names verbatim)
//   other rows                     → div.vc-row > .vc-col (.text-column / .space-<n>)
// Hero: Revolution Slider slides in source order (bg image, intrinsic size from the lazyload
// comment / data-o*, alt "" as the archetype), text layers in source order with the prototype's
// placement grammar (data-xy x/y px → .hero-layer--xy --x/--y; x:c/y:c → --xo/--yo; s:60 →
// .hero-layer--t60, others .hero-layer--sub; a title without data-text l: → --lh25; data-dim h:<n>
// → --h<n>; colour inline unless it is the title default white), active slide (capture's
// data-slideactive, or --start <n>), duration; bullets when the page rotates.
// Chrome: the archetype's (canon, verbatim); the events active-menu trail (class + aria-current)
// moves to the sibling's own nav item when the canon nav links to it; the masthead veil is set as
// --ca-header-veil on .masthead when it differs from the archetype's.
// Asset refs become prototype-relative (`assets/<file>`, the page's own `assets/events/` first) when
// the file exists locally — the driver bundles them — else the absolute source URL is kept.
// Content verbatim; dropped empty / unknown nodes are written to <out>.deviations.json.
// usage: node stardust/encoders/build-clone-events.mjs <slug> <out.html> [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, existsSync, readdirSync, openSync, readSync, closeSync,
} from 'node:fs';

const args = process.argv.slice(2);
const si = args.indexOf('--start');
const startOpt = si > -1 ? +args[si + 1] : null;
const [slug, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--start'));
if (!slug || !outFile || slug === '--help') {
  console.error('usage: build-clone-events.mjs <slug> <out.html> [--start <n>]');
  process.exit(2);
}
const proto = readFileSync('stardust/prototypes/events-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
// the page's own captured assets first: a same-named file elsewhere can be a different photo
const DIRS = [['stardust/prototypes/assets/events', 'assets/events/'],
  ['stardust/prototypes/assets', 'assets/'], ['stardust/migrated/assets', 'assets/']]
  .filter(([d]) => existsSync(d));
const localOf = (file) => {
  for (const [d, rel] of DIRS) {
    const f = readdirSync(d).find((x) => x.normalize('NFC') === file.normalize('NFC'));
    if (f) return { path: `${d}/${f}`, rel: `${rel}${f}` };
  }
  return null;
};
// intrinsic size of a local JPEG / PNG (SOF marker / IHDR), null when unknown
const dims = (path) => {
  const fd = openSync(path, 'r');
  const buf = Buffer.alloc(256 * 1024);
  const n = readSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  if (buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < n) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
};
const fileOf = (u) => decodeURIComponent(new URL(u, 'https://www.casaargentera.com/').pathname.split('/').pop());

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage();
await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|<!--[\s\S]*?-->|\s/g, '') === '';
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  // verbatim text node: source tag + inner HTML; presentation attributes dropped, inline markup kept
  const strip = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    [c, ...c.querySelectorAll('*')].forEach((n) => {
      if (n.tagName === 'A') { n.removeAttribute('target'); n.removeAttribute('rel'); }
      [...n.attributes].filter((a) => /^(class|style|id|dir|data-.*|decoding)$/.test(a.name))
        .forEach((a) => n.removeAttribute(a.name));
    });
    return c.outerHTML;
  };
  const textItems = (el) => {
    const out = [];
    const inner = el.querySelector('.wpb_wrapper') || el;
    [...inner.children].forEach((c) => {
      if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')) {
        if (!c.matches('style, script, noscript')) dropped.push({ kind: 'drop-unknown', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'non-text node in a text column' });
        return;
      }
      const h = c.innerHTML;
      if (isBlank(h) || /^<span id="more-\d+"><\/span>$/.test(h.trim())) {
        dropped.push({ kind: 'drop-empty', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'empty node (no text, no image)' });
        return;
      }
      out.push({ kind: 'text', html: strip(c) });
    });
    return out;
  };
  const galleryItem = (el) => ({
    kind: 'gallery',
    items: [...el.querySelectorAll('.vc_grid-item')].map((it) => {
      const img = it.querySelector('img');
      const a = it.querySelector('a.vc_gitem-link, a[href]');
      return {
        src: img ? abs(img.getAttribute('src')) : null,
        alt: img ? img.getAttribute('alt') || '' : '',
        href: a ? a.getAttribute('href') : null,
        title: a ? a.getAttribute('title') || '' : '',
      };
    }).filter((g) => g.src),
  });
  // Contact Form 7 → the prototype's clean form (classes mapped, WP residue dropped)
  const CLS = {
    'wpcf7-form-control-wrap': 'cf7-wrap',
    'wpcf7-acceptance': 'cf7-acceptance',
    'wpcf7-list-item': 'cf7-list-item',
    'wpcf7-list-item-label': 'cf7-list-item-label',
    'wpcf7-spinner': 'cf7-spinner',
    'wpcf7-response-output': 'cf7-response',
  };
  const AUTO = { 'your-name': 'name', 'your-email': 'email' };
  const formItem = (el) => {
    const f = el.querySelector('form');
    const c = f.cloneNode(true);
    c.querySelectorAll('fieldset.hidden-fields-container, input[type=hidden], .screen-reader-response, noscript, script, style')
      .forEach((n) => n.remove());
    c.querySelectorAll('*').forEach((n) => {
      const cls = [...n.classList];
      const keepAttrs = {};
      if (n.matches('input, textarea, select')) {
        const type = n.tagName === 'TEXTAREA' ? 'textarea' : n.getAttribute('type');
        keepAttrs.class = type === 'submit' ? 'cf7-submit' : type === 'textarea' ? 'cf7-field cf7-textarea' : type === 'checkbox' ? null : 'cf7-field';
        ['name', 'type', 'value', 'size', 'rows', 'cols'].forEach((a) => { if (n.hasAttribute(a)) keepAttrs[a] = n.getAttribute(a); });
        if (type === 'checkbox') delete keepAttrs.size;
        const name = n.getAttribute('name') || '';
        const auto = AUTO[name] || (type === 'tel' ? 'tel' : type === 'email' ? 'email' : null);
        if (auto) keepAttrs.autocomplete = auto;
        if (n.getAttribute('aria-required')) keepAttrs['aria-required'] = n.getAttribute('aria-required');
      } else if (n.tagName === 'A') {
        keepAttrs.href = abs(n.getAttribute('href'));
        if (n.getAttribute('target')) keepAttrs.target = n.getAttribute('target');
      } else {
        const mapped = cls.map((x) => CLS[x]).filter(Boolean);
        if (mapped.length) keepAttrs.class = mapped[0];
        if (mapped[0] === 'cf7-spinner') keepAttrs['aria-hidden'] = 'true';
        if (mapped[0] === 'cf7-response') keepAttrs['aria-live'] = 'polite';
      }
      [...n.attributes].forEach((a) => n.removeAttribute(a.name));
      Object.entries(keepAttrs).forEach(([k, v]) => { if (v != null) n.setAttribute(k, v); });
    });
    c.querySelectorAll('.cf7-wrap > span:not([class])').forEach((s) => {
      if (s.querySelector('.cf7-list-item')) s.setAttribute('class', 'cf7-acceptance');
    });
    return {
      kind: 'form',
      id: el.getAttribute('id') || '',
      label: f.getAttribute('aria-label') || 'Contact form',
      action: abs(f.getAttribute('action') || ''),
      html: c.innerHTML,
    };
  };

  const sel = '.wpb_text_column, .wpcf7, .vc_grid-container-wrapper, .vc_empty_space';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .map((row) => [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row)
      .map((col) => {
        const items = [];
        const found = [];
        const walk = (node) => [...node.children].forEach((n) => {
          if (n.matches(sel)) found.push(n);
          else if (n.matches('.wpb_wrapper, .vc_column-inner, .vc_row, .wpb_column')) walk(n);
          else if (!n.matches('style, script, noscript')) {
            dropped.push({ kind: 'drop-unknown', source: String(n.className || n.tagName).slice(0, 80), target: '(none)', reason: 'module outside the events template' });
          }
        });
        walk(col);
        found.forEach((el) => {
          if (el.matches('.vc_empty_space')) items.push({ kind: 'space', h: spacerH(el) });
          else if (el.matches('.wpb_text_column')) items.push(...textItems(el));
          else if (el.matches('.vc_grid-container-wrapper')) items.push(galleryItem(el));
          else if (el.matches('.wpcf7')) items.push(formItem(el));
        });
        return { width: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12), items };
      }));

  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...(s.querySelector('rs-sbg-wrap')?.childNodes || [])]
        .find((n) => n.nodeType === Node.COMMENT_NODE);
      const dim = (k) => bg?.getAttribute(`data-o${k}`)
        || (comment ? (comment.textContent.match(new RegExp(`${k}="(\\d+)"`)) || [])[1] : null);
      const num = (re, str) => (str.match(re) || [])[1];
      const layers = [...s.querySelectorAll('rs-layer')].map((l) => {
        const xy = l.getAttribute('data-xy') || '';
        const dt = l.getAttribute('data-text') || '';
        return {
          text: l.textContent.trim(),
          size: +(num(/s:(\d+)/, dt) || 0),
          lh: num(/l:(\d+)/, dt),
          h: num(/h:(\d+)px/, l.getAttribute('data-dim') || ''),
          xc: /x:c/.test(xy),
          yc: /y:c/.test(xy),
          x: num(/(?:^|;)x:(-?\d+)px/, xy) ?? num(/xo:(-?\d+)px/, xy) ?? '0',
          y: num(/(?:^|;)y:(-?\d+)px/, xy) ?? num(/yo:(-?\d+)px/, xy) ?? '0',
          color: (l.getAttribute('data-color') || '').toLowerCase(),
        };
      }).filter((l) => l.text);
      hero.slides.push({
        key: s.getAttribute('data-key'), url: abs(url), w: dim('width'), h: dim('height'), layers,
      });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }
  const banner = document.querySelector('.masthead[role=banner], header[role=banner]');
  const veil = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  return {
    lang: document.documentElement.lang, hero, rows, dropped, veil,
  };
});

// ---- local assets (prototype-relative ref + intrinsic size)
const assets = {};
const asset = (u) => {
  if (!u) return { ref: u };
  if (!assets[u]) {
    const l = localOf(fileOf(u));
    assets[u] = l ? { ref: l.rel, ...(dims(l.path) || {}) } : { ref: u };
  }
  return assets[u];
};
src.hero.slides.forEach((s) => { s.ref = asset(s.url).ref; });
src.rows.flat().flatMap((c) => c.items).filter((i) => i.kind === 'gallery')
  .forEach((g) => g.items.forEach((it) => Object.assign(it, { a: asset(it.src) })));
if (startOpt) src.hero.active = Math.min(startOpt, src.hero.slides.length);

const pp = await ctx.newPage();
await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({ src, meta, url }) => {
  const d = document;
  const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (s, v) => { const m = q(s); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title);
  setMeta('meta[property="og:image"]', meta.og?.image);

  // ---- chrome: active trail (class + aria-current) follows this page; per-page masthead veil
  d.querySelectorAll('li.act').forEach((li) => li.classList.remove('act'));
  d.querySelectorAll('nav:not(.lang-switcher) a[aria-current="page"]').forEach((a) => a.removeAttribute('aria-current'));
  const norm = (h) => { try { return new URL(h, 'https://www.casaargentera.com/').href.replace(/\/?$/, '/'); } catch { return h; } };
  d.querySelectorAll('nav:not(.lang-switcher) li > a').forEach((a) => {
    if (norm(a.getAttribute('href')) !== norm(url)) return;
    a.setAttribute('aria-current', 'page');
    for (let li = a.parentElement; li; li = li.parentElement.closest('li')) li.classList.add('act');
  });
  const EVENTS_VEIL = 'rgba(221,153,51,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== EVENTS_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- hero
  const hs = q('#main-slideshow');
  if (!hs) fail('prototype hero missing');
  const slides = src.hero.slides.filter((s) => s.url);
  if (!slides.length) fail('capture has no hero slides');
  const layerHtml = (l) => {
    const title = l.size === 60;
    const cls = ['hero-layer', title ? 'hero-layer--t60' : 'hero-layer--sub'];
    if (title && !l.lh) cls.push('hero-layer--lh25');
    if (!(l.xc || l.yc)) cls.push('hero-layer--xy');
    if (l.h) cls.push(`hero-layer--h${l.h}`);
    const st = l.xc || l.yc ? [`--xo:${l.x}`, `--yo:${l.y}`] : [`--x:${l.x}`, `--y:${l.y}`];
    const col = l.color === '#ffffff' ? '#fff' : l.color;
    if (col && !(title && col === '#fff')) st.push(`color:${col}`);
    return `<div class="${cls.join(' ')}" style="${st.join(';')}">${esc(l.text)}</div>`;
  };
  q('.hero-slider__slides', hs).innerHTML = slides.map((s, i) => {
    const on = i + 1 === src.hero.active;
    return `<div class="hero-slide${on ? ' is-active' : ''}" data-key="${esc(s.key)}"><img class="hero-slide__bg" src="${esc(s.ref)}"${s.w ? ` width="${esc(s.w)}"` : ''}${s.h ? ` height="${esc(s.h)}"` : ''} alt=""${on ? ' fetchpriority="high"' : ' loading="lazy"'}>${s.layers.map(layerHtml).join('')}</div>`;
  }).join('');
  q('.hero-slider__bullets', hs)?.remove();
  if (slides.length < 2) {
    hs.removeAttribute('aria-roledescription');
    hs.removeAttribute('data-duration');
  } else {
    hs.setAttribute('aria-roledescription', 'carousel');
    hs.setAttribute('data-duration', src.hero.duration || '3000');
    hs.insertAdjacentHTML('beforeend', `<div class="hero-slider__bullets">${slides.map((s, i) => `<button type="button" class="hero-bullet${i + 1 === src.hero.active ? ' selected' : ''}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>`);
  }

  // ---- #content
  const KNOWN = new Set([20, 30, 32, 40, 46, 50, 56]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  const galleryHtml = (g) => `<div class="media-grid"><div class="media-grid__items">${g.items.map((it) => `<div class="media-grid__item"><div class="media-grid__zone" style="background-image: url('${esc(it.a.ref)}')">${it.href ? `<a class="media-grid__link" href="${esc(it.href)}" title="${esc(it.title)}"></a>` : ''}<img class="media-grid__img" src="${esc(it.a.ref)}"${it.a.w ? ` width="${it.a.w}" height="${it.a.h}"` : ''} alt="${esc(it.alt)}"></div></div>`).join('')}</div></div>`;
  const formHtml = (it) => `<div class="cf7" id="${esc(it.id)}"><form class="cf7-form" aria-label="${esc(it.label)}" action="${esc(it.action)}" method="post" novalidate>${it.html}</form></div>`;
  // items in order; consecutive text nodes share one .text-column
  const items = (list) => {
    const out = [];
    let run = null;
    list.forEach((it) => {
      if (it.kind === 'text') {
        if (!run) { run = []; out.push(run); }
        run.push(it.html);
        return;
      }
      run = null;
      if (it.kind === 'space') out.push(space(it.h));
      else if (it.kind === 'gallery') out.push(galleryHtml(it));
      else if (it.kind === 'form') out.push(formHtml(it));
    });
    return out.map((o) => (Array.isArray(o) ? `<div class="text-column">${o.join('')}</div>` : o)).join('');
  };
  let introDone = false;
  const out = src.rows.map((cols) => {
    const kinds = new Set(cols.flatMap((c) => c.items.map((i) => i.kind)));
    const col = (c) => `<div class="vc-col${frac(c.width)}">${items(c.items)}</div>`;
    const body = cols.map((c) => col(c)).join('');
    if (kinds.has('gallery')) return `<section class="vc-row events-gallery">${body}</section>`;
    if (kinds.has('form')) return `<section class="vc-row events-enquiry">${body}</section>`;
    if (!introDone && kinds.has('text') && [...kinds].every((k) => k === 'text' || k === 'space')) {
      introDone = true;
      return `<section class="vc-row events-intro">${body}</section>`;
    }
    return `<div class="vc-row">${body}</div>`;
  });
  q('#content').innerHTML = `\n${out.join('\n')}\n`;
  return `<!DOCTYPE html>\n${d.documentElement.outerHTML}\n`;
}, { src, meta, url: meta.url || '' });
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const all = src.rows.flat().flatMap((c) => c.items);
const n = (k) => all.filter((i) => i.kind === k).length;
const gal = all.filter((i) => i.kind === 'gallery').reduce((a, g) => a + g.items.length, 0);
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length} start ${src.hero.active}, text ${n('text')}, gallery ${gal}, forms ${n('form')}, spaces ${n('space')}, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
