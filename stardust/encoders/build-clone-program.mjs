#!/usr/bin/env node
// Path A' structural clone for the `program` template (archetype the-garden): fork
// stardust/prototypes/the-garden-proposed.html (canon chrome, head, hero shell, CF7 shell) and rebuild
// #content from <slug>'s verbatim capture (stardust/current/pages/<slug>.{html,json}), walking the
// WPBakery rows in document order with the prototype's own section vocabulary:
//   text-only row            → section.vc-row (first row: garden-intro; text + form: garden-contact)
//   single-image row         → section.vc-row.garden-images, vc-col--1-2 / --1-3 per source column
//   icon-with-text row       → section.vc-row.garden-features (icon-text items)
//   media grid (vc_grid)     → section.vc-row.garden-images.garden-gallery > .media-grid (lightbox links kept)
//   spacer-only row          → div.vc-row > .vc-col > .space-<n>
//   bare wrapper text        → bare text in .vc-col (unrendered shortcode text, verbatim — register R-09)
//   vc_empty_space           → .space-<n> (source height; inline height when the canon has no class)
// Hero: Revolution Slider slides (bg image + alt from the lazyload comment), active slide, duration.
// Content verbatim; dropped empty nodes are written to <out>.deviations.json for `migrate.mjs deviation`.
// Asset refs stay prototype-relative (`assets/<file>`) when the file exists under stardust/prototypes/assets
// or stardust/migrated/assets — the driver bundles them — else the absolute source URL is kept.
// usage: node stardust/encoders/build-clone-program.mjs <slug> <out.html>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile) { console.error('usage: build-clone-program.mjs <slug> <out.html>'); process.exit(2); }
const proto = readFileSync('stardust/prototypes/the-garden-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const local = [...new Set(['stardust/prototypes/assets', 'stardust/migrated/assets'].filter(existsSync).flatMap((d) => readdirSync(d)))];

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage(); await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  // verbatim element: source tag + inner HTML; WP presentation attributes dropped, inline markup kept
  const strip = (el) => {
    const c = el.cloneNode(true);
    // (data-* / dir: Google-Translate widget residue on some headings, e.g. data-placeholder="Traducción")
    [c, ...c.querySelectorAll('*')].forEach((n) => {
      [...n.attributes].filter((a) => /^(class|style|id|dir|data-.*)$/.test(a.name)).forEach((a) => n.removeAttribute(a.name));
    });
    return c;
  };
  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null, label: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...(s.querySelector('rs-sbg-wrap')?.childNodes || [])].find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      hero.slides.push({ key: s.getAttribute('data-key'), url: abs(url), alt, w: bg?.getAttribute('data-owidth'), h: bg?.getAttribute('data-oheight') });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }
  const sel = '.wpb_text_column, .wpb_single_image, .icon-with-text-shortcode, .wpcf7, .vc_empty_space, .vc_grid-container-wrapper';
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row'));
  const out = rows.map((row) => {
    const cols = [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row);
    return cols.map((col) => ({
      width: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12),
      // modules in document order, plus bare text nodes of the column wrapper (unrendered shortcode
      // text such as `[ult_content_box …]` on some da pages — visible on the source, kept verbatim: R-09)
      items: [
        ...[...col.querySelectorAll(sel)].filter((e) => !e.parentElement.closest('.wpb_text_column, .icon-with-text-shortcode, .wpcf7')),
        ...[...col.querySelectorAll('.wpb_wrapper')].filter((w) => w.parentElement.matches('.vc_column-inner') && w.closest('.wpb_column') === col)
          .flatMap((w) => [...w.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())),
      ].sort((a, z) => (a.compareDocumentPosition(z) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).map((el) => {
        if (el.nodeType === 3) return { kind: 'raw', text: el.textContent.trim() };
        if (el.matches('.vc_empty_space')) return { kind: 'space', h: parseInt(el.style.height, 10) || 0 };
        if (el.matches('.vc_grid-container-wrapper')) {
          // WPBakery media grid (ground-floor pages): lightbox-linked images, n per row (vc_col-sm-<w>)
          return {
            kind: 'gallery',
            items: [...el.querySelectorAll('.vc_grid-item')].map((gi) => {
              const img = gi.querySelector('img.vc_gitem-zone-img') || gi.querySelector('img'); const a = gi.querySelector('a.vc_gitem-link');
              return {
                width: +((gi.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12), src: abs(img?.getAttribute('src')), alt: img?.getAttribute('alt') || '',
                href: a?.getAttribute('href') || null, title: a?.getAttribute('title') || null,
              };
            }),
          };
        }
        if (el.matches('.wpb_text_column')) {
          const inner = el.querySelector('.wpb_wrapper') || el;
          const nodes = [];
          [...inner.children].forEach((c) => {
            const html = c.innerHTML.trim();
            if (isBlank(html) || /^<span id="more-\d+"><\/span>$/.test(html)) { dropped.push({ kind: 'drop-empty', source: c.outerHTML.slice(0, 160), target: '(none)', reason: c.tagName === 'PRE' ? 'empty translation-widget <pre> (no text)' : 'whitespace-only / read-more anchor node' }); return; }
            nodes.push(strip(c).outerHTML);
          });
          return { kind: 'text', nodes };
        }
        if (el.matches('.wpb_single_image')) {
          const img = el.querySelector('img');
          return img ? {
            kind: 'image', src: abs(img.getAttribute('src')), srcset: img.getAttribute('srcset'), sizes: img.getAttribute('sizes'),
            w: img.getAttribute('width'), h: img.getAttribute('height'), alt: img.getAttribute('alt') || '', href: el.querySelector('a')?.getAttribute('href') || null,
          } : { kind: 'none' };
        }
        if (el.matches('.icon-with-text-shortcode')) {
          const i = el.querySelector('.dt-regular-icon') || el.querySelector('i');
          // FA5 class (fa-<name>) or The7's icomoon font (icomoon-the7-font-<name> → icomoon-<name>)
          const fa = i && [...i.classList].find((c) => /^fa-/.test(c) && c !== 'fa-fw');
          const im = i && [...i.classList].find((c) => /^icomoon-the7-font-/.test(c));
          const icon = fa ? fa.slice(3) : im ? `icomoon-${im.slice('icomoon-the7-font-'.length)}` : '';
          const title = el.querySelector('.dt-text-title'); const desc = el.querySelector('.dt-text-desc');
          return { kind: 'icon', icon, titleTag: title ? title.tagName.toLowerCase() : 'h5', title: title ? strip(title).innerHTML.trim() : '', desc: desc ? strip(desc).innerHTML.trim() : '' };
        }
        // Contact Form 7: one <p> per source <p>, label text + control (names, types, required verbatim)
        const form = el.querySelector('form');
        const ps = [...form.children].filter((c) => c.tagName === 'P').map((p) => {
          const controls = [...p.querySelectorAll('input:not([type=hidden]), textarea, select')];
          if (!controls.length) return isBlank(p.innerHTML) ? null : { note: strip(p).innerHTML.trim() };
          return {
            controls: controls.map((ctl) => {
              const type = ctl.tagName === 'TEXTAREA' ? 'textarea' : ctl.type;
              if (type === 'submit') return { type, value: ctl.value };
              if (type === 'checkbox') {
                const lab = ctl.closest('label')?.querySelector('.wpcf7-list-item-label');
                const l = lab ? lab.cloneNode(true) : null;
                l?.querySelectorAll('a').forEach((a) => { a.removeAttribute('rel'); });
                return { type, name: ctl.name, label: l ? l.innerHTML.trim() : '' };
              }
              const label = ctl.closest('label'); let text = '';
              if (label) {
                const n = [...label.childNodes];
                const stop = n.findIndex((x) => x.nodeType === 1 && (x.matches('br') || x.contains(ctl)));
                text = n.slice(0, stop < 0 ? n.length : stop).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim();
              }
              return { type, name: ctl.name, label: text, req: ctl.getAttribute('aria-required') === 'true', autocomplete: ctl.getAttribute('autocomplete') };
            }),
          };
        }).filter(Boolean);
        return { kind: 'form', id: el.id, action: form.getAttribute('action'), aria: form.getAttribute('aria-label'), ps };
      }),
    }));
  });
  return { lang: document.documentElement.lang, hero, rows: out, dropped };
});

const assetFor = (url) => {
  const f = decodeURIComponent(new URL(url).pathname.split('/').pop());
  return local.includes(f) ? `assets/${f}` : null;
};
const pp = await ctx.newPage(); await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({ src, meta, local }) => {
  const d = document; const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const loc = (url) => { const f = decodeURIComponent(new URL(url).pathname.split('/').pop()); return local.includes(f) ? `assets/${f}` : url; };
  const locSet = (set) => (set || '').split(/\s*,\s*/).filter(Boolean).map((p) => { const [u, ...w] = p.split(/\s+/); return [loc(new URL(u, 'https://www.casaargentera.com/').href), ...w].join(' '); }).join(', ');
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (s, v) => { const m = q(s); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title);
  setMeta('meta[property="og:image"]', meta.og?.image);

  // ---- hero
  const hs = q('#main-slideshow'); if (!hs) fail('prototype hero missing');
  const slides = src.hero.slides.filter((s) => s.url);
  if (!slides.length) fail('capture has no hero slides');
  hs.setAttribute('data-duration', src.hero.duration || '3000');
  q('.hero-slider__slides', hs).innerHTML = slides.map((s, i) => {
    const on = i + 1 === src.hero.active;
    return `<div class="hero-slide${on ? ' is-active' : ''}" data-key="${esc(s.key)}"><img class="hero-slide__bg" src="${esc(loc(s.url))}"${s.w ? ` width="${esc(s.w)}"` : ''}${s.h ? ` height="${esc(s.h)}"` : ''} alt="${esc(s.alt)}"${on ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`;
  }).join('');
  q('.hero-slider__bullets', hs).innerHTML = slides.map((s, i) => `<button type="button" class="hero-bullet${i + 1 === src.hero.active ? ' selected' : ''}" aria-label="Slide ${i + 1}"></button>`).join('');

  // ---- #content
  const KNOWN = new Set([20, 30, 32, 46, 50]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  const field = (c) => {
    if (c.type === 'submit') return `<input class="cf7-submit" type="submit" value="${esc(c.value)}"><span class="cf7-spinner" aria-hidden="true"></span>`;
    if (c.type === 'checkbox') return `<span class="cf7-wrap"><span class="cf7-acceptance"><span class="cf7-list-item"><label><input name="${esc(c.name)}" type="checkbox" value="1"><span class="cf7-list-item-label">${c.label}</span></label></span></span></span>`;
    const attrs = `name="${esc(c.name)}"${c.autocomplete ? ` autocomplete="${esc(c.autocomplete)}"` : ''}${c.req ? ' aria-required="true"' : ''}`;
    const ctl = c.type === 'textarea' ? `<textarea class="cf7-field cf7-textarea" ${attrs} rows="10" cols="40"></textarea>` : `<input class="cf7-field" ${attrs} type="${esc(c.type)}" value="" size="40">`;
    return `<label> ${esc(c.label)}<br> <span class="cf7-wrap">${ctl}</span> </label>`;
  };
  const item = (it) => {
    if (it.kind === 'space') return space(it.h);
    if (it.kind === 'text') return `<div class="text-column">${it.nodes.join('')}</div>`;
    if (it.kind === 'image') {
      const img = `<img src="${esc(loc(it.src))}"${it.srcset ? ` srcset="${esc(locSet(it.srcset))}"` : ''}${it.sizes ? ` sizes="${esc(it.sizes)}"` : ''}${it.w ? ` width="${esc(it.w)}" height="${esc(it.h)}"` : ''} alt="${esc(it.alt)}" loading="lazy">`;
      return `<figure class="single-image"><div class="single-image__wrap">${it.href ? `<a href="${esc(it.href)}">${img}</a>` : img}</div></figure>`;
    }
    if (it.kind === 'raw') return esc(it.text); // bare text in the column, as on the source
    if (it.kind === 'gallery') {
      return `<div class="media-grid">${it.items.map((g) => `<div class="vc-col${frac(g.width)}"><figure class="single-image"><div class="single-image__wrap">${g.href ? `<a href="${esc(g.href)}"${g.title ? ` title="${esc(g.title)}"` : ''}>` : ''}<img src="${esc(loc(g.src))}" alt="${esc(g.alt)}" loading="lazy">${g.href ? '</a>' : ''}</div></figure></div>`).join('')}</div>`;
    }
    if (it.kind === 'icon') return `<div class="icon-text"><span class="icon-text__icon" aria-hidden="true"><span class="icon-text__inner"><i class="fa-icon fa-icon--${esc(it.icon)}"></i></span></span><${it.titleTag} class="icon-text__title">${it.title}</${it.titleTag}><div class="icon-text__desc">${it.desc}</div></div>`;
    if (it.kind === 'form') {
      const ps = it.ps.map((p) => (p.note != null ? `<p>${p.note}</p>` : `<p>${p.controls.map(field).join('<br> ')}</p>`)).join('');
      return `<div class="cf7" id="${esc(it.id)}"><form class="cf7-form" aria-label="${esc(it.aria || 'Contact form')}" action="${esc(it.action)}" method="post" novalidate>${ps}<div class="cf7-response" aria-live="polite"></div></form></div>`;
    }
    return '';
  };
  const out = src.rows.map((cols, ri) => {
    const kinds = new Set(cols.flatMap((c) => c.items.map((i) => i.kind)));
    const body = cols.map((c) => `<div class="vc-col${frac(c.width)}">${c.items.map(item).join('')}</div>`).join('');
    let cls = null;
    if (kinds.has('form')) cls = 'garden-contact';
    else if (kinds.has('image')) cls = 'garden-images';
    else if (kinds.has('gallery')) cls = 'garden-images garden-gallery';
    else if (kinds.has('icon')) cls = 'garden-features';
    else if (kinds.has('text') && ri === 0) cls = 'garden-intro';
    return cls ? `<section class="vc-row ${cls}">${body}</section>` : `<div class="vc-row">${body}</div>`;
  });
  q('#content').innerHTML = out.join('');
  return '<!DOCTYPE html>\n' + d.documentElement.outerHTML + '\n';
}, { src, meta, local });
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const imgs = src.rows.flat().flatMap((c) => c.items).flatMap((i) => (i.kind === 'gallery' ? i.items : i.kind === 'image' ? [i] : []));
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length}, images ${imgs.length} [${imgs.filter((i) => assetFor(i.src)).length} local], dropped ${src.dropped.length})`);
await b.close();
