#!/usr/bin/env node
// Path A' structural clone for the `article` template (archetype culture): fork
// stardust/prototypes/culture-proposed.html (canon chrome, head, hero shell, culture.css) and rebuild
// #content from <slug>'s verbatim capture (stardust/current/pages/<slug>.{html,json}), walking the
// WPBakery rows in document order with the prototype's own section vocabulary — the same walk as
// encode-article.mjs, so the clone and the delivered document agree on structure:
//   first text row                  → section.vc-row.culture-intro > .vc-col.text-column
//   other full-width text rows      → div.vc-row > .vc-col.text-column
//   image + text rows (2+ columns,  → section.vc-row.culture-feature, vc-col--1-2 (or --n-12) per
//     one carrying an inline image)   source column, every column a .text-column, nodes verbatim
//                                     (an image wrapped in <h3> stays in its <h3>)
//   single-image rows               → section.vc-row.culture-images > .vc-col > figure.single-image
//   spacer-only row / column spacer → .space-<n> (inline height when neither canon nor culture.css
//                                     carries the class)
//   bare wrapper text + inline runs → verbatim text in the column (unrendered shortcode text such as
//                                     `[ultimate_heading …]` — visible on the source; R-09 class)
// Hero: Revolution Slider slides (bg image + alt from the lazyload comment), active slide, duration;
// bullets only when the page rotates (2+ slides) — the archetype's single slide carries none.
// Chrome: the archetype's (canon, verbatim); the culture-specific active-menu trail is moved to the
// sibling's own nav item when the canon nav links to it; the per-page masthead veil (inline
// background on the source masthead) is set as --ca-header-veil on .masthead when it differs.
// Content verbatim; dropped empty nodes are written to <out>.deviations.json for `migrate.mjs deviation`.
// Asset refs stay prototype-relative (`assets/<file>`) when the file exists under stardust/prototypes/assets
// or stardust/migrated/assets — the driver bundles them — else the absolute source URL is kept.
// usage: node stardust/encoders/build-clone-article.mjs <slug> <out.html>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile || slug === '--help') { console.error('usage: build-clone-article.mjs <slug> <out.html>'); process.exit(2); }
const proto = readFileSync('stardust/prototypes/culture-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const local = [...new Set(['stardust/prototypes/assets', 'stardust/migrated/assets'].filter(existsSync).flatMap((d) => readdirSync(d)))];

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage(); await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const isNbsp = (html) => /^(&nbsp;| )+$/.test(html.trim());
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  // verbatim element: source tag + inner HTML; WP presentation attributes dropped (an image keeps its
  // align* class, src, srcset, sizes, size and alt), inline markup kept; lazy-load duplicates dropped
  const strip = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    [c, ...c.querySelectorAll('*')].forEach((n) => {
      if (n.tagName === 'IMG') {
        const s = n.getAttribute('data-src') || n.getAttribute('src');
        const set = n.getAttribute('data-srcset') || n.getAttribute('srcset');
        const align = (n.getAttribute('class') || '').split(/\s+/).filter((x) => /^align/.test(x)).join(' ');
        const keep = { src: abs(s), srcset: set, sizes: n.getAttribute('data-sizes') || n.getAttribute('sizes'), width: n.getAttribute('width'), height: n.getAttribute('height'), alt: n.getAttribute('alt') || '' };
        [...n.attributes].forEach((a) => n.removeAttribute(a.name));
        if (align) n.setAttribute('class', align);
        Object.entries(keep).forEach(([k, v]) => { if (v != null && (v !== '' || k === 'alt')) n.setAttribute(k, v); });
        n.setAttribute('loading', 'lazy');
        return;
      }
      if (n.tagName === 'A') { n.removeAttribute('target'); n.removeAttribute('rel'); } // as the archetype (not authorable)
      // (data-* / dir / lang-less ids: Google-Translate widget residue, e.g. data-placeholder="Traducción")
      [...n.attributes].filter((a) => /^(class|style|id|dir|data-.*|decoding)$/.test(a.name)).forEach((a) => n.removeAttribute(a.name));
    });
    return c;
  };
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote';
  const INLINE = 'a, strong, b, em, i, span, br, sup, sub, u';
  const keepNode = (c) => {
    const h = c.innerHTML.replace(/<!--[\s\S]*?-->/g, ''); // a comment-only node (`<!-- /wp:post-content -->`) is empty
    if (c.querySelector('img')) return true;
    if (/^<span id="more-\d+"><\/span>$/.test(h.trim())) return false;
    return isNbsp(h) || !isBlank(h);
  };
  const dropNode = (c) => dropped.push({ kind: 'drop-empty', source: c.outerHTML.slice(0, 160), target: '(none)', reason: c.tagName === 'PRE' ? 'empty translation-widget <pre> (no text)' : /<!--/.test(c.innerHTML) ? 'comment-only node (Gutenberg block delimiter, no text)' : 'empty / read-more anchor node (no text, no image)' });
  // a column's items in document order: text nodes (verbatim elements), bare runs, spacers, single images
  const colItems = (col) => {
    const out = [];
    const walk = (node) => {
      const inWrapper = node.matches && node.matches('.wpb_wrapper');
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          if (inWrapper && n.textContent.trim()) out.push({ kind: 'raw', html: n.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') });
          return;
        }
        if (n.nodeType !== Node.ELEMENT_NODE) return;
        if (inWrapper && n.matches(INLINE)) { out.push({ kind: 'raw', html: strip(n).outerHTML }); return; }
        if (n.matches('.wpb_text_column')) {
          const inner = n.querySelector('.wpb_wrapper') || n;
          const nodes = [];
          [...inner.children].forEach((c) => { if (c.matches(TEXT) && keepNode(c)) nodes.push({ html: strip(c).outerHTML, img: !!c.querySelector('img') }); else dropNode(c); });
          out.push({ kind: 'text', nodes });
        } else if (n.matches('.vc_empty_space')) {
          out.push({ kind: 'space', h: parseInt((n.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10) });
        } else if (n.matches('.wpb_single_image')) {
          const img = n.querySelector('img');
          if (img) {
            out.push({
              kind: 'image', src: abs(img.getAttribute('data-src') || img.getAttribute('src')), srcset: img.getAttribute('data-srcset') || img.getAttribute('srcset'), sizes: img.getAttribute('data-sizes') || img.getAttribute('sizes'),
              w: img.getAttribute('width'), h: img.getAttribute('height'), alt: img.getAttribute('alt') || '', href: n.querySelector('a')?.getAttribute('href') || null,
            });
          }
        } else if (n.matches(TEXT)) {
          if (keepNode(n)) out.push({ kind: 'text', nodes: [{ html: strip(n).outerHTML, img: !!n.querySelector('img') }] }); else dropNode(n);
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
const html = await pp.evaluate(({ src, meta, local, url }) => {
  const d = document; const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const loc = (u) => { const f = decodeURIComponent(new URL(u).pathname.split('/').pop()); return local.includes(f) ? `assets/${f}` : u; };
  const locSet = (set) => (set || '').split(/\s*,\s*/).filter(Boolean).map((p) => { const [u, ...w] = p.split(/\s+/); return [loc(new URL(u, 'https://www.casaargentera.com/').href), ...w].join(' '); }).join(', ');
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
  const CULTURE_VEIL = 'rgba(221,153,51,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== CULTURE_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- hero
  const hs = q('#main-slideshow'); if (!hs) fail('prototype hero missing');
  const slides = src.hero.slides.filter((s) => s.url);
  if (!slides.length) fail('capture has no hero slides');
  q('.hero-slider__slides', hs).innerHTML = slides.map((s, i) => {
    const on = i + 1 === src.hero.active;
    return `<div class="hero-slide${on ? ' is-active' : ''}" data-key="${esc(s.key)}"><img class="hero-slide__bg" src="${esc(loc(s.url))}"${s.w ? ` width="${esc(s.w)}"` : ''}${s.h ? ` height="${esc(s.h)}"` : ''} alt="${esc(s.alt)}"${on ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`;
  }).join('');
  q('.hero-slider__bullets', hs)?.remove();
  if (slides.length > 1) {
    hs.setAttribute('aria-roledescription', 'carousel');
    hs.setAttribute('data-duration', src.hero.duration || '3000');
    hs.insertAdjacentHTML('beforeend', `<div class="hero-slider__bullets">${slides.map((s, i) => `<button type="button" class="hero-bullet${i + 1 === src.hero.active ? ' selected' : ''}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>`);
  }

  // ---- #content
  const KNOWN = new Set([20, 30, 32, 40, 50, 56]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  // inline images inside text: localize src / srcset (verbatim otherwise)
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
    if (it.kind === 'raw') return it.html;
    if (it.kind === 'text') return it.nodes.map((n) => locImgs(n.html)).join('');
    if (it.kind === 'image') {
      const img = `<img src="${esc(loc(it.src))}"${it.srcset ? ` srcset="${esc(locSet(it.srcset))}"` : ''}${it.sizes ? ` sizes="${esc(it.sizes)}"` : ''}${it.w ? ` width="${esc(it.w)}" height="${esc(it.h)}"` : ''} alt="${esc(it.alt)}" loading="lazy">`;
      return `<figure class="single-image"><div class="single-image__wrap">${it.href ? `<a href="${esc(it.href)}">${img}</a>` : img}</div></figure>`;
    }
    return '';
  };
  let introDone = false;
  const out = src.rows.map((cols) => {
    const kinds = new Set(cols.flatMap((c) => c.items.map((i) => i.kind)));
    const hasInlineImg = cols.some((c) => c.items.some((i) => i.kind === 'text' && i.nodes.some((n) => n.img)));
    const textish = kinds.has('text') || kinds.has('raw');
    const colHtml = (c, extra = '') => `<div class="vc-col${frac(c.width)}${extra}">${c.items.map(item).join('')}</div>`;
    if (cols.length > 1 && hasInlineImg && !kinds.has('image')) {
      introDone = true;
      return `<section class="vc-row culture-feature">${cols.map((c) => colHtml(c, ' text-column')).join('')}</section>`;
    }
    if (kinds.has('image') && !textish) {
      introDone = true;
      return `<section class="vc-row culture-images">${cols.map((c) => colHtml(c)).join('')}</section>`;
    }
    if (textish && !introDone) {
      introDone = true;
      return `<section class="vc-row culture-intro">${cols.map((c) => colHtml(c, ' text-column')).join('')}</section>`;
    }
    return `<div class="vc-row">${cols.map((c) => colHtml(c, textish ? ' text-column' : '')).join('')}</div>`;
  });
  q('#content').innerHTML = out.join('');
  // the first content image is eager, as on the archetype (fetchpriority high)
  const first = q('#content img');
  if (first) { first.removeAttribute('loading'); first.setAttribute('fetchpriority', 'high'); }
  return '<!DOCTYPE html>\n' + d.documentElement.outerHTML + '\n';
}, { src, meta, local, url: meta.url || '' });
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const items = src.rows.flat().flatMap((c) => c.items);
const n = (k) => items.filter((i) => i.kind === k).length;
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length}, text ${n('text')}, images ${n('image')} single + ${items.filter((i) => i.kind === 'text').flatMap((i) => i.nodes).filter((x) => x.img).length} inline, raw ${n('raw')}, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
