#!/usr/bin/env node
// Path A' structural clone for the `form` template (archetype contact): fork
// stardust/prototypes/contact-proposed.html (canon chrome, head, hero shell, contact.css) and rebuild
// #content from <slug>'s verbatim capture (stardust/current/pages/<slug>.{html,json}), walking the
// WPBakery rows in document order with the prototype's own section vocabulary — the same walk as
// encode-form.mjs, so the clone and the delivered document agree on structure:
//   first full-width text row        → section.vc-row.contact-location > .vc-col > .text-column
//                                      (text nodes verbatim — da-kontakt's intro is a <p>, kept;
//                                      the gmaps widget inside it → .map-embed, R-03 iframe title)
//   other full-width rows            → div.vc-row > .vc-col (.text-column when it holds text)
//   spacer-only rows                 → div.vc-row, one .vc-col per source column, .space-<n>
//   first two-column text-only row   → section.vc-row.contact-headings (one .text-column per column)
//   next two-column row              → section.vc-row.contact-body: left .contact-directions with
//                                      icon-with-text → .icon-text (+ --c30 when the box's own
//                                      inline CSS paints the description #303030; the icon box stays
//                                      a link where the source's is; The7's hover-state duplicate
//                                      glyph is kept `hidden`, as the source's 0×0 one), text → .text-column,
//                                      spacers → .space-<n>; right Contact Form 7 → .cf7 (the
//                                      prototype's clean form: hidden fields, recaptcha token and
//                                      screen-reader residue dropped; labels, notes, names verbatim)
// Hero: Revolution Slider slides (bg image + alt from the lazyload comment), active slide, duration;
// bullets only when the page rotates (2+ slides).
// Chrome: the archetype's (canon, verbatim); the contact active-menu trail is moved to the sibling's
// own nav item when the canon nav links to it; the masthead veil is set when it differs.
// Content verbatim; dropped empty nodes are written to <out>.deviations.json.
// usage: node stardust/encoders/build-clone-form.mjs <slug> <out.html>
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, existsSync, readdirSync,
} from 'node:fs';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile || slug === '--help') {
  console.error('usage: build-clone-form.mjs <slug> <out.html>');
  process.exit(2);
}
const proto = readFileSync('stardust/prototypes/contact-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const local = [...new Set(['stardust/prototypes/assets', 'stardust/migrated/assets']
  .filter(existsSync).flatMap((d) => readdirSync(d)))];

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage();
await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|<!--[\s\S]*?-->|\s/g, '') === '';
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
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
      if (c.matches('.wpb_gmaps_widget')) {
        const f = c.querySelector('iframe');
        if (f) out.push({ kind: 'map', src: f.getAttribute('src') });
        return;
      }
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
  const iconItem = (el) => {
    const i = el.querySelector('.dt-regular-icon') || el.querySelector('i');
    const fa = i ? [...i.classList].find((c) => /^fa-/.test(c) && c !== 'fa-fw') : null;
    const id = (el.className.match(/icon-text-id-([0-9a-f]+)/) || [])[1];
    const re = id ? new RegExp(`\\.icon-text-id-${id}\\s+\\.dt-text-desc\\s*\\{([^}]*)\\}`, 'g') : null;
    let descColor = null;
    if (re) for (const m of css.matchAll(re)) descColor = (m[1].match(/color:\s*([^;]+)/) || [])[1]?.trim() || descColor;
    const title = el.querySelector('.dt-text-title');
    const desc = el.querySelector('.dt-text-desc');
    const box = el.querySelector('.text-icon');
    return {
      kind: 'icon',
      // the icon box is a link on some boxes (da-kontakt's train: <a href="#" class="anchor-link">)
      href: box && box.tagName === 'A' ? box.getAttribute('href') : null,
      icon: fa ? fa.slice(3) : '',
      titleTag: title ? title.tagName.toLowerCase() : 'h4',
      title: title ? title.innerHTML.trim() : '',
      desc: desc ? desc.innerHTML.trim() : '',
      descColor,
    };
  };
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
    // the acceptance control wrapper: span.cf7-wrap > span.cf7-acceptance (the wpcf7-form-control
    // span carried both classes; the first mapped one wins above — fix the inner span)
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

  const sel = '.wpb_text_column, .icon-with-text-shortcode, .wpcf7, .wpb_gmaps_widget, .vc_empty_space';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .map((row) => [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row)
      .map((col) => {
        const items = [];
        const found = [];
        const collect = (node) => {
          [...node.children].forEach((n) => {
            if (n.matches(sel)) found.push(n);
            else if (n.matches('.wpb_content_element, .wpb_single_image')) {
              dropped.push({ kind: 'drop-unknown', source: n.className.slice(0, 80), target: '(none)', reason: 'module outside the form template' });
            } else if (!n.matches('style, script')) collect(n);
          });
        };
        collect(col);
        found.forEach((el) => {
          if (el.matches('.vc_empty_space')) items.push({ kind: 'space', h: spacerH(el) });
          else if (el.matches('.wpb_text_column')) items.push(...textItems(el));
          else if (el.matches('.wpb_gmaps_widget')) {
            const f = el.querySelector('iframe');
            if (f) items.push({ kind: 'map', src: f.getAttribute('src') });
          } else if (el.matches('.icon-with-text-shortcode')) items.push(iconItem(el));
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
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const dim = (k) => bg?.getAttribute(`data-o${k}`)
        || (comment ? (comment.textContent.match(new RegExp(`${k}="(\\d+)"`)) || [])[1] : null);
      hero.slides.push({
        key: s.getAttribute('data-key'), url: abs(url), alt, w: dim('width'), h: dim('height'),
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

const pp = await ctx.newPage();
await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({
  src, meta, local, url,
}) => {
  const d = document;
  const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const loc = (u) => {
    const f = decodeURIComponent(new URL(u).pathname.split('/').pop());
    return local.includes(f) ? `assets/${f}` : u;
  };
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
  const CONTACT_VEIL = 'rgba(221,179,110,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== CONTACT_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- hero
  const hs = q('#main-slideshow');
  if (!hs) fail('prototype hero missing');
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
  const MAP_TITLE = 'Casa Argentera on Google Maps'; // R-03
  const KNOWN = new Set([20, 30, 32, 40, 46, 50, 56]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  const mapHtml = (it) => `<div class="map-embed"><div class="map-embed__frame"><iframe src="${esc(it.src)}" width="600" height="450" title="${MAP_TITLE}" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>`;
  const iconHtml = (it) => `<div class="icon-text${(it.descColor || '').toLowerCase() === '#303030' ? ' icon-text--c30' : ''}">${it.href != null ? `<a href="${esc(it.href)}" class="icon-text__icon">` : '<span class="icon-text__icon" aria-hidden="true">'}<span class="icon-text__inner"><i class="fa-icon fa-icon--${esc(it.icon)}"></i><i class="fa-icon fa-icon--${esc(it.icon)}" hidden></i></span>${it.href != null ? '</a>' : '</span>'}<${it.titleTag} class="icon-text__title">${it.title}</${it.titleTag}><div class="icon-text__desc">${it.desc}</div></div>`;
  const formHtml = (it) => `<div class="cf7" id="${esc(it.id)}"><form class="cf7-form" aria-label="${esc(it.label)}" action="${esc(it.action)}" method="post" novalidate>${it.html}</form></div>`;
  // items in order; consecutive text nodes share one .text-column (a map inside it stays inside)
  const items = (list) => {
    const out = [];
    let run = null;
    list.forEach((it) => {
      if (it.kind === 'text' || (it.kind === 'map' && run)) {
        if (!run) { run = []; out.push(run); }
        run.push(it.kind === 'text' ? it.html : mapHtml(it));
        return;
      }
      run = null;
      if (it.kind === 'space') out.push(space(it.h));
      else if (it.kind === 'map') out.push(mapHtml(it));
      else if (it.kind === 'icon') out.push(iconHtml(it));
      else if (it.kind === 'form') out.push(formHtml(it));
    });
    return out.map((o) => (Array.isArray(o) ? `<div class="text-column">${o.join('')}</div>` : o)).join('');
  };
  let introDone = false;
  let headsDone = false;
  let bodyDone = false;
  const out = src.rows.map((cols) => {
    const kinds = new Set(cols.flatMap((c) => c.items.map((i) => i.kind)));
    const spacerOnly = [...kinds].every((k) => k === 'space');
    const col = (c, extra = '') => `<div class="vc-col${frac(c.width)}${extra}">${items(c.items)}</div>`;
    if (spacerOnly) return `<div class="vc-row">${cols.map((c) => col(c)).join('')}</div>`;
    if (cols.length === 1 && !introDone) {
      introDone = true;
      return `<section class="vc-row contact-location">${col(cols[0])}</section>`;
    }
    if (cols.length > 1 && !headsDone && [...kinds].every((k) => k === 'text' || k === 'space')) {
      headsDone = true;
      return `<section class="vc-row contact-headings">${cols.map((c) => col(c)).join('')}</section>`;
    }
    if (cols.length > 1 && !bodyDone) {
      bodyDone = true;
      return `<section class="vc-row contact-body">${cols.map((c, i) => col(c, i === 0 ? ' contact-directions' : '')).join('')}</section>`;
    }
    return `<div class="vc-row">${cols.map((c) => col(c)).join('')}</div>`;
  });
  q('#content').innerHTML = out.join('\n');
  return `<!DOCTYPE html>\n${d.documentElement.outerHTML}\n`;
}, {
  src, meta, local, url: meta.url || '',
});
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const all = src.rows.flat().flatMap((c) => c.items);
const n = (k) => all.filter((i) => i.kind === k).length;
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length}, text ${n('text')}, icons ${n('icon')}, maps ${n('map')}, forms ${n('form')}, spaces ${n('space')}, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
