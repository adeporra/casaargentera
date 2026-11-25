#!/usr/bin/env node
// Path A' structural clone for the `listing` template (archetype experiences): fork
// stardust/prototypes/experiences-proposed.html (canon chrome, head, hero shell, experiences.css) and
// rebuild #content from <slug>'s verbatim capture (stardust/current/pages/<slug>.{html,json}), walking
// the WPBakery rows in document order with the prototype's own section vocabulary — the same walk as
// encode-listing.mjs, so the clone and the delivered document agree on structure:
//   first text row (no image)      → section.vc-row.exp-intro > .vc-col > .text-column
//   spacer-only row                → div.vc-row.exp-spacer > .vc-col > .space-<n>
//   teaser rows (a text column     → section.vc-row.exp-row.exp-<key> > .vc-col: one .text-column per
//     carrying an inline image)      non-empty source text column + .space-<n> per spacer, in order
//                                    (da-oplevelser "Kultur": two image columns, both kept)
//   other text rows                → div.vc-row > .vc-col > .text-column
//   empty text column              → dropped (written to <out>.deviations.json, as the archetype)
// <key> follows the archetype's teaser order (nature, culture, beach); a fourth+ teaser gets exp-<n>.
// Hero: Revolution Slider slides (bg image + alt from the lazyload comment), active slide (capture's
// data-slideactive, or --start <n>), duration; bullets when the page rotates.
// Chrome: the archetype's (canon, verbatim); the experiences active-menu trail is moved to the
// sibling's own nav item when the canon nav links to it; the masthead veil is set as
// --ca-header-veil on .masthead when it differs from the archetype's.
// Images: verbatim (src / srcset / alt / size; lazy-load <noscript> duplicates dropped). Asset refs
// become prototype-relative (`assets/<file>`) when the file exists under stardust/prototypes/assets or
// stardust/migrated/assets — the driver bundles them — else the absolute source URL is kept.
// usage: node stardust/encoders/build-clone-listing.mjs <slug> <out.html> [--start <n>]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, existsSync, readdirSync,
} from 'node:fs';

const args = process.argv.slice(2);
const si = args.indexOf('--start');
const startOpt = si > -1 ? +args[si + 1] : null;
const [slug, outFile] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--start'));
if (!slug || !outFile || args.includes('--help')) {
  console.error('usage: build-clone-listing.mjs <slug> <out.html> [--start <n>]');
  process.exit(2);
}
const proto = readFileSync('stardust/prototypes/experiences-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const local = [...new Set(['stardust/prototypes/assets', 'stardust/migrated/assets']
  .filter(existsSync).flatMap((d) => readdirSync(d)))];

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage(); await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const isBlank = (html) => html.replace(/<!--[\s\S]*?-->|&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  const strip = (el) => {
    const c = el.cloneNode(true);
    // the lazy <img> carries no srcset; its <noscript> duplicate does — lift srcset / sizes from it
    c.querySelectorAll('img').forEach((im) => {
      if (im.getAttribute('srcset') || im.getAttribute('data-srcset')) return;
      const ns = im.nextElementSibling?.tagName === 'NOSCRIPT' ? im.nextElementSibling : null;
      const t = ns && document.createElement('template');
      if (t) t.innerHTML = ns.textContent || ns.innerHTML;
      const twin = t?.content.querySelector('img');
      if (twin?.getAttribute('srcset')) im.setAttribute('srcset', twin.getAttribute('srcset'));
      if (twin?.getAttribute('sizes')) im.setAttribute('sizes', twin.getAttribute('sizes'));
    });
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    [c, ...c.querySelectorAll('*')].forEach((n) => {
      if (n.tagName === 'IMG') {
        const s = n.getAttribute('data-src') || n.getAttribute('src');
        const set = n.getAttribute('data-srcset') || n.getAttribute('srcset');
        const align = (n.getAttribute('class') || '').split(/\s+/).filter((x) => /^align/.test(x)).join(' ');
        const keep = {
          src: abs(s), srcset: set, sizes: n.getAttribute('data-sizes') || n.getAttribute('sizes'),
          width: n.getAttribute('width'), height: n.getAttribute('height'), alt: n.getAttribute('alt') || '',
        };
        [...n.attributes].forEach((a) => n.removeAttribute(a.name));
        if (align) n.setAttribute('class', align);
        Object.entries(keep).forEach(([k, v]) => { if (v != null && (v !== '' || k === 'alt')) n.setAttribute(k, v); });
        n.setAttribute('loading', 'lazy');
        return;
      }
      if (n.tagName === 'A') { n.removeAttribute('target'); n.removeAttribute('rel'); }
      [...n.attributes].filter((a) => /^(class|style|id|dir|data-.*|decoding)$/.test(a.name))
        .forEach((a) => n.removeAttribute(a.name));
    });
    return c;
  };
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote';
  const colItems = (col) => {
    const out = [];
    const walk = (node) => {
      [...node.children].forEach((n) => {
        if (n.matches('.wpb_text_column')) {
          const inner = n.querySelector('.wpb_wrapper') || n;
          const nodes = [];
          [...inner.children].forEach((c) => {
            if (c.matches(TEXT) && (c.querySelector('img') || !isBlank(c.innerHTML))) {
              nodes.push({ html: strip(c).outerHTML, img: !!c.querySelector('img') });
            } else if (!c.matches('noscript, script, style')) {
              dropped.push({ kind: 'drop-empty', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'empty node (no text, no image)' });
            }
          });
          if (nodes.length) out.push({ kind: 'text', nodes });
          else dropped.push({ kind: 'drop-empty', source: n.outerHTML.replace(/\s+/g, ' ').slice(0, 160), target: '(none)', reason: 'empty WPBakery text column (no text, no image) — dropped as on the archetype' });
        } else if (n.matches('.vc_empty_space')) {
          out.push({ kind: 'space', h: parseInt((n.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10) });
        } else if (n.matches(TEXT)) {
          if (!isBlank(n.innerHTML) || n.querySelector('img')) out.push({ kind: 'text', nodes: [{ html: strip(n).outerHTML, img: !!n.querySelector('img') }] });
        } else if (!n.matches('style, script, noscript')) {
          walk(n);
        }
      });
    };
    walk(col);
    return out;
  };

  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...(s.querySelector('rs-sbg-wrap')?.childNodes || [])].find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const dim = (k) => bg?.getAttribute(`data-o${k}`) || (comment ? (comment.textContent.match(new RegExp(`${k}="(\\d+)"`)) || [])[1] : null);
      hero.slides.push({ key: s.getAttribute('data-key'), url: abs(url), alt, w: dim('width'), h: dim('height') });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row')).map((row) => (
    [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row).map((col) => ({
      width: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12),
      items: colItems(col),
    }))));
  const banner = document.querySelector('.masthead[role=banner], header[role=banner]');
  const veil = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  return { lang: document.documentElement.lang, hero, rows, dropped, veil };
});

const pp = await ctx.newPage(); await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({ src, meta, local, url, startOpt }) => {
  const d = document; const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const loc = (u) => { const f = decodeURIComponent(new URL(u).pathname.split('/').pop()); return local.includes(f) ? `assets/${f}` : u; };
  const locSet = (set) => (set || '').split(/\s*,\s*/).filter(Boolean).map((p) => {
    const [u, ...w] = p.split(/\s+/); return [loc(new URL(u, 'https://www.casaargentera.com/').href), ...w].join(' ');
  }).join(', ');
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (s, v) => { const m = q(s); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title);
  setMeta('meta[property="og:image"]', meta.og?.image);

  // ---- chrome: active trail follows this page; per-page masthead veil
  d.querySelectorAll('li.act').forEach((li) => li.classList.remove('act'));
  const norm = (h) => { try { return new URL(h, 'https://www.casaargentera.com/').href.replace(/\/?$/, '/'); } catch { return h; } };
  d.querySelectorAll('nav:not(.lang-switcher) li > a').forEach((a) => {
    if (norm(a.getAttribute('href')) !== norm(url)) return;
    for (let li = a.parentElement; li; li = li.parentElement.closest('li')) li.classList.add('act');
  });
  const ARCH_VEIL = 'rgba(221,179,110,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== ARCH_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- hero
  const hs = q('#main-slideshow'); if (!hs) fail('prototype hero missing');
  const slides = src.hero.slides.filter((s) => s.url);
  if (!slides.length) fail('capture has no hero slides');
  const active = Math.min(startOpt || src.hero.active, slides.length);
  q('.hero-slider__slides', hs).innerHTML = slides.map((s, i) => {
    const on = i + 1 === active;
    return `<div class="hero-slide${on ? ' is-active' : ''}" data-key="${esc(s.key)}"><img class="hero-slide__bg" src="${esc(loc(s.url))}"${s.w ? ` width="${esc(s.w)}"` : ''}${s.h ? ` height="${esc(s.h)}"` : ''} alt="${esc(s.alt)}"${on ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`;
  }).join('');
  q('.hero-slider__bullets', hs)?.remove();
  if (slides.length > 1) {
    hs.setAttribute('aria-roledescription', 'carousel');
    hs.setAttribute('data-duration', src.hero.duration || '3500');
    hs.insertAdjacentHTML('beforeend', `<div class="hero-slider__bullets">${slides.map((s, i) => `<button type="button" class="hero-bullet${i + 1 === active ? ' selected' : ''}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>`);
  } else {
    hs.removeAttribute('aria-roledescription');
    hs.removeAttribute('data-duration');
  }

  // ---- #content
  const KNOWN = new Set([20, 30, 32, 40, 50, 56]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const locImgs = (h) => {
    const t = d.createElement('template'); t.innerHTML = h;
    t.content.querySelectorAll('img').forEach((im) => {
      im.setAttribute('src', loc(im.getAttribute('src')));
      if (im.getAttribute('srcset')) im.setAttribute('srcset', locSet(im.getAttribute('srcset')));
    });
    return t.innerHTML;
  };
  const item = (it) => {
    if (it.kind === 'space') return space(it.h);
    if (it.kind === 'text') return `<div class="text-column">${it.nodes.map((n) => locImgs(n.html)).join('')}</div>`;
    return '';
  };
  const KEYS = ['nature', 'culture', 'beach'];
  let introDone = false; let teaser = 0;
  const out = src.rows.map((cols) => {
    const items = cols.flatMap((c) => c.items);
    const kinds = new Set(items.map((i) => i.kind));
    const hasImg = items.some((i) => i.kind === 'text' && i.nodes.some((n) => n.img));
    const colHtml = (c) => `<div class="vc-col">${c.items.map(item).join('')}</div>`;
    if (!kinds.has('text')) return `<div class="vc-row exp-spacer">${cols.map(colHtml).join('')}</div>`;
    if (hasImg) {
      introDone = true; teaser += 1;
      return `<section class="vc-row exp-row exp-${KEYS[teaser - 1] || teaser}">${cols.map(colHtml).join('')}</section>`;
    }
    if (!introDone) { introDone = true; return `<section class="vc-row exp-intro">${cols.map(colHtml).join('')}</section>`; }
    return `<div class="vc-row">${cols.map(colHtml).join('')}</div>`;
  });
  q('#content').innerHTML = out.join('');
  // the first content image is eager, as on the archetype
  q('#content img')?.removeAttribute('loading');
  return '<!DOCTYPE html>\n' + d.documentElement.outerHTML + '\n';
}, { src, meta, local, url: meta.url || '', startOpt });
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const items = src.rows.flat().flatMap((c) => c.items);
const imgs = items.filter((i) => i.kind === 'text').flatMap((i) => i.nodes).filter((x) => x.img).length;
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length} start ${startOpt || src.hero.active}, text ${items.filter((i) => i.kind === 'text').length}, images ${imgs} inline, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
